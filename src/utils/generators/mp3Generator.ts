function encodeID3v2Size(size: number): Uint8Array {
  // ID3v2 uses synchsafe integers (7 bits per byte)
  return new Uint8Array([
    (size >>> 21) & 0x7F,
    (size >>> 14) & 0x7F,
    (size >>> 7) & 0x7F,
    size & 0x7F
  ]);
}

function createID3v2Header(tagSize: number): Uint8Array {
  const header = new Uint8Array(10);
  
  // ID3v2 identifier
  header[0] = 0x49; // 'I'
  header[1] = 0x44; // 'D'
  header[2] = 0x33; // '3'
  
  // Version 2.3.0
  header[3] = 0x03;
  header[4] = 0x00;
  
  // Flags (none)
  header[5] = 0x00;
  
  // Size (synchsafe integer)
  const sizeBytes = encodeID3v2Size(tagSize);
  header.set(sizeBytes, 6);
  
  return header;
}

function createTitleFrame(title: string): Uint8Array {
  const titleBytes = new TextEncoder().encode(title);
  const frameSize = 1 + titleBytes.length; // 1 byte for encoding + title
  
  const frame = new Uint8Array(10 + frameSize);
  
  // Frame ID (TIT2)
  frame[0] = 0x54; // 'T'
  frame[1] = 0x49; // 'I'
  frame[2] = 0x54; // 'T'
  frame[3] = 0x32; // '2'
  
  // Frame size (big endian)
  frame[4] = (frameSize >>> 24) & 0xFF;
  frame[5] = (frameSize >>> 16) & 0xFF;
  frame[6] = (frameSize >>> 8) & 0xFF;
  frame[7] = frameSize & 0xFF;
  
  // Frame flags
  frame[8] = 0x00;
  frame[9] = 0x00;
  
  // Text encoding (ISO-8859-1)
  frame[10] = 0x00;
  
  // Title text
  frame.set(titleBytes, 11);
  
  return frame;
}

function createMP3Frame(frameSize: number): Uint8Array {
  // Create a valid MP3 frame header
  const frame = new Uint8Array(frameSize);
  
  // MP3 Frame header: MPEG-1 Layer 3, 128kbps, 44100Hz, no padding, mono
  frame[0] = 0xFF;  // Frame sync (all bits set)
  frame[1] = 0xFB;  // MPEG-1, Layer 3, no CRC
  frame[2] = 0x90;  // 128 kbps, 44.1 kHz
  frame[3] = 0x00;  // No padding, stereo, no mode extension, no copyright, original
  
  // Fill the rest with silence (zeros represent silence in MP3)
  // In a real MP3, this would be compressed audio data
  for (let i = 4; i < frameSize; i++) {
    frame[i] = 0x00;
  }
  
  return frame;
}

export async function generateMP3(targetSize: number, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<Blob> {
  if (targetSize < 32) {
    // Too small for valid MP3, create minimal structure
    const result = new Uint8Array(targetSize);
    // Fill with MP3 frame sync pattern
    for (let i = 0; i < targetSize; i += 4) {
      if (i < targetSize) result[i] = 0xFF;
      if (i + 1 < targetSize) result[i + 1] = 0xFB;
      if (i + 2 < targetSize) result[i + 2] = 0x90;
      if (i + 3 < targetSize) result[i + 3] = 0x00;
    }
    return new Blob([result], { type: 'audio/mpeg' });
  }

  // Create basic ID3v2 tag with title
  const titleFrame = createTitleFrame('Fillr Generated Silent Audio');
  const tagSize = titleFrame.length;
  const id3Header = createID3v2Header(tagSize);
  
  const id3TotalSize = id3Header.length + tagSize;
  
  if (targetSize <= id3TotalSize) {
    // Only ID3 tag fits
    const result = new Uint8Array(targetSize);
    let offset = 0;
    
    if (targetSize >= id3Header.length) {
      result.set(id3Header, offset);
      offset += id3Header.length;
      
      if (offset < targetSize) {
        const remainingBytes = Math.min(titleFrame.length, targetSize - offset);
        result.set(titleFrame.slice(0, remainingBytes), offset);
      }
    } else {
      result.set(id3Header.slice(0, targetSize), 0);
    }
    
    return new Blob([result], { type: 'audio/mpeg' });
  }
  
  // Create MP3 frames to fill remaining space
  const standardFrameSize = 417; // Standard size for 128kbps MP3 frame
  
  const result = new Uint8Array(targetSize);
  let offset = 0;
  
  // Add ID3 header and tag
  result.set(id3Header, offset);
  offset += id3Header.length;
  result.set(titleFrame, offset);
  offset += titleFrame.length;
  
  // Add MP3 frames
  while (offset < targetSize) {
    const remainingBytes = targetSize - offset;
    const frameSize = Math.min(standardFrameSize, remainingBytes);
    
    if (frameSize >= 4) {
      // Create a proper MP3 frame
      const mp3Frame = createMP3Frame(frameSize);
      result.set(mp3Frame, offset);
      offset += frameSize;
    } else {
      // Fill remaining bytes with silence
      for (let i = 0; i < remainingBytes; i++) {
        result[offset + i] = 0x00;
      }
      break;
    }
  }
  
  if (signal?.aborted) {
    throw new DOMException('Generation was aborted', 'AbortError');
  }
  
  if (onProgress) {
    onProgress(1);
  }
  
  return new Blob([result], { type: 'audio/mpeg' });
}