import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { GeminiTranscriptionService } from '../services/gemini.service';
import { DocxGeneratorService } from '../services/docx.service';
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
  ipcMain.handle('convert-audio-to-docx', async (_, filePaths: string[], apiKey?: string): Promise<ConversionResult> => {
    try {
      if (!filePaths || filePaths.length === 0) {
        throw new Error('No audio files selected.');
      }

      mainWindow.webContents.send('conversion-progress', {
        status: 'reading_file',
        message: 'Preparing audio files for AI processing...',
        percentage: 15
      });

      mainWindow.webContents.send('conversion-progress', {
        status: 'transcribing',
        message: filePaths.length > 1
          ? `Transcribing and merging ${filePaths.length} audio tracks in 1 AI request...`
          : 'Transcribing audio content with Gemini AI...',
        percentage: 40
      });

      const finalTranscription = await geminiService.transcribeAudioFiles(filePaths, apiKey);

      mainWindow.webContents.send('conversion-progress', {
        status: 'generating_docx',
        message: 'Creating formatted Word (.docx) document...',
        percentage: 85
      });

      // Use the first file path to determine output directory and format
      const docxPath = await docxService.generateDocx(filePaths[0], finalTranscription);

      mainWindow.webContents.send('conversion-progress', {
        status: 'completed',
        message: 'Conversion completed successfully!',
        percentage: 100
      });

      return {
        success: true,
        docxPath,
        transcription: finalTranscription
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
