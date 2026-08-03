import fs from 'fs';
import path from 'path';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { AudioFileInfo } from '../../types';

// In an Electron app, unpacked binaries reside in app.asar.unpacked instead of app.asar
const ffmpegPath = ffmpegInstaller.path.replace('app.asar', 'app.asar.unpacked');
const ffprobePath = ffprobeInstaller.path.replace('app.asar', 'app.asar.unpacked');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export class AudioProcessingService {
  
  /**
   * Retrieves the duration of an audio file in seconds
   */
  public getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: any, metadata: FfprobeData) => {
        if (err) {
          return reject(err);
        }
        const duration = metadata.format.duration;
        if (duration === undefined) {
          return reject(new Error('Could not determine audio duration.'));
        }
        resolve(duration);
      });
    });
  }

  /**
   * Converts a given audio file to MP3 (128kbps) and saves it to a 'source' folder.
   * If it's already an MP3, it simply copies it to the 'source' folder.
   */
  public async convertToMp3(file: AudioFileInfo, onProgress?: (msg: string) => void): Promise<string> {
    const originalDir = path.dirname(file.filePath);
    const sourceDir = path.join(originalDir, 'source');
    
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }

    const ext = path.extname(file.filePath).toLowerCase();
    const baseName = path.basename(file.filePath, ext);
    const outputPath = path.join(sourceDir, `${baseName}.mp3`);

    const hasTimeLimits = Boolean(file.needsClipping);

    if (ext === '.mp3' && !hasTimeLimits) {
      onProgress?.(`Copying ${baseName}.mp3 to source folder...`);
      fs.copyFileSync(file.filePath, outputPath);
      return outputPath;
    }

    onProgress?.(`Converting ${path.basename(file.filePath)} to MP3${hasTimeLimits ? ' (Clipping)' : ''}...`);

    return new Promise((resolve, reject) => {
      let cmd = ffmpeg(file.filePath).toFormat('mp3').audioBitrate('128k');

      if (file.startTime) {
        cmd = cmd.setStartTime(file.startTime);
      }
      if (file.endTime) {
        // Input option -to ends at this specific time in the original input
        cmd = cmd.inputOptions(['-to', file.endTime]);
      }

      cmd
        .on('progress', (progress) => {
          if (progress.percent) {
            onProgress?.(`Converting ${path.basename(file.filePath)} to MP3... (${Math.round(progress.percent)}%)`);
          }
        })
        .on('error', (err: Error) => {
          console.error(`[AudioService] Error converting ${file.filePath}:`, err);
          reject(err);
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .save(outputPath);
    });
  }

  /**
   * Splits an MP3 file into multiple chunks of `chunkSizeMinutes`.
   * Files are saved to the same directory as the input file (which should be the `source/` folder).
   * Returns an array of paths to the generated chunks.
   */
  public async splitIntoChunks(filePath: string, chunkSizeMinutes: number, onProgress?: (msg: string) => void): Promise<string[]> {
    const durationSeconds = await this.getAudioDuration(filePath);
    const chunkSizeBytes = chunkSizeMinutes * 60;
    
    const numChunks = Math.ceil(durationSeconds / chunkSizeBytes);
    if (numChunks <= 1) {
      // No need to split
      return [filePath];
    }

    const baseDir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);

    onProgress?.(`Splitting ${baseName} into ${numChunks} chunks...`);

    const chunkPaths: string[] = [];
    const promises: Promise<string>[] = [];

    for (let i = 0; i < numChunks; i++) {
      const chunkPath = path.join(baseDir, `${baseName}_part${i + 1}${ext}`);
      chunkPaths.push(chunkPath);

      const startTime = i * chunkSizeBytes;
      
      const p = new Promise<string>((resolve, reject) => {
        ffmpeg(filePath)
          .setStartTime(startTime)
          .setDuration(chunkSizeBytes)
          // Use copy to avoid re-encoding and make it extremely fast
          .outputOptions('-c copy')
          .on('progress', (progress) => {
             if (progress.percent) {
               onProgress?.(`Splitting ${baseName} chunk ${i + 1}/${numChunks}... (${Math.round(progress.percent)}%)`);
             }
          })
          .on('error', (err: Error) => {
            console.error(`[AudioService] Error splitting ${filePath} chunk ${i}:`, err);
            reject(err);
          })
          .on('end', () => {
            resolve(chunkPath);
          })
          .save(chunkPath);
      });
      promises.push(p);
    }

    // Wait for all chunks to be generated
    await Promise.all(promises);
    return chunkPaths;
  }
}
