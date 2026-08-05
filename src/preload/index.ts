import { contextBridge, ipcRenderer } from 'electron';
import { ConversionProgress, AudioFileInfo, ConversionResumeState, ConversionPromptOptions, TranscriptionPart } from '../types';

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

  // Review panel: live chunk streaming + resubmit + finalize
  onChunkTranscribed: (callback: (part: TranscriptionPart) => void) => {
    const subscription = (_: any, part: TranscriptionPart) => callback(part);
    ipcRenderer.on('chunk-transcribed', subscription);
    return () => ipcRenderer.removeListener('chunk-transcribed', subscription);
  },
  resubmitChunk: (
    chunkIndex: number,
    audioPaths: string[],
    userPrompt: string,
    apiKeys: string[],
    transcriptionModel: string,
    primaryAudioFilePath: string,
    authToken?: string,
    existingText?: string
  ) => ipcRenderer.invoke('resubmit-chunk', chunkIndex, audioPaths, userPrompt, apiKeys, transcriptionModel, primaryAudioFilePath, authToken, existingText),
  finalizeTranscription: (
    parts: Array<{ chunkIndex: number; text: string }>,
    primaryAudioFilePath: string
  ) => ipcRenderer.invoke('finalize-transcription', parts, primaryAudioFilePath),

  // Auto-Updater
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
