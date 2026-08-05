import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'mr', label: 'मराठी', short: 'मरा' },
  { code: 'hi', label: 'हिन्दी', short: 'हिं' },
];

export default function LanguageSelector({ className = '' }) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
  };

  return (
    <div className={`relative inline-flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/80 transition-all border border-slate-200/60 shadow-xs ${className}`}>
      <Globe className="h-4 w-4 text-blue-600 shrink-0" />
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer pr-1"
        aria-label="Select Language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-white text-slate-800">
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
