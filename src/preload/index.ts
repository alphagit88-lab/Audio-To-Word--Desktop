import { contextBridge, ipcRenderer } from 'electron';
import { ConversionProgress, AudioFileInfo, ConversionResumeState, ConversionPromptOptions } from '../types';

contextBridge.exposeInMainWorld('electronAPI', {
  selectAudioFile: (allowMultiple?: boolean) => ipcRenderer.invoke('select-audio-file', allowMultiple),
  convertAudioToDocx: (
    files: AudioFileInfo[],
    apiKeys: string[],
    authToken?: string,
    resumeState?: ConversionResumeState,
    promptOptions?: ConversionPromptOptions
  ) => ipcRenderer.invoke('convert-audio-to-docx', files, apiKeys, authToken, resumeState, promptOptions),
  openFolder: (filePath: string) => ipcRenderer.invoke('open-folder', filePath),
  cancelConversion: () => ipcRenderer.invoke('cancel-conversion'),
  onProgress: (callback: (progress: ConversionProgress) => void) => {
    const subscription = (_: any, progress: ConversionProgress) => callback(progress);
    ipcRenderer.on('conversion-progress', subscription);
    return () => {
      ipcRenderer.removeListener('conversion-progress', subscription);
    };
  },
  
  // Auto-Updater Expose
  startUpdateDownload: () => ipcRenderer.send('start-update-download'),
  runDownloadedUpdate: () => ipcRenderer.invoke('run-downloaded-update'),
  
  onUpdateAvailable: (callback: (version: string) => void) => {
    const subscription = (_: any, version: string) => callback(version);
    ipcRenderer.on('update-available', subscription);
    return () => ipcRenderer.removeListener('update-available', subscription);
  },
  onUpdateDownloaded: (callback: (filePath: string) => void) => {
    const subscription = (_: any, filePath: string) => callback(filePath);
    ipcRenderer.on('update-downloaded', subscription);
    return () => ipcRenderer.removeListener('update-downloaded', subscription);
  },
  onUpdateProgress: (callback: (percent: number) => void) => {
    const subscription = (_: any, percent: number) => callback(percent);
    ipcRenderer.on('update-download-progress', subscription);
    return () => ipcRenderer.removeListener('update-download-progress', subscription);
  }
});
