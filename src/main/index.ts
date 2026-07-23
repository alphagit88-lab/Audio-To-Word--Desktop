import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { setupIpcHandlers } from './ipc/handlers';
import { autoUpdater } from 'electron-updater';

// Load .env explicitly from the app's root path (works in both dev and packaged ASAR)
dotenv.config({ path: path.join(app.getAppPath(), '.env') });

let mainWindow: BrowserWindow | null = null;

// Store the downloaded portable exe path so the IPC handler can access it
let downloadedFilePath = '';

function createWindow() {
  // Completely disable and remove default menu bar (File, Edit, View, Window, Help)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 850,
    height: 650,
    minWidth: 700,
    minHeight: 550,
    title: 'Audio to Word Converter',
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  setupIpcHandlers(mainWindow);

  // In development and production, load the built HTML file directly to ensure instant updates
  const indexPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ── Auto Updater (manual download flow for portable exe) ──────────────────
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false; // Prevent electron-updater from launching the new exe automatically

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info.version);
  });

  autoUpdater.on('update-downloaded', (info) => {
    // `downloadedFile` is the full path to the downloaded portable .exe
    downloadedFilePath = (info as any).downloadedFile ?? '';
    console.log('[updater] update-downloaded, path:', downloadedFilePath);
    mainWindow?.webContents.send('update-downloaded', downloadedFilePath);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-download-progress', progressObj.percent);
  });

  autoUpdater.on('error', (err) => {
    console.error('[updater] Error in auto-updater.', err);
  });

  // Check for updates after the window has loaded
  mainWindow.webContents.once('did-finish-load', () => {
    autoUpdater.checkForUpdates().catch(console.error);
  });
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────

// Start downloading the update (triggered by the UI button click)
ipcMain.on('start-update-download', () => {
  autoUpdater.downloadUpdate().catch((err: any) =>
    console.error('[updater] Error downloading update:', err)
  );
});

// Launch the downloaded portable exe via a detached batch script that:
//  1. Waits for this process to exit
//  2. Overwrites the old exe at its original path with the downloaded one
//  3. Relaunches from the original path (so location stays the same)
ipcMain.handle('run-downloaded-update', async () => {
  if (!downloadedFilePath) {
    console.warn('[updater] run-downloaded-update called but no file path stored.');
    return false;
  }

  // For portable apps, process.execPath points to the unpacked temp folder.
  // PORTABLE_EXECUTABLE_FILE points to the actual .exe the user double-clicked (e.g. on Desktop).
  const currentExePath = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
  const currentDir = path.dirname(currentExePath);
  const newExeName = path.basename(downloadedFilePath);
  const newExePath = path.join(currentDir, newExeName);

  const batPath = path.join(os.tmpdir(), 'atw-update.bat');

  const bat = [
    '@echo off',
    // Wait ~2 seconds for the old process to fully release the file lock (ping is safer than timeout)
    'ping 127.0.0.1 -n 3 > nul',
    // Delete the old exe
    `del /f /q "${currentExePath}"`,
    // Copy the new exe into the same folder with its proper new name
    `copy /y "${downloadedFilePath}" "${newExePath}"`,
    // Relaunch the new exe
    `start "" "${newExePath}"`,
    // Self-delete the batch script
    'del "%~f0"'
  ].join('\r\n');


  fs.writeFileSync(batPath, bat, { encoding: 'utf8' });
  console.log('[updater] Wrote update batch to:', batPath);
  console.log('[updater] Will replace:', currentExePath, 'with:', downloadedFilePath);

  // Launch the batch script detached so it survives after app.quit()
  const child = spawn('cmd.exe', ['/c', batPath], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();

  // Quit the old process — the batch script will take over
  setTimeout(() => app.quit(), 500);
  return true;
});

// ── App lifecycle ─────────────────────────────────────────────────────────────

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
