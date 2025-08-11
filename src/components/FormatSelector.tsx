import { useTranslation } from 'react-i18next';

const SUPPORTED_FORMATS = ['txt', 'csv', 'png', 'pdf', 'mp3', 'mp4'] as const;

interface FormatSelectorProps {
  value: string;
  onChange: (format: string) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t('form.fileFormat')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label={t('form.fileFormat')}
      >
        {SUPPORTED_FORMATS.map(format => (
          <option key={format} value={format}>
            {t(`formats.${format}.label`)}
          </option>
        ))}
      </select>
      <p className="text-sm text-gray-600">
        {t(`formats.${value}.description`)}
      </p>
    </div>
  );
}
