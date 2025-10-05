import { Bell, Globe } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

export default function Header() {
  const { user } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();

  const languages = [
    { code: 'ar', label: 'العربية', flag: '🇮🇶' },
    { code: 'ku', label: 'کوردی', flag: '🟨🟥🟩' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          {t('welcome')}, {user?.name}! 👋
        </h2>
        <p className="text-sm text-gray-500">
          {user?.tier === 'free' ? t('free_trial') : user?.tier}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50">
            <Globe size={20} />
            <span className="text-sm font-medium">
              {languages.find(l => l.code === language)?.label}
            </span>
          </button>
          
          <div className="absolute top-full mt-2 end-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-50">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 w-full text-start"
              >
                <span>{lang.flag}</span>
                <span className="text-sm">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-50">
          <Bell size={20} />
          <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <img
            src={user?.profile_image_url || `https://ui-avatars.com/api/?name=${user?.name}&background=4f46e5&color=fff`}
            alt={user?.name}
            className="w-10 h-10 rounded-full"
          />
        </div>
      </div>
    </header>
  );
}
