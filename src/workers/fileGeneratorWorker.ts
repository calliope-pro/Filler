/**
 * WebWorker for file generation to prevent UI blocking
 * Generates files in chunks and sends them to main thread for streaming download
 */

import { FileFormat } from '../types/fileFormats';

// Message types for communication with main thread
interface WorkerMessage {
  type: 'generate' | 'cancel';
  data?: {
    format: FileFormat;
    size: number;
    chunkSize?: number;
  };
}

interface WorkerResponse {
  type: 'chunk' | 'progress' | 'complete' | 'error';
  data?: {
    chunk?: Uint8Array;
    progress?: number;
    error?: string;
    totalSize?: number;
  };
}

// Streaming generator interface
interface StreamingGenerator {
  generate(size: number, onProgress: (progress: number) => void, onChunk: (chunk: Uint8Array) => void, signal?: AbortSignal): Promise<void>;
}

// Text generator for streaming
class StreamingTextGenerator implements StreamingGenerator {
  async generate(
    size: number, 
    onProgress: (progress: number) => void, 
    onChunk: (chunk: Uint8Array) => void, 
    signal?: AbortSignal
  ): Promise<void> {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    let remaining = size;
    let processed = 0;

    while (remaining > 0) {
      if (signal?.aborted) {
        throw new DOMException('Generation was aborted', 'AbortError');
      }

      const currentChunkSize = Math.min(remaining, CHUNK_SIZE);
      const chunk = this.generateTextChunk(currentChunkSize);
      
      onChunk(chunk);
      
      remaining -= currentChunkSize;
      processed += currentChunkSize;
      onProgress(processed / size);

      // Yield to allow abort signal checking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  private generateTextChunk(size: number): Uint8Array {
    const chars = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      // ASCII printable characters (32-126)
      chars[i] = 32 + Math.floor(Math.random() * 95);
    }
    return chars;
  }
}

