import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import mrTranslation from './locales/mr.json';
import hiTranslation from './locales/hi.json';

const savedLanguage = localStorage.getItem('hms_language') || localStorage.getItem('i18nextLng') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      mr: { translation: mrTranslation },
      hi: { translation: hiTranslation },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('hms_language', lng);
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
