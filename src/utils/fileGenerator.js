import { generateTextFile, generateBinaryFile } from './rawFileGenerator.js';
import { generatePNG } from './pngGenerator.js';
import { generatePDF } from './pdfGenerator.js';
import { generateMP3 } from './mp3Generator.js';
import { generateMP4 } from './mp4Generator.js';
import { generateCSV } from './csvGenerator.js';

export async function generateFile(format, size, options = {}) {
  const { fillMode = 'zero' } = options;

  switch (format) {
    case 'txt':
      return generateTextFile(size, fillMode);
    
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

export function getDefaultFilename(format, size) {
  const formatMap = {
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