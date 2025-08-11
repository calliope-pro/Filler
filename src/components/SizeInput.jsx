import React from 'react';
import { useTranslation } from 'react-i18next';
import { getSupportedUnits } from '../utils/sizeParser.js';

export function SizeInput({ value, unit, onValueChange, onUnitChange, error }) {
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
          type="number"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          min="0"
          step="any"
          placeholder={t('form.sizePlaceholder')}
          className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-describedby={error ? 'size-error' : undefined}
        />
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label={t('form.fileSize')}
        >
          {units.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      {error && (
        <p id="size-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}