"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    selectAudioFile: () => electron_1.ipcRenderer.invoke('select-audio-file'),
    convertAudioToDocx: (filePath) => electron_1.ipcRenderer.invoke('convert-audio-to-docx', filePath),
    openFolder: (filePath) => electron_1.ipcRenderer.invoke('open-folder', filePath),
    onProgress: (callback) => {
        const subscription = (_, progress) => callback(progress);
        electron_1.ipcRenderer.on('conversion-progress', subscription);
        return () => {
            electron_1.ipcRenderer.removeListener('conversion-progress', subscription);
        };
    }
});
