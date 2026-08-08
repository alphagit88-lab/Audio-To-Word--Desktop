import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { stripTimestampsForDocument } from './transcription.util';

export class DocxGeneratorService {
  /**
   * Generates a beautifully formatted Word (.docx) file in the same directory as the source audio file.
   */
  public async generateDocx(audioFilePath: string, transcribedText: string): Promise<string> {
    const audioDir = path.dirname(audioFilePath);
    const audioBaseName = path.basename(audioFilePath, path.extname(audioFilePath));
    const outputDocxPath = path.join(audioDir, `${audioBaseName}_transcription.docx`);

    const cleanText = stripTimestampsForDocument(transcribedText);
    const paragraphs = cleanText
      .split('\n')
      .filter((p) => p.trim().length > 0)
      .map(
        (textBlock) =>
          new Paragraph({
            children: [
              new TextRun({
                text: textBlock.trim(),
                size: 24, // 12pt
                font: 'Calibri'
              })
            ],
            spacing: {
              after: 200, // 10pt space after paragraph
              line: 360   // 1.5 line spacing
            }
          })
      );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title Header
            new Paragraph({
              text: audioBaseName,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 120 },
              alignment: AlignmentType.LEFT
            }),

            // Metadata Subtitle
            new Paragraph({
              children: [
                new TextRun({
                  text: `Source File: ${path.basename(audioFilePath)} | Generated: ${new Date().toLocaleString()}`,
                  italics: true,
                  color: '666666',
                  size: 18 // 9pt
                })
              ],
              spacing: { after: 360 }
            }),

            // Transcribed paragraphs content
            ...paragraphs
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputDocxPath, buffer);

    return outputDocxPath;
  }

  /**
   * Saves a single transcribed chunk as its own docx file in the source/ folder.
   * Used by the review panel feature to allow per-part inspection and correction.
   */
  public async generatePartDocx(
    sourceDir: string,
    partIndex: number,
    text: string,
    baseName: string
  ): Promise<string> {
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }
    const outputPath = path.join(sourceDir, `${baseName}_part_${partIndex + 1}.docx`);

    const cleanText = stripTimestampsForDocument(text);
    const paragraphs = cleanText
      .split('\n')
      .filter((p) => p.trim().length > 0)
      .map(
        (textBlock) =>
          new Paragraph({
            children: [
              new TextRun({
                text: textBlock.trim(),
                size: 24,
                font: 'Calibri'
              })
            ],
            spacing: { after: 200, line: 360 }
          })
      );

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }
}
