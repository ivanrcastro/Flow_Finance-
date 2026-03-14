import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Navbar } from "../components/Navbar";
import { AddExpense } from "../components/AddExpense";
import BudgetChart from "../components/BudgetChart";
import { Login } from "../components/Login";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-8 text-center flex flex-col items-center gap-1 mt-4">
      <div className="w-6 h-[1px] bg-gray-200 mb-2 rounded-full"></div>
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
        Flow <span className="font-light">Finance</span>
      </p>
      <p className="text-[9px] font-semibold text-gray-400/40 uppercase tracking-tighter">
        © {currentYear} • {t('app.footer')}
      </p>
    </footer>
  );
};

export const Home = () => {
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  
  const ADMIN_EMAIL = 'your-email@example.com'; 

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Listener de Autenticação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Carregar dados sempre que a sessão ou o mês mudar
  useEffect(() => {
    if (session) {
      fetchExpenses();
      fetchMonthlyBudget();
    }
  }, [session, selectedMonth]);

  const username = session?.user?.email?.split('@')[0];
  const displayName = username ? username.charAt(0).toUpperCase() + username.slice(1) : "User";

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  // CORREÇÃO DO LOGOUT (Evita o Erro 403 Forbidden)
  const handleLogout = async () => {
    try {
      // Tentamos o logout oficial no Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error.message);
    } finally {
      // Limpamos TUDO localmente para garantir que volta ao Login
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload(); 
    }
  };

  async function fetchExpenses() {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (!error) setExpenses(data);
  }

  async function fetchMonthlyBudget() {
    if (!session?.user?.id) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    
    const { data, error } = await supabase
      .from('budgets')
      .select('amount')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (!error && data) {
      setMonthlyBudget(data.amount);
    } else {
      setMonthlyBudget(1000); // Valor base caso não exista registo
    }
  }

  const handleBudgetChange = async (e) => {
    const value = Number(e.target.value);
    setMonthlyBudget(value);
    
    const [year, month] = selectedMonth.split('-').map(Number);

    const { error } = await supabase
      .from('budgets')
      .upsert({ 
        user_id: session.user.id,
        month: month,
        year: year,
        amount: value
      }, { onConflict: 'user_id, month, year' });

    if (error) console.error("Erro ao guardar orçamento:", error.message);
  };

  const handleMonthChange = (offset) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleAddExpense = async (newExpense) => {
    const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
    const dateToSave = isCurrentMonth ? new Date().toISOString() : `${selectedMonth}-01T12:00:00`;

    const { data, error } = await supabase.from('expenses').insert([
      { 
        amount: newExpense.amount, 
        category: newExpense.category, 
        user_id: session.user.id,
        created_at: dateToSave 
      }
    ]).select();

    if (!error) {
      setExpenses([data[0], ...expenses]);
      setShowForm(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    const confirmDelete = window.confirm(t('actions.cancel') + "?"); 
    if (!confirmDelete) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  if (!session) return <Login />;

  const currentMonthData = expenses.filter(exp => exp.created_at.startsWith(selectedMonth));
  const prevDateObj = new Date(selectedMonth + "-01");
  prevDateObj.setMonth(prevDateObj.getMonth() - 1);
  const prevMonthStr = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthData = expenses.filter(exp => exp.created_at.startsWith(prevMonthStr));

  const totalSpent = currentMonthData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] font-sans antialiased flex flex-col">
      
      <header className="px-6 pt-12 pb-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                  <span className="text-blue-600 font-bold text-sm">{displayName.charAt(0)}</span>
              </div>
              
              <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-black leading-none">
                    {t('dashboard.welcome')} {displayName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                        {t('dashboard.mtd')}
                    </p>
                    {session.user.email === ADMIN_EMAIL && (
                        <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">Admin</span>
                    )}
                  </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={toggleLanguage}
                className="w-7 h-7 rounded-full overflow-hidden border border-white shadow-sm hover:scale-110 active:scale-95 transition-all"
              >
                <img 
                  src={i18n.language === 'pt' ? "/en.png" : "/pt.png"} 
                  alt="Language Toggle" 
                  className="w-full h-full object-cover"
                />
              </button>

              <button 
                onClick={handleLogout} 
                className="bg-gray-200/50 hover:bg-gray-200 px-3 py-1.5 rounded-full text-[11px] font-bold text-gray-500 transition-all active:scale-95 uppercase tracking-wider"
              >
                {t('nav.logout')}
              </button>
            </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-5 space-y-6 flex-grow w-full">
        <section className="bg-white p-8 rounded-[32px] shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center animate-fade-in group text-center">
          <label className="text-[9px] font-bold uppercase text-blue-500 tracking-[0.2em] mb-2 opacity-60">
            {t('dashboard.budget')}
          </label>
          <div className="relative flex flex-col items-center">
            <div className="flex items-baseline justify-center">
              <input 
                type="number" 
                value={monthlyBudget} 
                onChange={handleBudgetChange}
                className="text-3xl font-bold text-black w-auto max-w-[150px] outline-none bg-transparent border-none p-0 tracking-tighter focus:ring-0 text-center"
              />
              <span className="text-xl font-bold text-gray-200 ml-1 select-none">€</span>
            </div>
            <div className="w-12 h-[1px] bg-gray-100 mt-2 rounded-full group-focus-within:bg-blue-500 group-focus-within:w-20 transition-all duration-700 ease-in-out"></div>
          </div>
        </section>

        <div className="flex items-center justify-between bg-white rounded-2xl p-1.5 shadow-sm border border-gray-50">
          <button onClick={() => handleMonthChange(-1)} className="p-2.5 text-blue-600 active:scale-75 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="text-[13px] font-bold capitalize tracking-tight text-gray-700">
            {new Date(selectedMonth + "-01").toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => handleMonthChange(1)} className="p-2.5 text-blue-600 active:scale-75 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <BudgetChart 
          currentMonthExpenses={currentMonthData}
          lastMonthExpenses={lastMonthData}
          totalSpent={totalSpent}
          remaining={monthlyBudget - totalSpent}
          budget={monthlyBudget}
        />

        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-gray-400 px-4 uppercase tracking-[0.05em]">Activity</h3>
          <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-gray-50">
            {currentMonthData.length === 0 ? (
              <div className="p-12 text-center text-gray-300 font-medium text-xs">No records found</div>
            ) : (
              currentMonthData.map((exp, idx) => (
                <div key={exp.id} className={`p-4 flex justify-between items-center active:bg-gray-50 transition-colors ${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                  <div className="flex flex-col">
                    <span className="font-bold text-[14px] text-gray-800 tracking-tight">{t(`categories.${exp.category}`)}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                      {new Date(exp.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[15px] text-black tracking-tight">-{parseFloat(exp.amount).toFixed(2)}€</span>
                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-200 hover:text-red-500 active:opacity-20 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Footer />
      </main>

      <button 
        onClick={() => setShowForm(true)} 
        className="fixed bottom-8 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-90 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
          <div className="w-full max-w-sm animate-slide-up bg-white rounded-[32px] shadow-2xl overflow-hidden p-6">
            <AddExpense onAddExpense={handleAddExpense} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};