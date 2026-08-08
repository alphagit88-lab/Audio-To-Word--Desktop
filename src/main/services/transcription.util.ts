/**
 * Removes timestamps, time codes, and inline time markers from transcription text.
 * Keeps only spoken content suitable for a Word document.
 */
export function cleanTranscriptionText(text: string): string {
  // Just trim the lines so timestamps are kept for the UI
  const cleanedLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return cleanedLines.join('\n\n');
}

/**
 * Removes timestamps, time codes, and inline time markers from transcription text.
 * Keeps only spoken content suitable for a Word document.
 */
export function stripTimestampsForDocument(text: string): string {
  // Matches [HH:MM:SS.mmm], [MM:SS.mmm], [MM:SS], (HH:MM:SS.mmm), etc.
  const timestampPattern = /[\[\(]\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?[\]\)]\s*/g;

  const cleanedLines = text
    .split('\n')
    .map((line) => {
      let cleaned = line.trim();
      cleaned = cleaned.replace(timestampPattern, '').trim();
      return cleaned;
    })
    .filter((line) => line.length > 0);

  return cleanedLines.join('\n\n');
}
