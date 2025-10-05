import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

// A custom hook for accessing translations and handling keyboard shortcuts
export const useTranslation = () => {
  const { t, language, setLanguage, cycleLanguage, isLoading } = useLanguageStore();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Use Ctrl+Shift+L to cycle languages
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        cycleLanguage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cycleLanguage]);

  return { t, language, setLanguage, isLoading };
};

// The main language store
export const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: 'en', // Default language is now English
      translations: {},
      isLoading: true,

      // Function to get a translation string by key
      t: (key, fallback = '') => {
        const translations = get().translations;
        // Return the translated string, or the fallback, or the key itself
        return translations[key] || fallback || key;
      },

      // Asynchronously sets the language and loads the corresponding translation file
      setLanguage: async (lang) => {
        if (!['en', 'ar', 'ku'].includes(lang)) return;

        set({ isLoading: true });
        try {
          // Dynamically import the JSON file for the selected language
          const translationModule = await import(`../locales/${lang}.json`);
          set({
            language: lang,
            translations: translationModule.default,
            isLoading: false,
          });
          // Update the document's lang and dir attributes for accessibility and CSS
          document.documentElement.lang = lang;
          document.documentElement.dir = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
        } catch (error) {
          console.error(`Failed to load translation for ${lang}:`, error);
          set({ isLoading: false }); // Ensure loading state is reset on error
        }
      },

      // Function to cycle through the available languages
      cycleLanguage: () => {
        const languages = ['en', 'ar', 'ku'];
        const currentLang = get().language;
        const currentIndex = languages.indexOf(currentLang);
        const nextIndex = (currentIndex + 1) % languages.length;
        get().setLanguage(languages[nextIndex]);
      },
    }),
    {
      name: 'language-storage',
      // Persist only the user's language preference, not the entire translation table
      partialize: (state) => ({ language: state.language }),
    }
  )
);

// Initialize the store by loading the default or persisted language translations on startup
useLanguageStore.getState().setLanguage(useLanguageStore.getState().language);

