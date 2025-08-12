/**
 * Streaming download handler using StreamSaver.js and WebWorker
 * Enables large file generation without memory limitations
 */

import streamSaver from 'streamsaver';
import { FileFormat, FILE_EXTENSIONS } from '../types/fileFormats';

// Import worker types
import type { WorkerMessage, WorkerResponse } from '../workers/fileGeneratorWorker';

interface StreamingDownloadOptions {
  format: FileFormat;
  size: number;
  filename?: string;
  onError?: (error: string) => void;
}

export class StreamingDownloadManager {
  private worker: Worker | null = null;

  constructor() {
    // Initialize StreamSaver
    streamSaver.mitm = 'https://jimmywarting.github.io/StreamSaver.js/mitm.html?version=2.0.0';
  }

  async startDownload({
    format,
    size,
    filename,
    onError
  }: StreamingDownloadOptions): Promise<void> {
    try {
      // Generate filename if not provided
      const finalFilename = filename || this.getDefaultFilename(format, size);

      // Create download stream
      const fileStream = streamSaver.createWriteStream(finalFilename, {
        size, // Optional: helps browsers show accurate progress
      });

      const writer = fileStream.getWriter();

      // Create and initialize worker
      this.worker = new Worker(
        new URL('../workers/fileGeneratorWorker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up worker message handling
      this.worker.onmessage = async (event: MessageEvent<WorkerResponse>) => {
        const { type, data } = event.data;
        try {
          switch (type) {
            case 'chunk':
              if (data?.chunk) {
                await writer.write(data.chunk);
              }
              break;

            case 'progress':
              // Progress updates for internal use only
              break;

            case 'complete':
              await writer.close();
              this.cleanup();
              break;

            case 'error':
              await writer.abort();
              this.cleanup();
              if (onError && data?.error) {
                onError(data.error);
              }
              break;
          }
        } catch (writerError) {
          console.error('Writer error:', writerError);
          await writer.abort();
          this.cleanup();
          if (onError) {
            onError(`Download failed: ${writerError}`);
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        writer.abort();
        this.cleanup();
        if (onError) {
          onError(`Worker error: ${error.message}`);
        }
      };

      // Start generation
      const message: WorkerMessage = {
        type: 'generate',
        data: {
          format,
          size
        }
      };

      this.worker.postMessage(message);

    } catch (error) {
      this.cleanup();
      if (onError) {
        onError(`Failed to start download: ${error}`);
      }
      throw error;
    }
  }


  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private getDefaultFilename(format: FileFormat, size: number): string {
    const extension = FILE_EXTENSIONS[format]!;
    // Add timestamp to ensure unique URLs and prevent caching
    const timestamp = Date.now();
    return `fillr-${format.toUpperCase()}-${size}bytes-${timestamp}.${extension}`;
  }


  // Check if streaming download is supported
  static isSupported(): boolean {
    return (
      typeof Worker !== 'undefined' &&
      typeof WritableStream !== 'undefined' &&
      typeof ReadableStream !== 'undefined'
    );
  }
}

// Legacy download handler for fallback
export function downloadBlob(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'file';
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBrowserSupport(): void {
  const features = {
    worker: typeof Worker !== 'undefined',
    streams: typeof ReadableStream !== 'undefined' && typeof WritableStream !== 'undefined',
    blob: typeof Blob !== 'undefined',
    cryptoGetRandomValues: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function',
    urlCreateObjectURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
    arrayBuffer: typeof ArrayBuffer !== 'undefined',
    uint8Array: typeof Uint8Array !== 'undefined'
  };

  const unsupportedFeatures = Object.entries(features)
    .filter(([, supported]) => !supported)
    .map(([key]) => key);

  if (unsupportedFeatures.length > 0) {
    throw new Error(`Unsupported browser features: ${unsupportedFeatures.join(', ')}`);
  }
}