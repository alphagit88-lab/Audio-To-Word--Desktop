import { ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { GeminiTranscriptionService } from '../services/gemini.service';
import { DocxGeneratorService } from '../services/docx.service';
export function setupIpcHandlers(mainWindow) {
    const geminiService = new GeminiTranscriptionService();
    const docxService = new DocxGeneratorService();
    // Handle Audio File Browser Dialog
    ipcMain.handle('select-audio-file', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Select Audio File to Transcribe',
            properties: ['openFile'],
            filters: [
                { name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'] }
            ]
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        const filePath = result.filePaths[0];
        const stats = fs.statSync(filePath);
        return {
            filePath,
            fileName: path.basename(filePath),
            fileSize: stats.size,
            extension: path.extname(filePath).toLowerCase()
        };
    });
    // Handle Audio to Docx Conversion pipeline
    ipcMain.handle('convert-audio-to-docx', async (_, filePath) => {
        try {
            mainWindow.webContents.send('conversion-progress', {
                status: 'reading_file',
                message: 'Preparing audio file for AI processing...',
                percentage: 20
            });
            mainWindow.webContents.send('conversion-progress', {
                status: 'transcribing',
                message: 'Transcribing audio using Gemini AI...',
                percentage: 50
            });
            const transcription = await geminiService.transcribeAudio(filePath);
            mainWindow.webContents.send('conversion-progress', {
                status: 'generating_docx',
                message: 'Creating formatted Word (.docx) document...',
                percentage: 85
            });
            const docxPath = await docxService.generateDocx(filePath, transcription);
            mainWindow.webContents.send('conversion-progress', {
                status: 'completed',
                message: 'Conversion completed successfully!',
                percentage: 100
            });
            return {
                success: true,
                docxPath,
                transcription
            };
        }
        catch (error) {
            console.error('Conversion process error:', error);
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
    ipcMain.handle('open-folder', async (_, filePath) => {
        if (fs.existsSync(filePath)) {
            shell.showItemInFolder(filePath);
        }
    });
}
