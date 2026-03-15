import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

// Componente Interno para o Seletor de Línguas
const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  return (
    <div className="flex gap-4 p-2 bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm">
      <button
        onClick={() => changeLanguage('pt')}
        className={`transition-all duration-300 hover:scale-110 active:scale-95 ${
          i18n.language === 'pt' ? 'ring-2 ring-blue-500 ring-offset-2 rounded-full' : 'opacity-50 hover:opacity-100'
        }`}
      >
        <img src="/pt.png" alt="Português" className="w-8 h-8 rounded-full object-cover shadow-sm" />
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`transition-all duration-300 hover:scale-110 active:scale-95 ${
          i18n.language === 'en' ? 'ring-2 ring-blue-500 ring-offset-2 rounded-full' : 'opacity-50 hover:opacity-100'
        }`}
      >
        <img src="/en.png" alt="English" className="w-8 h-8 rounded-full object-cover shadow-sm" />
      </button>
    </div>
  );
};

export const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Foco automático para disparar a sugestão de biometria/teclado
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById('username')?.focus();
    }, 600); 
    return () => clearTimeout(timer);
  }, [isSignUp]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    
    const email = `${username.trim().toLowerCase()}@tracker.com`;

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { display_name: username } }
        });
        
        if (signUpError) throw signUpError;

        // Login imediato para o browser associar a password à conta com sucesso
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Invalid credentials");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] relative overflow-hidden font-sans">
      
      <div className="absolute top-8 right-8 z-50">
        <LanguageSelector />
      </div>

      {/* BACKGROUND GLOWS */}
      <div className="absolute w-[600px] h-[600px] bg-blue-200/50 blur-[120px] rounded-full -top-40 -left-40 animate-pulse"></div>
      <div className="absolute w-[500px] h-[500px] bg-indigo-100/60 blur-[120px] rounded-full bottom-0 right-0"></div>

      <div className="relative w-full max-w-[400px] mx-4 backdrop-blur-2xl bg-white/70 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[32px] p-10">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black tracking-tight">
            {isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            {t('app.tagline')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            id="username"
            type="text"
            name="username"
            autoComplete="username" 
            placeholder={t('auth.placeholderUser')}
            required
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border border-gray-100 text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          <input
            id="password"
            type="password"
            name="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder={t('auth.placeholderPass')}
            required
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border border-gray-100 text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          <button
            disabled={loading}
            className="w-full mt-2 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {loading ? t('actions.loading') : t('auth.continue')}
          </button>
        </form>

        <div className="text-center mt-8">
          <button
            type="button"
            onClick={()=>setIsSignUp(!isSignUp)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isSignUp ? t('auth.switchSignIn') : t('auth.switchSignUp')}
          </button>
        </div>
      </div>

      <footer className="absolute bottom-8 w-full text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
          {t('app.name')}
        </p>
      </footer>
    </div>
  );
};