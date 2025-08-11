import { useTranslation } from 'react-i18next';
import { getSupportedUnits } from '../utils/sizeParser.ts';
import { SizeUnit } from '../types/sizeUnits';

interface SizeInputProps {
  value: string;
  unit: SizeUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: SizeUnit) => void;
}

export function SizeInput({ value, unit, onValueChange, onUnitChange }: SizeInputProps): JSX.Element {
  const { t } = useTranslation();
  const units = getSupportedUnits();

  return (
    <div className="space-y-2">
      <label htmlFor="size-input" className="block text-sm font-medium text-gray-700">
        {t('form.fileSize')}
      </label>
      <div className="flex gap-2">
        <input
          id="size-input"
          type="numeric"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          min="0"
          placeholder={t('form.sizePlaceholder')}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as SizeUnit)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label={t('form.fileSize')}
        >
          {units.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
    </div>
  );
}