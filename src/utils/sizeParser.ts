const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GiB

type SizeUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'KiB' | 'MiB' | 'GiB' | 'TiB';

const multipliers: Record<SizeUnit, number> = {
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

export function parseSizeInput(value: string | number, unit: string): number {
  const n = Number(value);
  
  // More comprehensive validation
  if (isNaN(n) || n < 0 || !isFinite(n)) {
    throw new Error('Invalid size value');
  }

  const multiplier = multipliers[unit as SizeUnit];
  if (!multiplier) {
    throw new Error(`Unsupported unit: ${unit}`);
  }

  const bytes = Math.floor(n * multiplier);
  
  // Check for overflow or invalid calculation results
  if (!isFinite(bytes) || bytes < 0) {
    throw new Error('Invalid size calculation result');
  }
  
  if (bytes > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum limit');
  }

  return bytes;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getSupportedUnits(): string[] {
  return ['B', 'KB', 'MB', 'GB', 'KiB', 'MiB', 'GiB'];
}

export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}