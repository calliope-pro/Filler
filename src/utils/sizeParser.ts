import { FileFormat } from '../types/fileFormats';
import { SizeUnit, SIZE_MULTIPLIERS } from '../types/sizeUnits';

const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GiB

// 各ファイル形式の技術的最小サイズ (bytes)
const MIN_FILE_SIZES: Record<FileFormat, number> = {
  'txt': 1,    // 任意の1文字
  'csv': 1,    // 任意の1文字
  'json': 2,   // {} 最小有効JSON
  'png': 67,   // PNG最小ヘッダー + IEND
  'pdf': 32,   // PDF最小構造
  'mp3': 128,  // MP3最小フレーム
  'mp4': 256   // MP4最小構造
};

export function parseSizeInput(value: string | number, unit: SizeUnit): number {
  const n = Number(value);
  
  // More comprehensive validation
  if (isNaN(n) || n < 0 || !isFinite(n)) {
    throw new Error('Invalid size value');
  }

  const multiplier = SIZE_MULTIPLIERS[unit];
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

  // Note: Format-specific minimum size validation is now handled as warning in UI
  // Small files may not be valid for their format but generation will proceed

  return bytes;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getSupportedUnits(): readonly SizeUnit[] {
  return ['B', 'KB', 'MB', 'GB', 'KiB', 'MiB', 'GiB'] as const;
}

export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

export function getMinFileSize(format: FileFormat): number {
  return MIN_FILE_SIZES[format];
}