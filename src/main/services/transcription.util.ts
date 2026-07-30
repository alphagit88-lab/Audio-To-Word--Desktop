/**
 * Removes timestamps, time codes, and inline time markers from transcription text.
 * Keeps only spoken content suitable for a Word document.
 */
export function cleanTranscriptionText(text: string): string {
  const timestampLinePatterns = [
    /^\[\d{1,2}:\d{2}(:\d{2})?(?:\.\d+)?\]\s*/g,
    /^\(\d{1,2}:\d{2}(:\d{2})?(?:\.\d+)?\)\s*/g,
    /^\d{1,2}:\d{2}(:\d{2})?(?:\.\d+)?\s*[-–—]\s*/g,
    /^\d{1,2}:\d{2}(:\d{2})?(?:\.\d+)?\s+/g,
    /^\[\d{1,2}:\d{2}\]\s*[-–—]?\s*/g,
  ];

  const inlineTimestampPattern = /\[\d{1,2}:\d{2}(:\d{2})?(?:\.\d+)?\]/g;

  const cleanedLines = text
    .split('\n')
    .map((line) => {
      let cleaned = line.trim();
      for (const pattern of timestampLinePatterns) {
        cleaned = cleaned.replace(pattern, '');
      }
      cleaned = cleaned.replace(inlineTimestampPattern, '').trim();
      return cleaned;
    })
    .filter((line) => line.length > 0);

  return cleanedLines.join('\n\n');
}
