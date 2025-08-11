export async function generateJson(targetSize: number, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<Blob> {
  if (targetSize <= 0) {
    throw new Error('Target size must be greater than 0');
  }

  if (targetSize <= 2) {
    return new Blob(['{}'], { type: 'application/json' });
  }

  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  // Opening brace
  const openBrace = new TextEncoder().encode('{');
  chunks.push(openBrace);
  totalSize += openBrace.length;

  let id = 0;
  let currentChunk: string[] = [];
  let currentChunkSize = 0;

  while (totalSize < targetSize - 1) { // -1 for closing }
    // Generate key-value pair
    const keyChar = String.fromCharCode(97 + (id % 26)); // a-z循環
    const keyNum = Math.floor(id / 26);
    const keyName = keyNum === 0 ? keyChar : `${keyChar}${keyNum}`;
    const keyValue = id === 0 ? `"${keyName}":${id}` : `,"${keyName}":${id}`;
    const keyValueSize = new TextEncoder().encode(keyValue).length;

    // Check if adding this key-value would exceed target size
    if (totalSize + keyValueSize + 1 > targetSize) { // +1 for closing }
      break;
    }

    currentChunk.push(keyValue);
    currentChunkSize += keyValueSize;
    totalSize += keyValueSize;
    id++;

    // Process chunk when it reaches size limit
    if (currentChunkSize >= CHUNK_SIZE) {
      const chunkBytes = new TextEncoder().encode(currentChunk.join(''));
      chunks.push(chunkBytes);
      currentChunk = [];
      currentChunkSize = 0;

      if (onProgress) {
        onProgress(totalSize / targetSize);
      }

      if (signal?.aborted) {
        throw new DOMException('Generation was aborted', 'AbortError');
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Process remaining chunk
  if (currentChunk.length > 0) {
    const chunkBytes = new TextEncoder().encode(currentChunk.join(''));
    chunks.push(chunkBytes);
  }

  // Add closing brace with padding if needed
  const remaining = targetSize - totalSize - 1;
  const closingContent = remaining > 0 ? ' '.repeat(remaining) + '}' : '}';
  const closingBytes = new TextEncoder().encode(closingContent);
  chunks.push(closingBytes);

  if (onProgress) {
    onProgress(1);
  }

  return new Blob(chunks as BlobPart[], { type: 'application/json' });
}