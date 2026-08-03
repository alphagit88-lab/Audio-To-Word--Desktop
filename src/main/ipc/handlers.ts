import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { GeminiTranscriptionService } from '../services/gemini.service';
import { DocxGeneratorService } from '../services/docx.service';
import { AudioProcessingService } from '../services/audio.service';
import { ConversionResult, AudioFileInfo, ConversionResumeState, ConversionPromptOptions } from '../../types';

function timeToSeconds(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function transcribeChunkWithRetry(
  batch: string[],
  apiKeys: string[],
  geminiService: GeminiTranscriptionService,
  promptOptions?: ConversionPromptOptions
): Promise<string> {
  if (apiKeys.length === 0) {
    throw new Error('No service keys configured.');
  }

  let lastError: Error | null = null;

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const apiKey = apiKeys[keyIndex];
    try {
      return await geminiService.transcribeAudioFiles(batch, apiKey, undefined, promptOptions);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(err?.message || 'Transcription failed.');
      if (keyIndex < apiKeys.length - 1) {
        await delay(1500);
      }
    }
  }

  throw lastError || new Error('Transcription failed.');
}

async function prepareAudioChunks(
  files: AudioFileInfo[],
  audioService: AudioProcessingService,
  mainWindow: BrowserWindow,
  particleSizeMinutes: number
): Promise<{ allChunks: string[][]; maxChunks: number }> {
  let totalSeconds = 0;
  for (const file of files) {
    let dur = await audioService.getAudioDuration(file.filePath);

    if (file.startTime || file.endTime) {
      const startSec = file.startTime ? timeToSeconds(file.startTime) : 0;
      const endSec = file.endTime ? timeToSeconds(file.endTime) : dur;
      let clippedDur = endSec - startSec;
      if (clippedDur < 0) clippedDur = 0;
      if (clippedDur > dur) clippedDur = dur;
      dur = clippedDur;

      const fullDur = await audioService.getAudioDuration(file.filePath);
      file.needsClipping = startSec > 1 || endSec < fullDur - 1;
    }

    totalSeconds += Math.round(dur);
  }

  let needsPreprocessing = false;
  for (const file of files) {
    if (path.extname(file.filePath).toLowerCase() !== '.mp3' || file.needsClipping) {
      needsPreprocessing = true;
      break;
    }
  }
  if (totalSeconds > particleSizeMinutes * 60) {
    needsPreprocessing = true;
  }

  const allChunks: string[][] = [];
  let maxChunks = 0;

  if (!needsPreprocessing) {
    allChunks.push(...files.map((f) => [f.filePath]));
    maxChunks = 1;
    return { allChunks, maxChunks };
  }

  const mp3Paths: string[] = [];
  for (let i = 0; i < files.length; i++) {
    mainWindow.webContents.send('conversion-progress', {
      status: 'reading_file',
      message: `Preparing file ${i + 1} of ${files.length}...`,
      percentage: 10
    });
    const mp3Path = await audioService.convertToMp3(files[i], (msg) => {
      mainWindow.webContents.send('conversion-progress', { status: 'reading_file', message: msg, percentage: 10 });
    });
    mp3Paths.push(mp3Path);
  }

  for (let i = 0; i < mp3Paths.length; i++) {
    mainWindow.webContents.send('conversion-progress', {
      status: 'reading_file',
      message: `Splitting file ${i + 1} of ${mp3Paths.length} into segments...`,
      percentage: 20
    });
    const chunks = await audioService.splitIntoChunks(mp3Paths[i], particleSizeMinutes, (msg) => {
      mainWindow.webContents.send('conversion-progress', { status: 'reading_file', message: msg, percentage: 20 });
    });
    allChunks.push(chunks);
    if (chunks.length > maxChunks) {
      maxChunks = chunks.length;
    }
  }

  return { allChunks, maxChunks };
}

