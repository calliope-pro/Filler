import { generatePlainText } from './generators/PlainTextGenerator.ts';
import { generatePNG } from './generators/pngGenerator.ts';
import { generatePDF } from './generators/pdfGenerator.ts';
import { generateMP3 } from './generators/mp3Generator.ts';
import { generateMP4 } from './generators/mp4Generator.ts';
import { generateCSV } from './generators/csvGenerator.ts';
import { generateJson } from './generators/jsonGenerator.ts';
import { FileFormat, FILE_EXTENSIONS } from '../types/fileFormats';

export async function generateFile(format: FileFormat, size: number, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<Blob> {
  switch (format) {
    case 'txt':
      return generatePlainText(size, onProgress, signal);
    
    case 'csv':
      return generateCSV(size, onProgress, signal);
    
    case 'png':
      return await generatePNG(size, onProgress, signal);
    
    case 'pdf':
      return generatePDF(size, onProgress, signal);
    
    case 'mp3':
      return generateMP3(size, onProgress, signal);
    
    case 'mp4':
      return generateMP4(size, onProgress, signal);
    
    case 'json':
      return generateJson(size, onProgress, signal);
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export function getDefaultFilename(format: FileFormat, size: number): string {
  const extension = FILE_EXTENSIONS[format];
  return `fillr-${size}bytes.${extension}`;
}