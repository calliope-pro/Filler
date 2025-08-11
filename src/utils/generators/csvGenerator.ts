export async function generateCSV(targetSize: number, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<Blob> {
  if (targetSize <= 0) {
    throw new Error('Target size must be greater than 0');
  }

  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  // CSV header
  const header = 'ID,Name,Email,Phone,Address,City,Country\n';
  const headerBytes = new TextEncoder().encode(header);
  
  if (targetSize <= headerBytes.length) {
    return new Blob([headerBytes.slice(0, targetSize)], { type: 'text/csv' });
  }

  chunks.push(headerBytes);
  totalSize += headerBytes.length;
  
  let rowId = 1;
  let currentChunk: string[] = [];
  let currentChunkSize = 0;

  while (totalSize < targetSize) {
    // Create a data row
    const name = `User${String(rowId).padStart(4, '0')}`;
    const email = `user${rowId}@example.com`;
    const phone = `555-${String(rowId % 10000).padStart(4, '0')}`;
    const address = `${rowId} Main Street`;
    const city = `City${rowId % 100}`;
    const country = rowId % 2 === 0 ? 'USA' : 'Canada';
    
    const row = `${rowId},${name},${email},${phone},${address},${city},${country}\n`;
    const rowSize = new TextEncoder().encode(row).length;
    
    // Check if adding this row would exceed target size
    if (totalSize + rowSize > targetSize) {
      const remaining = targetSize - totalSize;
      const partialRow = row.substring(0, remaining);
      currentChunk.push(partialRow);
      break;
    }
    
    currentChunk.push(row);
    currentChunkSize += rowSize;
    totalSize += rowSize;
    rowId++;
    
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

  if (onProgress) {
    onProgress(1);
  }

  return new Blob(chunks as BlobPart[], { type: 'text/csv' });
}