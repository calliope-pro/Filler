export function generateRawBytes(size, mode = 'zero', chunkSize = 4 * 1024 * 1024) {
  if (size <= 0) {
    throw new Error('Size must be greater than 0');
  }

  const chunks = [];
  let remaining = size;
  let patternOffset = 0;

  while (remaining > 0) {
    const currentChunkSize = Math.min(remaining, chunkSize);
    const chunk = new Uint8Array(currentChunkSize);

    switch (mode) {
      case 'zero':
        // Uint8Array is already zero-filled by default
        break;
      case 'ascii':
        for (let i = 0; i < currentChunkSize; i++) {
          // Cycle through A-Z, 0-9
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          chunk[i] = chars.charCodeAt((patternOffset + i) % chars.length);
        }
        patternOffset += currentChunkSize;
        break;
      case 'pattern':
        for (let i = 0; i < currentChunkSize; i++) {
          chunk[i] = (patternOffset + i) % 256;
        }
        patternOffset += currentChunkSize;
        break;
      case 'custom':
        // Fill with a specific byte value (0x41 = 'A')
        chunk.fill(0x41);
        break;
      default:
        throw new Error(`Unsupported fill mode: ${mode}`);
    }

    chunks.push(chunk);
    remaining -= currentChunkSize;
  }

  return chunks;
}

export function generateTextFile(size, mode = 'ascii') {
  const chunks = generateRawBytes(size, mode === 'ascii' ? 'ascii' : 'zero');
  return new Blob(chunks, { type: 'text/plain' });
}

export function generateBinaryFile(size, mode = 'zero') {
  const chunks = generateRawBytes(size, mode);
  return new Blob(chunks, { type: 'application/octet-stream' });
}