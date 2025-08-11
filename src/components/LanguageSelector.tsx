import { useTranslation } from 'react-i18next';

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
    <div className="flex items-center space-x-2">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
            i18n.language === lang.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          aria-label={`Switch to ${lang.name}`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
}