// CSV generator for streaming
class StreamingCSVGenerator implements StreamingGenerator {
  async generate(
    size: number, 
    onProgress: (progress: number) => void, 
    onChunk: (chunk: Uint8Array) => void, 
    signal?: AbortSignal
  ): Promise<void> {
    const header = 'ID,Name,Email,Phone,Address,City,Country\n';
    const headerBytes = new TextEncoder().encode(header);
    
    if (signal?.aborted) throw new DOMException('Generation was aborted', 'AbortError');
    
    onChunk(headerBytes);
    let remaining = size - headerBytes.length;
    let processed = headerBytes.length;
    let id = 1;

    while (remaining > 0) {
      if (signal?.aborted) {
        throw new DOMException('Generation was aborted', 'AbortError');
      }

      const row = this.generateCSVRow(id++);
      const rowBytes = new TextEncoder().encode(row);
      
      if (rowBytes.length <= remaining) {
        onChunk(rowBytes);
        remaining -= rowBytes.length;
        processed += rowBytes.length;
      } else {
        // Partial row to fill exactly
        const partialRow = rowBytes.slice(0, remaining);
        onChunk(partialRow);
        processed += remaining;
        remaining = 0;
      }

      onProgress(processed / size);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  private generateCSVRow(id: number): string {
    const countries = ['USA', 'Japan', 'Germany', 'France', 'Canada', 'Australia', 'UK', 'Italy'];
    const country = countries[id % countries.length];
    const phone = String(Math.floor(Math.random() * 9000) + 1000);
    
    return `${id},User${id.toString().padStart(4, '0')},user${id}@example.com,555-${phone},${id} Main Street,City${id % 100},${country}\n`;
  }
}

// JSON generator for streaming
class StreamingJSONGenerator implements StreamingGenerator {
  async generate(
    size: number, 
    onProgress: (progress: number) => void, 
    onChunk: (chunk: Uint8Array) => void, 
    signal?: AbortSignal
  ): Promise<void> {
    const opening = '{"data":[';
    const closing = ']}';
    const openingBytes = new TextEncoder().encode(opening);
    const closingBytes = new TextEncoder().encode(closing);
    
    if (signal?.aborted) throw new DOMException('Generation was aborted', 'AbortError');
    
    onChunk(openingBytes);
    let remaining = size - openingBytes.length - closingBytes.length;
    let processed = openingBytes.length;
    let itemIndex = 0;

    while (remaining > 5) { // Need at least space for closing
      if (signal?.aborted) {
        throw new DOMException('Generation was aborted', 'AbortError');
      }

      const item = this.generateJSONItem(itemIndex++);
      const itemStr = (itemIndex > 1 ? ',' : '') + JSON.stringify(item);
      const itemBytes = new TextEncoder().encode(itemStr);
      
      if (itemBytes.length <= remaining) {
        onChunk(itemBytes);
        remaining -= itemBytes.length;
        processed += itemBytes.length;
      } else {
        break;
      }

      onProgress(processed / size);
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    onChunk(closingBytes);
    onProgress(1);
  }

  private generateJSONItem(index: number): object {
    return {
      id: index,
      name: `Item ${index}`,
      value: Math.random() * 1000,
      active: index % 2 === 0,
      tags: [`tag${index % 5}`, `category${index % 3}`]
    };
  }
}

// PNG generator for streaming
class StreamingPNGGenerator implements StreamingGenerator {
  async generate(
    size: number, 
    onProgress: (progress: number) => void, 
    onChunk: (chunk: Uint8Array) => void, 
    signal?: AbortSignal
  ): Promise<void> {
    if (signal?.aborted) {
      throw new DOMException('Generation was aborted', 'AbortError');
    }
    
    if (size < 67) {
      // Minimum valid PNG size
      const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = new Uint8Array(size);
      result.set(pngSignature.slice(0, Math.min(8, size)), 0);
      onChunk(result);
      onProgress(1);
      return;
    }

    // PNG signature (8 bytes)
    const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    onChunk(pngSignature);
    let processed = pngSignature.length;
    
    // IHDR chunk (25 bytes total)
    const ihdrData = new Uint8Array([
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1  
      0x08, 0x06, 0x00, 0x00, 0x00 // Bit depth: 8, Color type: 6 (RGBA), etc.
    ]);
    const ihdrChunk = this.createPNGChunk('IHDR', ihdrData);
    onChunk(ihdrChunk);
    processed += ihdrChunk.length;
    
    // IDAT chunk (23 bytes total)
    const idatData = new Uint8Array([
      0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x00, 0x01
    ]);
    const idatChunk = this.createPNGChunk('IDAT', idatData);
    onChunk(idatChunk);
    processed += idatChunk.length;
    
    // Calculate remaining space for tEXt padding
    const iendChunkSize = 12; // IEND chunk size
    let remaining = size - processed - iendChunkSize;
    
    if (remaining > 0) {
      // Add tEXt chunk for padding
      const textData = new Uint8Array(remaining - 12); // 12 bytes for chunk header/crc
      const comment = new TextEncoder().encode('Comment\0Generated by Fillr ');
      for (let i = 0; i < textData.length; i++) {
        textData[i] = comment[i % comment.length];
      }
      const textChunk = this.createPNGChunk('tEXt', textData);
      onChunk(textChunk);
      processed += textChunk.length;
    }
    
    // IEND chunk
    const iendChunk = this.createPNGChunk('IEND', new Uint8Array(0));
    onChunk(iendChunk);
    
    onProgress(1);
  }

  private createPNGChunk(type: string, data: Uint8Array): Uint8Array {
    const typeBytes = new TextEncoder().encode(type);
    const length = data.length;
    const chunk = new Uint8Array(8 + length + 4);
    
    // Length (4 bytes)
    chunk.set(this.writeUint32BE(length), 0);
    
    // Type (4 bytes)  
    chunk.set(typeBytes, 4);
    
    // Data
    chunk.set(data, 8);
    
    // CRC (4 bytes)
    const crcData = new Uint8Array(4 + length);
    crcData.set(typeBytes, 0);
    crcData.set(data, 4);
    const crcValue = this.crc32(crcData);
    chunk.set(this.writeUint32BE(crcValue), 8 + length);
    
    return chunk;
  }

  private writeUint32BE(value: number): Uint8Array {
    return new Uint8Array([
      (value >>> 24) & 0xFF,
      (value >>> 16) & 0xFF,
      (value >>> 8) & 0xFF,
      value & 0xFF
    ]);
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    const table = new Array(256);
    
    // Build CRC table
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    
    // Calculate CRC
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}

// PDF generator for streaming
class StreamingPDFGenerator implements StreamingGenerator {
  async generate(
    size: number, 
    onProgress: (progress: number) => void, 
    onChunk: (chunk: Uint8Array) => void, 
    signal?: AbortSignal
  ): Promise<void> {
    const pdfHeader = '%PDF-1.4\n';
    const pdfBody = `1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000126 00000 n \n`;
    const pdfTrailer = 'trailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n194\n%%EOF\n';
    
    const headerBytes = new TextEncoder().encode(pdfHeader);
    const bodyBytes = new TextEncoder().encode(pdfBody);
    const trailerBytes = new TextEncoder().encode(pdfTrailer);
    
    onChunk(headerBytes);
    onChunk(bodyBytes);
    
    let processed = headerBytes.length + bodyBytes.length;
    let remaining = size - processed - trailerBytes.length;
    
    // Fill with PDF comments
    while (remaining > 0) {
      if (signal?.aborted) {
        throw new DOMException('Generation was aborted', 'AbortError');
      }
      
      const comment = '% Generated by Fillr\n';
      const commentBytes = new TextEncoder().encode(comment);
      const chunkSize = Math.min(remaining, commentBytes.length);
      
      onChunk(commentBytes.slice(0, chunkSize));
      remaining -= chunkSize;
      processed += chunkSize;
      
      onProgress(processed / size);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    onChunk(trailerBytes);
    onProgress(1);
  }
}

// Generic binary generator for MP3/MP4
class StreamingBinaryGenerator implements StreamingGenerator {
  constructor(private format: FileFormat) {}

  async generate(
    size: number, 
    onProgress: (progress: number) => void, 
    onChunk: (chunk: Uint8Array) => void, 
    signal?: AbortSignal
  ): Promise<void> {
    const CHUNK_SIZE = 1024 * 1024;
    let remaining = size;
    let processed = 0;

    // Add format-specific headers
    if (this.format === 'mp3') {
      const mp3Header = new Uint8Array([0xFF, 0xFB, 0x90, 0x00]); // MP3 frame header
      onChunk(mp3Header);
      remaining -= mp3Header.length;
      processed += mp3Header.length;
    } else if (this.format === 'mp4') {
      const mp4Header = new TextEncoder().encode('ftypisom');
      onChunk(mp4Header);
      remaining -= mp4Header.length;
      processed += mp4Header.length;
    }

    while (remaining > 0) {
      if (signal?.aborted) {
        throw new DOMException('Generation was aborted', 'AbortError');
      }

      const currentChunkSize = Math.min(remaining, CHUNK_SIZE);
      const chunk = new Uint8Array(currentChunkSize);
      
      // Fill with pattern data
      for (let i = 0; i < currentChunkSize; i++) {
        chunk[i] = (i + processed) & 0xFF;
      }
      
      onChunk(chunk);
      remaining -= currentChunkSize;
      processed += currentChunkSize;
      onProgress(processed / size);

      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Generator registry
const generators: Record<FileFormat, StreamingGenerator> = {
  txt: new StreamingTextGenerator(),
  csv: new StreamingCSVGenerator(),
  json: new StreamingJSONGenerator(),
  png: new StreamingPNGGenerator(),
  pdf: new StreamingPDFGenerator(),
  mp3: new StreamingBinaryGenerator('mp3'),
  mp4: new StreamingBinaryGenerator('mp4'),
};

// Worker state
let currentAbortController: AbortController | null = null;

// Message handler
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case 'generate':
        if (!data) throw new Error('No generation data provided');
        
        // Cancel any ongoing generation
        if (currentAbortController) {
          currentAbortController.abort();
        }
        
        currentAbortController = new AbortController();
        const { format, size } = data;
        const generator = generators[format];
        
        if (!generator) {
          throw new Error(`Unsupported format: ${format}`);
        }

        await generator.generate(
          size,
          (progress) => {
            const response: WorkerResponse = {
              type: 'progress',
              data: { progress }
            };
            self.postMessage(response);
          },
          (chunk) => {
            const response: WorkerResponse = {
              type: 'chunk',
              data: { chunk }
            };
            self.postMessage(response);
          },
          currentAbortController.signal
        );

        // Generation complete
        const completeResponse: WorkerResponse = {
          type: 'complete',
          data: { totalSize: size }
        };
        self.postMessage(completeResponse);
        break;

      case 'cancel':
        if (currentAbortController) {
          currentAbortController.abort();
          currentAbortController = null;
        }
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const errorResponse: WorkerResponse = {
      type: 'error',
      data: { 
        error: error instanceof Error ? error.message : String(error) 
      }
    };
    self.postMessage(errorResponse);
  }
});

// Export types for main thread
export type { WorkerMessage, WorkerResponse };