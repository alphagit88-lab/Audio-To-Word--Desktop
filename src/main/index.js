import { app, BrowserWindow } from 'electron';
import path from 'path';
import dotenv from 'dotenv';
import { setupIpcHandlers } from './ipc/handlers';
dotenv.config();
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 850,
        height: 650,
        minWidth: 700,
        minHeight: 550,
        title: 'Audio to Word Converter (Gemini AI)',
        frame: true,
        titleBarStyle: 'default',
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    setupIpcHandlers(mainWindow);
    // In development, load dev server URL; in production, load dist index.html
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
