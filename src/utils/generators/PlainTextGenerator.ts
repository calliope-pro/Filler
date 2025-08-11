export async function generatePlainText(size: number, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<Blob> {
  if (size <= 0) {
    throw new Error('Size must be greater than 0');
  }

  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for memory efficiency
  const chunks: Uint8Array[] = [];
  let remaining = size;
  let processed = 0;

  while (remaining > 0) {
    // Check if generation was aborted
    if (signal?.aborted) {
      throw new DOMException('Generation was aborted', 'AbortError');
    }
    
    const currentChunkSize = Math.min(remaining, CHUNK_SIZE);
    const chunk = generateTextChunk(currentChunkSize);
    chunks.push(chunk);
    
    remaining -= currentChunkSize;
    processed += currentChunkSize;
    
    if (onProgress) {
      onProgress(processed / size);
    }
    
    // Yield to event loop for better responsiveness and check for abort
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(resolve, 0);
      
      if (signal) {
        const abortHandler = () => {
          clearTimeout(timeoutId);
          reject(new DOMException('Generation was aborted', 'AbortError'));
        };
        
        if (signal.aborted) {
          clearTimeout(timeoutId);
          reject(new DOMException('Generation was aborted', 'AbortError'));
          return;
        }
        
        signal.addEventListener('abort', abortHandler, { once: true });
        
        // Clean up listener when promise resolves
        timeoutId && setTimeout(() => {
          signal.removeEventListener('abort', abortHandler);
        }, 1);
      }
    });
  }

  return new Blob(chunks as BlobPart[], { type: 'text/plain; charset=utf-8' });
}

// Text chunk generator
function generateTextChunk(size: number): Uint8Array {
  const chars = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    // ASCII printable characters (32-126)
    chars[i] = 32 + Math.floor(Math.random() * 95);
  }
  return chars;
}
