export function generateRawBytes(size: number, chunkSize: number = 4 * 1024 * 1024): Uint8Array[] {
  if (size <= 0) {
    throw new Error('Size must be greater than 0');
  }

  const chunks: Uint8Array[] = [];
  let remaining = size;

  while (remaining > 0) {
    const currentChunkSize = Math.min(remaining, chunkSize);
    const chunk = new Uint8Array(currentChunkSize);
    // Uint8Array is already zero-filled by default
    
    chunks.push(chunk);
    remaining -= currentChunkSize;
  }

  return chunks;
}

export function generateTextFile(size: number): Blob {
  const chunks = generateRawBytes(size);
  return new Blob(chunks as BlobPart[], { type: 'text/plain' });
}

export function generateBinaryFile(size: number): Blob {
  const chunks = generateRawBytes(size);
  return new Blob(chunks as BlobPart[], { type: 'application/octet-stream' });
}