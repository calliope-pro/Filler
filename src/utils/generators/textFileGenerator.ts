export function generateTextFile(size: number): Blob {
  if (size <= 0) {
    throw new Error('Size must be greater than 0');
  }

  const chunks: string[] = [];
  let remaining = size;
  const chunkSize = 1024 * 1024; // 1MB chunks

  // ランダムなASCII文字列を効率的に生成
  const generateRandomString = (length: number): string => {
    let result = '';
    const batchSize = 10000; // バッチサイズで処理
    
    while (result.length < length) {
      const currentBatch = Math.min(batchSize, length - result.length);
      const chars = Array.from({ length: currentBatch }, () => 
        String.fromCharCode(32 + Math.floor(Math.random() * 95))
      );
      result += chars.join('');
    }
    
    return result;
  };

  while (remaining > 0) {
    const currentChunkSize = Math.min(remaining, chunkSize);
    const chunkContent = generateRandomString(currentChunkSize);
    
    chunks.push(chunkContent);
    remaining -= currentChunkSize;
  }

  return new Blob(chunks, { type: 'text/plain; charset=utf-8' });
}
