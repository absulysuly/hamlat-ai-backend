import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../store/languageStore';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇮🇶' },
  { code: 'ku', name: 'کوردی', flag: '🟨' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
      >
        <Globe size={20} />
        <span className="hidden md:inline">{currentLanguage?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 end-0 bg-white rounded-lg shadow-lg w-40 z-50 overflow-hidden">
          <ul>
            {languages.map(lang => (
              <li key={lang.code}>
                <button
                  onClick={() => handleSelect(lang.code)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-start text-gray-800 hover:bg-gray-100"
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
