import { useTranslation } from 'react-i18next';

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-3 p-2 bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
      <button
        onClick={() => changeLanguage('pt')}
        className={`relative transition-all duration-300 hover:scale-110 ${
          i18n.language === 'pt' 
            ? 'ring-2 ring-blue-500 ring-offset-2 rounded-full scale-105' 
            : 'opacity-60 hover:opacity-100'
        }`}
      >
        <img src="/pt.png" alt="Português" className="w-8 h-8 rounded-full object-cover shadow-sm" />
      </button>

      <button
        onClick={() => changeLanguage('en')}
        className={`relative transition-all duration-300 hover:scale-110 ${
          i18n.language === 'en' 
            ? 'ring-2 ring-blue-500 ring-offset-2 rounded-full scale-105' 
            : 'opacity-60 hover:opacity-100'
        }`}
      >
        <img src="/en.png" alt="English" className="w-8 h-8 rounded-full object-cover shadow-sm" />
      </button>
    </div>
  );
};