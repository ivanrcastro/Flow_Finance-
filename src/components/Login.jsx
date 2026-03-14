import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    
    // Internal mapping to a tracker email for Supabase auth
    const email = `${username.trim().toLowerCase()}@tracker.com`;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert("Error: " + error.message);
      } else {
        alert("Account created! You can now sign in.");
        setIsSignUp(false);
        setPassword('');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Invalid username or password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center p-6 font-sans antialiased">
      
      <div className="w-full max-w-[340px] mt-20 animate-fade-in">
        
        {/* FLOW APP ICON */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-b from-[#007AFF] to-[#0051AF] rounded-[22%] shadow-lg flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-[22%] shadow-inner opacity-10 bg-white"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-[32px] font-extrabold tracking-tight text-black">
            {isSignUp ? 'Create ID' : 'Flow'}
          </h2>
          <p className="text-[15px] text-[#8E8E93] mt-1 font-medium leading-tight">
            Seamlessly manage your daily expenses.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {/* IOS STYLE INSET GROUP */}
          <div className="bg-white rounded-[14px] shadow-sm overflow-hidden border-t-[0.5px] border-b-[0.5px] border-gray-200">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Username" 
                className="w-full px-4 py-[14px] bg-transparent outline-none text-[17px] placeholder:text-[#C4C4C6]"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
              />
              <div className="absolute bottom-0 right-0 left-4 h-[0.5px] bg-gray-200"></div>
            </div>
            
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-4 py-[14px] bg-transparent outline-none text-[17px] placeholder:text-[#C4C4C6]"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white py-[14px] rounded-[14px] font-semibold text-[17px] shadow-md active:opacity-80 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-5">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[15px] font-medium text-[#007AFF] active:opacity-30 transition-all"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'New to Flow? Create yours'}
          </button>
        </div>

      </div>

      {/* STICKY FOOTER */}
      <footer className="mt-auto pb-10">
        <p className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-[0.3em]">
          Flow Finance • {currentYear}
        </p>
      </footer>
    </div>
  );
};