export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  const geminiService = new GeminiTranscriptionService();
  const docxService = new DocxGeneratorService();
  let isConversionCanceled = false;

  ipcMain.handle('cancel-conversion', async () => {
    isConversionCanceled = true;
  });

  ipcMain.handle('select-audio-file', async (_, allowMultiple: boolean = false): Promise<AudioFileInfo[] | null> => {
    const properties: ('openFile' | 'multiSelections')[] = ['openFile'];
    if (allowMultiple) {
      properties.push('multiSelections');
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: allowMultiple ? 'Select Audio Files to Transcribe (Up to 3)' : 'Select Audio File to Transcribe',
      properties,
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const pathsToProcess = allowMultiple ? result.filePaths.slice(0, 3) : [result.filePaths[0]];

    return pathsToProcess.map((filePath) => {
      const stats = fs.statSync(filePath);
      return {
        filePath,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        extension: path.extname(filePath).toLowerCase()
      };
    });
  });

  ipcMain.handle(
    'convert-audio-to-docx',
    async (
      _,
      files: AudioFileInfo[],
      apiKeys: string[] | string,
      authToken?: string,
      resumeState?: ConversionResumeState,
      promptOptions?: ConversionPromptOptions
    ): Promise<ConversionResult> => {
      const resolvedKeys = (Array.isArray(apiKeys) ? apiKeys : [apiKeys]).filter((k) => k?.trim());
      isConversionCanceled = false;

      try {
        const activeFiles = resumeState?.files ?? files;
        if (!activeFiles || activeFiles.length === 0) {
          throw new Error('No audio files selected.');
        }

        mainWindow.webContents.send('conversion-progress', {
          status: 'reading_file',
          message: resumeState ? 'Resuming conversion...' : 'Calculating audio duration...',
          percentage: 5
        });

        const audioService = new AudioProcessingService();
        const particleSizeMinutes = Number(process.env.PARTICLE_SIZE_MINUTES) || 15;

        if (!resumeState && authToken) {
          try {
            let totalSeconds = 0;
            for (const file of activeFiles) {
              let dur = await audioService.getAudioDuration(file.filePath);
              if (file.startTime || file.endTime) {
                const startSec = file.startTime ? timeToSeconds(file.startTime) : 0;
                const endSec = file.endTime ? timeToSeconds(file.endTime) : dur;
                let clippedDur = endSec - startSec;
                if (clippedDur < 0) clippedDur = 0;
                if (clippedDur > dur) clippedDur = dur;
                dur = clippedDur;
              }
              totalSeconds += Math.round(dur);
            }

            const apiUrl = process.env.VITE_API_URL;
            const payload = JSON.stringify({ total_seconds: totalSeconds, file_count: activeFiles.length });
            const url = new URL(apiUrl + '/api/usage');
            const lib = url.protocol === 'https:' ? https : http;
            await new Promise<void>((resolve, reject) => {
              const req = lib.request(
                url,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                    'Content-Length': Buffer.byteLength(payload)
                  }
                },
                (res) => {
                  if (res.statusCode === 401 || res.statusCode === 403) {
                    reject(new Error('AUTH_ERROR'));
                  } else {
                    resolve();
                  }
                }
              );
              req.on('error', () => resolve());
              req.write(payload);
              req.end();
            });
          } catch (usageErr: any) {
            if (usageErr.message === 'AUTH_ERROR') {
              return { success: false, error: 'AUTH_ERROR' };
            }
          }
        }

        let allChunks: string[][];
        let maxChunks: number;

        if (resumeState) {
          allChunks = resumeState.allChunks;
          maxChunks = Math.max(...allChunks.map((chunks) => chunks.length), 0);
        } else {
          const prepared = await prepareAudioChunks(activeFiles, audioService, mainWindow, particleSizeMinutes);
          allChunks = prepared.allChunks;
          maxChunks = prepared.maxChunks;
        }

        const startChunkIndex = resumeState?.startFromChunkIndex ?? 0;
        let fullTranscription = resumeState?.existingTranscription ?? '';

        for (let chunkIndex = startChunkIndex; chunkIndex < maxChunks; chunkIndex++) {
          if (isConversionCanceled) {
            mainWindow.webContents.send('conversion-progress', {
              status: 'error',
              message: 'Conversion canceled by user.',
              percentage: 0
            });
            return { success: false, error: 'Conversion canceled by user.' };
          }
          const percent = 20 + Math.floor((chunkIndex / maxChunks) * 60);

          const currentBatch: string[] = [];
          for (let fileIndex = 0; fileIndex < allChunks.length; fileIndex++) {
            if (allChunks[fileIndex][chunkIndex]) {
              currentBatch.push(allChunks[fileIndex][chunkIndex]);
            }
          }

          if (currentBatch.length === 0) {
            continue;
          }

          mainWindow.webContents.send('conversion-progress', {
            status: 'transcribing',
            message: `Transcribing part ${chunkIndex + 1} of ${maxChunks}...`,
            percentage: percent
          });

          try {
            const abortPromise = new Promise<string>((_, reject) => {
              const checkInterval = setInterval(() => {
                if (isConversionCanceled) {
                  clearInterval(checkInterval);
                  reject(new Error('Conversion canceled by user.'));
                }
              }, 500);
            });

            const partTranscription = await Promise.race([
              transcribeChunkWithRetry(currentBatch, resolvedKeys, geminiService, promptOptions),
              abortPromise
            ]);
            fullTranscription += (fullTranscription ? '\n\n' : '') + partTranscription;
          } catch (err: any) {
            if (isConversionCanceled || err.message === 'Conversion canceled by user.') {
              mainWindow.webContents.send('conversion-progress', {
                status: 'error',
                message: 'Conversion canceled by user.',
                percentage: 0
              });
              return { success: false, error: 'Conversion canceled by user.' };
            }

            // Log error to backend if authenticated
            if (authToken) {
              try {
                const apiUrl = process.env.VITE_API_URL;
                const payload = JSON.stringify({ error_message: err.message || 'Unknown AI Error' });
                const url = new URL(apiUrl + '/api/error-logs');
                const lib = url.protocol === 'https:' ? https : http;
                const req = lib.request(url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                    'Content-Length': Buffer.byteLength(payload)
                  }
                });
                req.on('error', () => {});
                req.write(payload);
                req.end();
              } catch (logErr) {}
            }

            const completedChunks = chunkIndex;
            const hasPartialText = fullTranscription.trim().length > 0;

            if (hasPartialText) {
              mainWindow.webContents.send('conversion-progress', {
                status: 'generating_docx',
                message: `Saving partial document (${completedChunks} of ${maxChunks} parts completed)...`,
                percentage: 85
              });

              const docxPath = await docxService.generateDocx(activeFiles[0].filePath, fullTranscription);

              mainWindow.webContents.send('conversion-progress', {
                status: 'error',
                message: `Stopped at part ${chunkIndex + 1} of ${maxChunks}. Partial document saved.`,
                percentage: percent
              });

              return {
                success: false,
                partial: true,
                docxPath,
                transcription: fullTranscription,
                completedChunks,
                totalChunks: maxChunks,
                error: err.message || 'Conversion stopped before all parts were processed.',
                resumeState: {
                  startFromChunkIndex: chunkIndex,
                  existingTranscription: fullTranscription,
                  allChunks,
                  files: activeFiles
                }
              };
            }

            throw err;
          }
        }

        mainWindow.webContents.send('conversion-progress', {
          status: 'generating_docx',
          message: 'Creating formatted Word (.docx) document...',
          percentage: 85
        });

        const docxPath = await docxService.generateDocx(activeFiles[0].filePath, fullTranscription);

        mainWindow.webContents.send('conversion-progress', {
          status: 'completed',
          message: 'Conversion completed successfully!',
          percentage: 100
        });

        return {
          success: true,
          docxPath,
          transcription: fullTranscription,
          completedChunks: maxChunks,
          totalChunks: maxChunks
        };
      } catch (error: any) {
        mainWindow.webContents.send('conversion-progress', {
          status: 'error',
          message: error.message || 'An error occurred during conversion.',
          percentage: 0
        });

        // Also log general conversion errors if authenticated
        if (authToken) {
          try {
            const apiUrl = process.env.VITE_API_URL;
            const payload = JSON.stringify({ error_message: error.message || 'Unknown Conversion Error' });
            const url = new URL(apiUrl + '/api/error-logs');
            const lib = url.protocol === 'https:' ? https : http;
            const req = lib.request(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'Content-Length': Buffer.byteLength(payload)
              }
            });
            req.on('error', () => {});
            req.write(payload);
            req.end();
          } catch (logErr) {}
        }

        return {
          success: false,
          error: error.message || 'Unknown error occurred during conversion.'
        };
      }
    }
  );

  ipcMain.handle('open-folder', async (_, filePath: string): Promise<void> => {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
    }
  });
}
