import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const Login = () => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] relative overflow-hidden font-sans">
      
      {/* BACKGROUND GLOWS (TONS CLAROS) */}
      <div className="absolute w-[600px] h-[600px] bg-blue-200/50 blur-[120px] rounded-full -top-40 -left-40 animate-pulse"></div>
      <div className="absolute w-[500px] h-[500px] bg-indigo-100/60 blur-[120px] rounded-full bottom-0 right-0"></div>

      {/* CARD CENTRALIZADO */}
      <div className="relative w-full max-w-[400px] mx-4 backdrop-blur-2xl bg-white/70 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[32px] p-10">
        
        {/* LOGO FLOW */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black tracking-tight">
            {isSignUp ? "Join Flow" : "Welcome back"}
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            Manage your finances beautifully
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {/* USERNAME */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border border-gray-100 text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border border-gray-100 text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          {/* BUTTON */}
          <button
            disabled={loading}
            className="w-full mt-2 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Continue"}
          </button>
        </form>

        {/* SWITCH */}
        <div className="text-center mt-8">
          <button
            onClick={()=>setIsSignUp(!isSignUp)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Create a new Flow account"}
          </button>
        </div>

      </div>

      {/* FOOTER DISCRETO */}
      <footer className="absolute bottom-8 w-full text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
          Flow Finance
        </p>
      </footer>
    </div>
  );
};