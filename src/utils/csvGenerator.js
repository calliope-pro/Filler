export function generateCSV(targetSize) {
  if (targetSize <= 0) {
    throw new Error('Target size must be greater than 0');
  }

  // CSV header
  const header = 'ID,Name,Email,Phone,Address,City,Country\n';
  const headerSize = new TextEncoder().encode(header).length;

  if (targetSize <= headerSize) {
    // If target size is too small, return truncated header
    const headerBytes = new TextEncoder().encode(header);
    return new Blob([headerBytes.slice(0, targetSize)], { type: 'text/csv' });
  }

  let csvContent = header;
  let currentSize = headerSize;
  let rowId = 1;

  // Generate data rows to reach target size
  while (currentSize < targetSize) {
    // Create a data row with predictable content
    const name = `User${String(rowId).padStart(4, '0')}`;
    const email = `user${rowId}@example.com`;
    const phone = `555-${String(rowId % 10000).padStart(4, '0')}`;
    const address = `${rowId} Main Street`;
    const city = `City${rowId % 100}`;
    const country = rowId % 2 === 0 ? 'USA' : 'Canada';
    
    const row = `${rowId},${name},${email},${phone},${address},${city},${country}\n`;
    const rowBytes = new TextEncoder().encode(row);
    
    // Check if adding this row would exceed target size
    if (currentSize + rowBytes.length > targetSize) {
      // Add partial row to reach exact target size
      const remainingBytes = targetSize - currentSize;
      const partialRow = row.substring(0, remainingBytes);
      csvContent += partialRow;
      break;
    }
    
    csvContent += row;
    currentSize += rowBytes.length;
    rowId++;
  }

  // Ensure exact target size
  const finalBytes = new TextEncoder().encode(csvContent);
  if (finalBytes.length !== targetSize) {
    // Adjust by truncating or padding
    if (finalBytes.length > targetSize) {
      return new Blob([finalBytes.slice(0, targetSize)], { type: 'text/csv' });
    } else {
      // Pad with spaces if needed
      const padding = ' '.repeat(targetSize - finalBytes.length);
      csvContent += padding;
    }
  }

  return new Blob([csvContent], { type: 'text/csv' });
}