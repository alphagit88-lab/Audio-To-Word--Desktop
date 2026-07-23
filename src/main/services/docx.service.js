import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
export class DocxGeneratorService {
    /**
     * Generates a beautifully formatted Word (.docx) file in the same directory as the source audio file.
     */
    async generateDocx(audioFilePath, transcribedText) {
        const audioDir = path.dirname(audioFilePath);
        const audioBaseName = path.basename(audioFilePath, path.extname(audioFilePath));
        const outputDocxPath = path.join(audioDir, `${audioBaseName}_transcription.docx`);
        const paragraphs = transcribedText
            .split('\n')
            .filter((p) => p.trim().length > 0)
            .map((textBlock) => new Paragraph({
            children: [
                new TextRun({
                    text: textBlock.trim(),
                    size: 24, // 12pt
                    font: 'Calibri'
                })
            ],
            spacing: {
                after: 200, // 10pt space after paragraph
                line: 360 // 1.5 line spacing
            }
        }));
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
}
