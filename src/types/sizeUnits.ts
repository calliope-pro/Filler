/**
 * Supported size units for file size input
 */
export const SUPPORTED_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'KiB', 'MiB', 'GiB', 'TiB'] as const;

/**
 * Union type for all supported size units
 */
export type SizeUnit = typeof SUPPORTED_SIZE_UNITS[number];

/**
 * Type guard to check if a string is a valid size unit
 */
export function isValidSizeUnit(unit: string): unit is SizeUnit {
  return (SUPPORTED_SIZE_UNITS as readonly string[]).includes(unit);
}

/**
 * Default size unit
 */
export const DEFAULT_SIZE_UNIT: SizeUnit = 'MB';

/**
 * Size multipliers for converting to bytes
 */
export const SIZE_MULTIPLIERS: Record<SizeUnit, number> = {
  'B': 1,
  'KB': 1000,
  'MB': 1000 * 1000,
  'GB': 1000 * 1000 * 1000,
  'TB': 1000 * 1000 * 1000 * 1000,
  'KiB': 1024,
  'MiB': 1024 * 1024,
  'GiB': 1024 * 1024 * 1024,
  'TiB': 1024 * 1024 * 1024 * 1024,
} as const;

/**
 * Binary units (using 1024 base)
 */
export const BINARY_UNITS: readonly SizeUnit[] = ['B', 'KiB', 'MiB', 'GiB', 'TiB'] as const;

/**
 * Decimal units (using 1000 base)
 */
export const DECIMAL_UNITS: readonly SizeUnit[] = ['B', 'KB', 'MB', 'GB', 'TB'] as const;