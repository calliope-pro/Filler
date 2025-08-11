import React from 'react';
import { useTranslation } from 'react-i18next';

const FILL_MODES = ['zero', 'ascii', 'pattern', 'custom'];

export function GenerationOptions({ 
  fillMode, 
  onFillModeChange, 
  filename, 
  onFilenameChange,
  format 
}) {
  const { t } = useTranslation();
  const defaultExtension = format === 'bin' ? 'bin' : format;
  const defaultFilename = `fillr-file.${defaultExtension}`;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('options.fillMode')}
        </label>
        <div className="space-y-2">
          {FILL_MODES.map(mode => (
            <label key={mode} className="flex items-start space-x-3">
              <input
                type="radio"
                value={mode}
                checked={fillMode === mode}
                onChange={(e) => onFillModeChange(e.target.value)}
                className="mt-1 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {t(`options.fillModes.${mode}.label`)}
                </span>
                <p className="text-sm text-gray-600">{t(`options.fillModes.${mode}.description`)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="filename-input" className="block text-sm font-medium text-gray-700">
          {t('options.filename')}
        </label>
        <input
          id="filename-input"
          type="text"
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          placeholder={defaultFilename}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-600">
          {t('options.filenameHelp', { filename: defaultFilename })}
        </p>
      </div>
    </div>
  );
}