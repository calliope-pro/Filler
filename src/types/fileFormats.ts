/**
 * Supported file formats for dummy file generation
 */
export const SUPPORTED_FORMATS = ['txt', 'csv', 'png', 'pdf', 'mp3', 'mp4', 'json'] as const;

/**
 * Union type for all supported file formats
 */
export type FileFormat = typeof SUPPORTED_FORMATS[number];

/**
 * Type guard to check if a string is a valid file format
 */
export function isValidFileFormat(format: string): format is FileFormat {
  return (SUPPORTED_FORMATS as readonly string[]).includes(format);
}

/**
 * Default file format
 */
export const DEFAULT_FILE_FORMAT: FileFormat = 'txt';

/**
 * MIME type mapping for each file format
 */
export const MIME_TYPES: Record<FileFormat, string> = {
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv',
  png: 'image/png',
  pdf: 'application/pdf',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  json: 'application/json'
} as const;

/**
 * File extension mapping for each format
 */
export const FILE_EXTENSIONS: Record<FileFormat, string> = {
  txt: 'txt',
  csv: 'csv',
  png: 'png',
  pdf: 'pdf',
  mp3: 'mp3',
  mp4: 'mp4',
  json: 'json'
} as const;