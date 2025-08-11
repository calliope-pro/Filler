const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GiB

export function parseSizeInput(value, unit) {
  const n = Number(value);
  if (isNaN(n) || n < 0) {
    throw new Error('Invalid size value');
  }

  const multipliers = {
    'B': 1,
    'KB': 1000,
    'MB': 1000 * 1000,
    'GB': 1000 * 1000 * 1000,
    'TB': 1000 * 1000 * 1000 * 1000,
    'KiB': 1024,
    'MiB': 1024 * 1024,
    'GiB': 1024 * 1024 * 1024,
    'TiB': 1024 * 1024 * 1024 * 1024,
  };

  const multiplier = multipliers[unit];
  if (!multiplier) {
    throw new Error(`Unsupported unit: ${unit}`);
  }

  const bytes = Math.floor(n * multiplier);
  if (bytes > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum limit');
  }

  return bytes;
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getSupportedUnits() {
  return ['B', 'KB', 'MB', 'GB', 'KiB', 'MiB', 'GiB'];
}

export function getMaxFileSize() {
  return MAX_FILE_SIZE;
}