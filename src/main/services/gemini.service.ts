import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { cleanTranscriptionText } from './transcription.util';

export class GeminiTranscriptionService {

  /**
   * Transcribes audio file using Google Gemini Multimodal model with friendly error handling.
   * Accepts an optional runtime apiKey that overrides the .env key for POC multi-key testing.
   */
  /**
   * Transcribes single or multiple audio files in ONE single Gemini API request.
   * Gemini's multimodal engine compares all audio streams directly to produce a high-accuracy transcription.
   */
  public async transcribeAudioFiles(filePaths: string[], apiKey?: string, onProgress?: (msg: string) => void): Promise<string> {
    if (!filePaths || filePaths.length === 0) {
      throw new Error('No audio files provided.');
    }

    // Verify all files exist
    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }
    }

    const resolvedKey = apiKey?.trim();
    console.log('[API Key] : ', resolvedKey);
    if (!resolvedKey) {
      throw new Error('No API key provided. Enter your API key in the field.');
    }

    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    onProgress?.(`Reading ${filePaths.length} audio file(s)...`);

    // Prepare contents array with all audio files as inlineData parts
    const parts: any[] = [];

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = this.getMimeType(filePath);

      parts.push({
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      });
    }

    // Add prompt instructions depending on single or multiple files
    const noTimestampRules =
      'Output ONLY the spoken words as plain text paragraphs. Do NOT include timestamps, time codes, time ranges, chapter markers, or speaker labels. Do not add intro/outro commentary or metadata.';

    if (filePaths.length === 1) {
      parts.push({
        text: `Transcribe this audio accurately into structured paragraphs. ${noTimestampRules}`
      });
    } else {
      parts.push({
        text: `You have ${filePaths.length} recordings of the same voice event from different devices. Cross-reference them to produce one accurate transcription. ${noTimestampRules}`
      });
    }

    onProgress?.('Processing audio segment...');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: parts
          }
        ]
      });

      const transcription = response.text;
      if (!transcription) {
        throw new Error('Received empty transcription response.');
      }

      console.log('\n========== GEMINI RESPONSE ==========');
      console.log('[Gemini Response] : ', response);
      console.log('==========================================\n');

      return cleanTranscriptionText(transcription);
    } catch (error: any) {
      console.error('\n[Gemini Response] ERROR:', error);
      throw new Error(this.formatErrorMessage(error));
    }
  }

  /**
   * Parses raw API errors into clean user-friendly human readable messages
   */
  private formatErrorMessage(error: any): string {
    const causeMsg = error?.cause?.message || error?.cause?.code || (typeof error?.cause === 'string' ? error.cause : '');
    const rawMsg = `${error?.message || error?.toString() || ''} ${causeMsg}`;

    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('Quota exceeded') || rawMsg.toLowerCase().includes('quota')) {
      return 'Quota exceeded. Please wait a minute before trying again.';
    }
    if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('403') || rawMsg.includes('UNAUTHENTICATED') || rawMsg.includes('API key not valid')) {
      return 'Invalid configuration. Please wait for fixing.';
    }
    if (rawMsg.includes('400') || rawMsg.includes('INVALID_ARGUMENT')) {
      return 'The selected audio format or file size is not supported.';
    }
    if (rawMsg.includes('FETCH_ERROR') || rawMsg.includes('fetch failed') || rawMsg.includes('ENOTFOUND') || rawMsg.includes('ECONNREFUSED') || rawMsg.includes('ETIMEDOUT')) {
      return 'Network error: Cannot reach servers. Please check your internet connection or try again later.';
    }
    if (rawMsg.includes('503') || rawMsg.toLowerCase().includes('high demand') || rawMsg.toLowerCase().includes('overloaded') || rawMsg.toLowerCase().includes('service unavailable')) {
      return 'Servers are currently experiencing high demand. Please try again in a few moments.';
    }

    return rawMsg.length > 150 ? rawMsg.substring(0, 150) + '...' : rawMsg;
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.mp3': return 'audio/mp3';
      case '.wav': return 'audio/wav';
      case '.m4a': return 'audio/m4a';
      case '.aac': return 'audio/aac';
      case '.flac': return 'audio/flac';
      case '.ogg': return 'audio/ogg';
      default: return 'audio/mp3';
    }
  }
}
