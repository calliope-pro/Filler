function writeUint32BE(value) {
  return new Uint8Array([
    (value >>> 24) & 0xFF,
    (value >>> 16) & 0xFF,
    (value >>> 8) & 0xFF,
    value & 0xFF
  ]);
}

function writeUint16BE(value) {
  return new Uint8Array([
    (value >>> 8) & 0xFF,
    value & 0xFF
  ]);
}

function createBox(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const size = 8 + data.length;
  const box = new Uint8Array(size);
  
  // Box size (4 bytes)
  box.set(writeUint32BE(size), 0);
  
  // Box type (4 bytes)
  box.set(typeBytes, 4);
  
  // Box data
  if (data.length > 0) {
    box.set(data, 8);
  }
  
  return box;
}

function createFtypBox() {
  const data = new Uint8Array(16);
  
  // Major brand: mp41
  data.set(new TextEncoder().encode('mp41'), 0);
  
  // Minor version: 0
  data.set(writeUint32BE(0), 4);
  
  // Compatible brands: mp41, isom
  data.set(new TextEncoder().encode('mp41'), 8);
  data.set(new TextEncoder().encode('isom'), 12);
  
  return createBox('ftyp', data);
}

function createMvhdBox() {
  const data = new Uint8Array(100);
  
  // Version (1 byte) + Flags (3 bytes)
  data[0] = 0x00;
  data[1] = 0x00;
  data[2] = 0x00;
  data[3] = 0x00;
  
  // Creation time (4 bytes) - 0
  data.set(writeUint32BE(0), 4);
  
  // Modification time (4 bytes) - 0
  data.set(writeUint32BE(0), 8);
  
  // Time scale (4 bytes) - 1000 (1 second = 1000 units)
  data.set(writeUint32BE(1000), 12);
  
  // Duration (4 bytes) - 1000 (1 second)
  data.set(writeUint32BE(1000), 16);
  
  // Preferred rate (4 bytes) - 1.0
  data.set(writeUint32BE(0x00010000), 20);
  
  // Preferred volume (2 bytes) - 1.0
  data.set(writeUint16BE(0x0100), 24);
  
  // Reserved (10 bytes)
  for (let i = 26; i < 36; i++) {
    data[i] = 0x00;
  }
  
  // Matrix (36 bytes) - identity matrix
  const matrix = [
    0x00010000, 0x00000000, 0x00000000, // a, b, u
    0x00000000, 0x00010000, 0x00000000, // c, d, v  
    0x00000000, 0x00000000, 0x40000000  // x, y, w
  ];
  
  let offset = 36;
  for (const value of matrix) {
    data.set(writeUint32BE(value), offset);
    offset += 4;
  }
  
  // Pre-defined (24 bytes)
  for (let i = 72; i < 96; i++) {
    data[i] = 0x00;
  }
  
  // Next track ID (4 bytes)
  data.set(writeUint32BE(2), 96);
  
  return createBox('mvhd', data);
}

function createTrakBox() {
  // Simplified track box - just the essential tkhd box
  const tkhdData = new Uint8Array(84);
  
  // Version + Flags (track enabled)
  tkhdData[0] = 0x00;
  tkhdData[1] = 0x00;
  tkhdData[2] = 0x00;
  tkhdData[3] = 0x07; // Track enabled + in movie + in preview
  
  // Creation/modification time (8 bytes each) - set to 0 for simplicity
  for (let i = 4; i < 20; i++) {
    tkhdData[i] = 0x00;
  }
  
  // Track ID (4 bytes)
  tkhdData.set(writeUint32BE(1), 20);
  
  // Reserved (4 bytes)
  tkhdData.set(writeUint32BE(0), 24);
  
  // Duration (8 bytes) - 0 for simplicity
  for (let i = 28; i < 36; i++) {
    tkhdData[i] = 0x00;
  }
  
  // Layer, alternate group, volume (6 bytes)
  for (let i = 36; i < 42; i++) {
    tkhdData[i] = 0x00;
  }
  
  // Reserved (2 bytes)
  tkhdData.set(writeUint16BE(0), 42);
  
  // Matrix (36 bytes) - identity matrix
  const matrix = [
    0x00010000, 0x00000000, 0x00000000,
    0x00000000, 0x00010000, 0x00000000,
    0x00000000, 0x00000000, 0x40000000
  ];
  
  let offset = 44;
  for (const value of matrix) {
    tkhdData.set(writeUint32BE(value), offset);
    offset += 4;
  }
  
  // Width and height (4 bytes each) - 1x1 pixel
  tkhdData.set(writeUint32BE(0x00010000), 80); // Width: 1.0
  
  const tkhdBox = createBox('tkhd', tkhdData);
  
  return createBox('trak', tkhdBox);
}

function createMoovBox() {
  const mvhdBox = createMvhdBox();
  const trakBox = createTrakBox();
  
  const moovData = new Uint8Array(mvhdBox.length + trakBox.length);
  moovData.set(mvhdBox, 0);
  moovData.set(trakBox, mvhdBox.length);
  
  return createBox('moov', moovData);
}

export function generateMP4(targetSize) {
  if (targetSize < 40) {
    // Too small for valid MP4, return minimal data
    const result = new Uint8Array(targetSize);
    result.fill(0x00);
    return new Blob([result], { type: 'video/mp4' });
  }

  try {
    // Create required boxes
    const ftypBox = createFtypBox();
    const moovBox = createMoovBox();
    
    const requiredSize = ftypBox.length + moovBox.length;
    
    if (targetSize <= requiredSize) {
      // Not enough space for both boxes, construct what fits
      const result = new Uint8Array(targetSize);
      let offset = 0;
      
      if (targetSize >= ftypBox.length) {
        result.set(ftypBox, offset);
        offset += ftypBox.length;
        
        if (offset < targetSize) {
          const remainingBytes = targetSize - offset;
          const moovSlice = moovBox.slice(0, remainingBytes);
          result.set(moovSlice, offset);
        }
      } else {
        result.set(ftypBox.slice(0, targetSize), 0);
      }
      
      return new Blob([result], { type: 'video/mp4' });
    }
    
    // Add mdat box to reach target size
    const mdatDataSize = Math.max(0, targetSize - requiredSize - 8); // 8 bytes for mdat header
    const mdatData = new Uint8Array(mdatDataSize);
    mdatData.fill(0x00); // Empty video data
    const mdatBox = createBox('mdat', mdatData);
    
    // Construct final MP4
    const result = new Uint8Array(targetSize);
    let offset = 0;
    
    // Add ftyp box
    result.set(ftypBox, offset);
    offset += ftypBox.length;
    
    // Add moov box  
    result.set(moovBox, offset);
    offset += moovBox.length;
    
    // Add mdat box (truncated if necessary)
    const remainingBytes = targetSize - offset;
    if (remainingBytes > 0 && mdatBox.length > 0) {
      const mdatSlice = mdatBox.slice(0, remainingBytes);
      result.set(mdatSlice, offset);
    }
    
    return new Blob([result], { type: 'video/mp4' });
    
  } catch (error) {
    console.error('MP4 generation error:', error);
    // Fallback: create simple zero-filled file
    const result = new Uint8Array(targetSize);
    result.fill(0x00);
    // Add minimal MP4 signature
    if (targetSize >= 8) {
      result.set([0x66, 0x74, 0x79, 0x70], 4); // 'ftyp'
    }
    return new Blob([result], { type: 'video/mp4' });
  }
}