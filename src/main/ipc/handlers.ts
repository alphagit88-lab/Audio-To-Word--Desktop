import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { GeminiTranscriptionService } from '../services/gemini.service';
import { DocxGeneratorService } from '../services/docx.service';
import { AudioProcessingService } from '../services/audio.service';
import { ConversionResult, AudioFileInfo } from '../../types';

export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  const geminiService = new GeminiTranscriptionService();
  const docxService = new DocxGeneratorService();

  // Handle Audio File Browser Dialog
  ipcMain.handle('select-audio-file', async (_, allowMultiple: boolean = false): Promise<AudioFileInfo[] | null> => {
    const properties: any[] = ['openFile'];
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

    // Limit to max 3 files as requested
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

  // Handle Audio to Docx Conversion pipeline (accepts multiple file paths and optional runtime apiKey)
  ipcMain.handle('convert-audio-to-docx', async (_, filePaths: string[], apiKey?: string, authToken?: string): Promise<ConversionResult> => {
    try {
      if (!filePaths || filePaths.length === 0) {
        throw new Error('No audio files selected.');
      }

      mainWindow.webContents.send('conversion-progress', {
        status: 'reading_file',
        message: 'Calculating audio duration...',
        percentage: 5
      });

      const audioService = new AudioProcessingService();

      // Calculate total audio duration across all selected files and log to backend
      let totalSeconds = 0;
      try {
        for (const filePath of filePaths) {
          const dur = await audioService.getAudioDuration(filePath);
          totalSeconds += Math.round(dur);
        }

        if (authToken) {
          const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000';
          const payload = JSON.stringify({ total_seconds: totalSeconds, file_count: filePaths.length });
          const url = new URL('/api/usage', apiUrl);
          const lib = url.protocol === 'https:' ? https : http;
          await new Promise<void>((resolve) => {
            const req = lib.request(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'Content-Length': Buffer.byteLength(payload),
              }
            }, () => resolve());
            req.on('error', (err) => {
              console.warn('[usage] Failed to log usage to backend:', err.message);
              resolve(); // fail gracefully
            });
            req.write(payload);
            req.end();
          });
          console.log(`[usage] Logged ${totalSeconds}s for ${filePaths.length} file(s)`);
        }
      } catch (usageErr: any) {
        console.warn('[usage] Duration calc or logging failed, continuing anyway:', usageErr.message);
      }
      const particleSizeMinutes = Number(process.env.PARTICLE_SIZE_MINUTES) || 15;

      let needsPreprocessing = false;
      for (const filePath of filePaths) {
        if (path.extname(filePath).toLowerCase() !== '.mp3') {
          needsPreprocessing = true;
          break;
        }
      }
      if (totalSeconds > particleSizeMinutes * 60) {
        needsPreprocessing = true;
      }

      let allChunks: string[][] = [];
      let maxChunks = 0;

      if (!needsPreprocessing) {
        // Skip MP3 conversion and splitting entirely, use original files directly
        allChunks = filePaths.map(f => [f]);
        maxChunks = 1;
      } else {
        // 1. Convert all files to MP3
        const mp3Paths: string[] = [];
        for (let i = 0; i < filePaths.length; i++) {
          mainWindow.webContents.send('conversion-progress', {
            status: 'reading_file',
            message: `Converting file ${i + 1} of ${filePaths.length} to MP3...`,
            percentage: 10
          });
          const mp3Path = await audioService.convertToMp3(filePaths[i], (msg) => {
            mainWindow.webContents.send('conversion-progress', { status: 'reading_file', message: msg, percentage: 10 });
          });
          mp3Paths.push(mp3Path);
        }

        // 2. Split all MP3s into chunks
        for (let i = 0; i < mp3Paths.length; i++) {
          mainWindow.webContents.send('conversion-progress', {
            status: 'reading_file',
            message: `Splitting file ${i + 1} of ${mp3Paths.length} into ${particleSizeMinutes}-minute chunks...`,
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
      }

      // 3. Process chunks sequentially
      let fullTranscription = '';
      for (let chunkIndex = 0; chunkIndex < maxChunks; chunkIndex++) {
        const percent = 20 + Math.floor((chunkIndex / maxChunks) * 60); // 20% to 80%

        // Gather chunk 'chunkIndex' from each file
        const currentBatch: string[] = [];
        for (let fileIndex = 0; fileIndex < allChunks.length; fileIndex++) {
          if (allChunks[fileIndex][chunkIndex]) {
            currentBatch.push(allChunks[fileIndex][chunkIndex]);
          }
        }

        mainWindow.webContents.send('conversion-progress', {
          status: 'transcribing',
          message: `Processing part ${chunkIndex + 1} of ${maxChunks}...`,
          percentage: percent
        });

        try {
          const partTranscription = await geminiService.transcribeAudioFiles(currentBatch, apiKey);
          fullTranscription += partTranscription + '\n\n';
        } catch (err: any) {
          if (fullTranscription.trim().length > 0) {
            console.warn(`[Handlers] Error processing part ${chunkIndex + 1}, but proceeding with partial result:`, err);
            mainWindow.webContents.send('conversion-progress', {
              status: 'transcribing',
              message: `Part ${chunkIndex + 1} failed, generating document with partial result...`,
              percentage: percent
            });
            break; // Exit the loop and generate docx with what we have
          } else {
            // If even the first chunk fails, we throw the error to fail the whole process
            throw err; 
          }
        }
      }

      mainWindow.webContents.send('conversion-progress', {
        status: 'generating_docx',
        message: 'Creating formatted Word (.docx) document...',
        percentage: 85
      });

      // Use the first original file path to determine output directory and format
      const docxPath = await docxService.generateDocx(filePaths[0], fullTranscription);

      mainWindow.webContents.send('conversion-progress', {
        status: 'completed',
        message: 'Conversion completed successfully!',
        percentage: 100
      });

      return {
        success: true,
        docxPath,
        transcription: fullTranscription
      };
    } catch (error: any) {
      mainWindow.webContents.send('conversion-progress', {
        status: 'error',
        message: error.message || 'An error occurred during conversion.',
        percentage: 0
      });

      return {
        success: false,
        error: error.message || 'Unknown error occurred during conversion.'
      };
    }
  });

  // Open directory containing generated document
  ipcMain.handle('open-folder', async (_, filePath: string): Promise<void> => {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
    }
  });
}
