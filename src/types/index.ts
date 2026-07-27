export interface AudioFileInfo {
  filePath: string;
  fileName: string;
  fileSize: number;
  extension: string;
  startTime?: string;
  endTime?: string;
  needsClipping?: boolean;
}

export type ConversionStatus = 'idle' | 'reading_file' | 'transcribing' | 'generating_docx' | 'completed' | 'error';

export interface ConversionProgress {
  status: ConversionStatus;
  message: string;
  percentage: number;
}

export interface ConversionResult {
  success: boolean;
  docxPath?: string;
  error?: string;
  transcription?: string;
}

export interface ElectronAPI {
  selectAudioFile: (allowMultiple?: boolean) => Promise<AudioFileInfo[] | null>;
  convertAudioToDocx: (files: AudioFileInfo[], apiKey?: string, authToken?: string) => Promise<ConversionResult>;
  openFolder: (filePath: string) => Promise<void>;
  onProgress: (callback: (progress: ConversionProgress) => void) => () => void;
  startUpdateDownload: () => void;
  quitAndInstallUpdate: () => void; // kept for compatibility
  runDownloadedUpdate: () => Promise<boolean>;
  onUpdateAvailable: (callback: (version: string) => void) => () => void;
  onUpdateDownloaded: (callback: (filePath: string) => void) => () => void;
  onUpdateProgress: (callback: (percent: number) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
