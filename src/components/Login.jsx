import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

// Componente Interno para o Seletor de Línguas
const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

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

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    
    const email = `${username.trim().toLowerCase()}@tracker.com`;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else {
        alert("Account created!");
        setIsSignUp(false);
        setPassword('');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Invalid credentials");
    }
    setLoading(false);
  };

  // NOVA FUNÇÃO: Login com FaceID/Passkey
  const handlePasskeyLogin = async () => {
    setLoading(true);
    try {
      // Nota: Para isto funcionar, tens de ativar o WebAuthn no Dashboard do Supabase
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;
    } catch (error) {
      console.error("Erro FaceID:", error.message);
      // Se der erro porque não está configurado, avisamos o user
      alert(t('auth.passkeyError') || "FaceID not configured for this device yet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] relative overflow-hidden font-sans">
      
      {/* SELETOR DE LÍNGUA */}
      <div className="absolute top-8 right-8 z-50">
        <LanguageSelector />
      </div>

      {/* BACKGROUND GLOWS ... (código original) */}

      <div className="relative w-full max-w-[400px] mx-4 backdrop-blur-2xl bg-white/70 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[32px] p-10">
        
        {/* LOGO FLOW ... (código original) */}

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
            type="text"
            name="username" // Adicionado para Auto-fill
            autoComplete="username" // Adicionado para Auto-fill
            placeholder={t('auth.placeholderUser')}
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border border-gray-100 text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          <input
            type="password"
            name="password" // Adicionado para Auto-fill
            autoComplete={isSignUp ? "new-password" : "current-password"} // Adicionado para Auto-fill
            placeholder={t('auth.placeholderPass')}
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

        {/* BOTÃO FACEID (Só aparece no Login) */}
        {!isSignUp && (
          <div className="mt-4">
            <button
              onClick={handlePasskeyLogin}
              type="button"
              className="w-full py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <span className="text-xl">👤</span> {t('auth.signInWithFaceID') || 'Sign in with FaceID'}
            </button>
          </div>
        )}

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

      {/* FOOTER ... (código original) */}
    </div>
  );
};