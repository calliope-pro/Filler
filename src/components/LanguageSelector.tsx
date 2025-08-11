import { useTranslation } from 'react-i18next';
import { RadioGroup } from '@headlessui/react';

interface Language {
  code: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { code: 'ja', name: '日本語' },
  { code: 'en', name: 'English' }
];

export function LanguageSelector(): JSX.Element {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string): void => {
    i18n.changeLanguage(languageCode);
    // Update HTML lang attribute
    const htmlElement = document.getElementById('html-root');
    if (htmlElement) {
      htmlElement.lang = languageCode;
    }
  };

  return (
    <RadioGroup value={i18n.language} onChange={handleLanguageChange}>
      <RadioGroup.Label className="sr-only">Language Selection</RadioGroup.Label>
      <div className="flex items-center space-x-2">
        {LANGUAGES.map((lang) => (
          <RadioGroup.Option
            key={lang.code}
            value={lang.code}
            className={({ active, checked }) =>
              `cursor-pointer px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                checked
                  ? 'bg-blue-600 text-white shadow-sm'
                  : active
                  ? 'bg-gray-300 text-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`
            }
          >
            <RadioGroup.Label
              as="span"
              className="cursor-pointer"
              aria-label={`Switch to ${lang.name}`}
            >
              {lang.name}
            </RadioGroup.Label>
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}