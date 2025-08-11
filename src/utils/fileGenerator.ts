import { generateTextFile } from './generators/rawFileGenerator.ts';
import { generatePNG } from './generators/pngGenerator.ts';
import { generatePDF } from './generators/pdfGenerator.ts';
import { generateMP3 } from './generators/mp3Generator.ts';
import { generateMP4 } from './generators/mp4Generator.ts';
import { generateCSV } from './generators/csvGenerator.ts';

export async function generateFile(format: string, size: number): Promise<Blob> {
  switch (format) {
    case 'txt':
      return generateTextFile(size);
    
    case 'csv':
      return generateCSV(size);
    
    case 'png':
      return await generatePNG(size);
    
    case 'pdf':
      return generatePDF(size);
    
    case 'mp3':
      return generateMP3(size);
    
    case 'mp4':
      return generateMP4(size);
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export function getDefaultFilename(format: string, size: number): string {
  const formatMap: Record<string, string> = {
    txt: 'txt',
    csv: 'csv',
    png: 'png',
    pdf: 'pdf',
    mp3: 'mp3',
    mp4: 'mp4'
  };
  
  const extension = formatMap[format] || 'txt';
  return `fillr-${size}bytes.${extension}`;
}