import { useTranslation } from 'react-i18next';

export const Navbar = ({ username }) => {
  const { t } = useTranslation();

  return (
    <nav className="w-full p-6 flex flex-col items-center border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <h1 className="text-xl font-black text-blue-600 tracking-tight uppercase">
        {t('app.name')}
      </h1>
      {username && (
        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
          {t('dashboard.welcome_short') || 'Olá'}, <span className="text-blue-500">{username}</span>
        </p>
      )}
    </nav>
  );
};