import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { AddExpense } from "../components/AddExpense";
import { RecurringExpenses } from "../components/RecurringExpenses";
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
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);
  
  const isInjecting = useRef(false);
  const ADMIN_EMAIL = 'your-email@example.com';

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchExpenses();
      fetchMonthlyBudget();
      fetchRecurringExpenses();
    }
  }, [session, selectedMonth]);

  useEffect(() => {
    if (session && recurringExpenses.length > 0) {
      injectRecurringForMonth();
    }
  }, [selectedMonth, recurringExpenses]);

  const username = session?.user?.email?.split('@')[0];
  const displayName = username ? username.charAt(0).toUpperCase() + username.slice(1) : "User";

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error.message);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  async function fetchExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setExpenses(data);
  }

  async function fetchRecurringExpenses() {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    if (!error) setRecurringExpenses(data);
  }

  async function injectRecurringForMonth() {
    if (isInjecting.current || !session?.user?.id || recurringExpenses.length === 0) return;
    isInjecting.current = true;
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const { data: existing, error: checkError } = await supabase
        .from('expenses')
        .select('recurring_expense_id')
        .eq('user_id', session.user.id)
        .not('recurring_expense_id', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (checkError) throw checkError;
      const existingIds = (existing || []).map(e => e.recurring_expense_id);
      const toInject = recurringExpenses.filter(r => r.active && !existingIds.includes(r.id));

      if (toInject.length > 0) {
        const rows = toInject.map(r => ({
          user_id: session.user.id,
          amount: r.amount,
          category: r.category,
          note: r.note,
          recurring_expense_id: r.id,
          created_at: new Date(year, month - 1, 1, 8, 0, 0).toISOString()
        }));
        const { error: insertError } = await supabase.from('expenses').insert(rows);
        if (!insertError) fetchExpenses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      isInjecting.current = false;
    }
  }

  async function fetchMonthlyBudget() {
    if (!session?.user?.id) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const { data, error } = await supabase
      .from('budgets')
      .select('amount')
      .eq('user_id', session.user.id)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    if (!error && data) setMonthlyBudget(data.amount.toString().replace('.', ','));
    else setMonthlyBudget("1000");
  }

  const handleBudgetChange = async (e) => {
    let rawValue = e.target.value;
    if (rawValue === "" || /^[0-9]*[.,]?[0-9]*$/.test(rawValue)) {
      setMonthlyBudget(rawValue);
      const numericValue = parseFloat(rawValue.replace(',', '.'));
      if (!isNaN(numericValue) && session?.user?.id) {
        const [year, month] = selectedMonth.split('-').map(Number);
        await supabase.from('budgets').upsert({
          user_id: session.user.id, month, year, amount: numericValue
        }, { onConflict: 'user_id, month, year' });
      }
    }
  };

  const handleMonthChange = (offset) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleAddExpense = async (expenseData) => {
    if (editingExpense) {
      // 1. ATUALIZAR A DESPESA ATUAL
      const { data, error } = await supabase
        .from('expenses')
        .update({
          amount: expenseData.amount,
          category: expenseData.category,
          note: expenseData.note
        })
        .eq('id', editingExpense.id)
        .select();

      if (!error && data) {
        // 2. SE FOR RECORRENTE, ATUALIZAR O "MOLDE" PARA OS MESES SEGUINTES
        if (editingExpense.recurring_expense_id) {
          await supabase
            .from('recurring_expenses')
            .update({
              amount: expenseData.amount,
              category: expenseData.category,
              note: expenseData.note
            })
            .eq('id', editingExpense.recurring_expense_id);
          
          fetchRecurringExpenses(); // Atualiza a lista de automáticas
        }

        setExpenses(prev => prev.map(ex => ex.id === editingExpense.id ? data[0] : ex));
        setShowForm(false);
        setEditingExpense(null);
      }
    } else {
      // MODO INSERÇÃO
      const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
      const dateToSave = isCurrentMonth ? new Date().toISOString() : `${selectedMonth}-01T12:00:00`;

      let recurringId = null;
      if (expenseData.isRecurring) {
        const { data: recData, error: recError } = await supabase
          .from('recurring_expenses')
          .insert([{
            user_id: session.user.id,
            amount: expenseData.amount,
            category: expenseData.category,
            note: expenseData.note,
            active: true
          }])
          .select().single();
        if (recError) return;
        recurringId = recData.id;
        fetchRecurringExpenses();
      }

      const { data, error } = await supabase.from('expenses').insert([{
        amount: expenseData.amount,
        category: expenseData.category,
        note: expenseData.note,
        user_id: session.user.id,
        created_at: dateToSave,
        recurring_expense_id: recurringId
      }]).select();

      if (!error) {
        setExpenses([data[0], ...expenses]);
        setShowForm(false);
      }
    }
  };

  const handleDeleteExpense = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t('actions.cancel') + "?")) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  if (!session) return <Login />;

  const currentMonthData = expenses.filter(exp => exp.created_at.startsWith(selectedMonth));
  const budgetAsNumber = parseFloat(String(monthlyBudget).replace(',', '.')) || 0;
  const totalSpent = currentMonthData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const remaining = parseFloat((budgetAsNumber - totalSpent).toFixed(2));

  const prevDateObj = new Date(selectedMonth + "-01");
  prevDateObj.setMonth(prevDateObj.getMonth() - 1);
  const prevMonthStr = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthData = expenses.filter(exp => exp.created_at.startsWith(prevMonthStr));

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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">{t('dashboard.mtd')}</p>
                {session.user.email === ADMIN_EMAIL && (
                  <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">Admin</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLanguage} className="w-7 h-7 rounded-full overflow-hidden border border-white shadow-sm hover:scale-110 active:scale-95 transition-all">
              <img src={i18n.language === 'pt' ? "/en.png" : "/pt.png"} alt="Toggle" className="w-full h-full object-cover" />
            </button>
            <button onClick={handleLogout} className="bg-gray-200/50 hover:bg-gray-200 px-3 py-1.5 rounded-full text-[11px] font-bold text-gray-500 transition-all uppercase tracking-wider">
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-5 space-y-6 flex-grow w-full">
        {/* Budget Section */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col items-center justify-center border border-gray-50 group">
          <label className="text-[9px] font-bold uppercase text-blue-500 tracking-[0.2em] mb-2 opacity-60">{t('dashboard.budget')}</label>
          <div className="relative flex flex-col items-center">
            <div className="flex items-baseline justify-center">
              <input
                type="text"
                inputMode="decimal"
                value={monthlyBudget}
                onChange={handleBudgetChange}
                onBlur={() => {
                  if (monthlyBudget) {
                    const fixed = parseFloat(monthlyBudget.toString().replace(',', '.')).toFixed(2);
                    setMonthlyBudget(fixed.replace('.', ','));
                  }
                }}
                className="text-3xl font-bold text-black w-full max-w-[180px] outline-none bg-transparent border-none p-0 tracking-tighter focus:ring-0 text-center shadow-none appearance-none"              
              />
              <span className="text-xl font-bold text-gray-200 ml-1 select-none">€</span>
            </div>
            <div className="w-12 h-[1px] bg-gray-100 mt-2 rounded-full group-focus-within:bg-blue-500 group-focus-within:w-20 transition-all duration-700 ease-in-out"></div>
          </div>
        </section>

        {/* Month Selector */}
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
          remaining={remaining}
          budget={budgetAsNumber}
        />

        <RecurringExpenses
          recurringExpenses={recurringExpenses}
          onUpdate={fetchRecurringExpenses}
        />

        {/* Activity List */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold text-gray-400 px-4 uppercase tracking-[0.05em]">Activity</h3>
          <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-gray-50">
            {currentMonthData.length === 0 ? (
              <div className="p-12 text-center text-gray-300 font-medium text-xs">No records found</div>
            ) : (
              currentMonthData.map((exp, idx) => (
                <div 
                  key={exp.id} 
                  onClick={() => handleEditClick(exp)}
                  className={`p-4 flex justify-between items-center active:bg-gray-50 cursor-pointer transition-colors group/item ${idx !== 0 ? 'border-t border-gray-50' : ''}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[14px] text-gray-800 tracking-tight leading-none">
                        {t(`categories.${exp.category}`)}
                      </span>
                      {/* Ícone de edição discreto */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-400 opacity-0 group-hover/item:opacity-40 transition-opacity"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      
                      {exp.recurring_expense_id && (
                        <span className="text-[9px] bg-blue-50 text-blue-400 px-1.5 py-0.5 rounded-full font-black">🔁</span>
                      )}
                    </div>
                    {exp.note && <span className="text-[11px] text-gray-500 italic mt-1 leading-none">{exp.note}</span>}
                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-1.5 tracking-tight">
                      {new Date(exp.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[15px] text-black tracking-tight">
                      -{parseFloat(exp.amount).toFixed(2).replace('.', ',')}€
                    </span>
                    <button 
                      onClick={(e) => handleDeleteExpense(exp.id, e)} 
                      className="text-gray-200 hover:text-red-500 transition-all p-1"
                    >
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

      {/* Floating Add Button */}
      <button
        onClick={() => { setEditingExpense(null); setShowForm(true); }}
        className="fixed bottom-8 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
          <div className="w-full max-w-sm animate-slide-up bg-white rounded-[32px] shadow-2xl p-6">
            <AddExpense 
              onAddExpense={handleAddExpense} 
              onClose={() => { setShowForm(false); setEditingExpense(null); }} 
              editingExpense={editingExpense}
            />
          </div>
        </div>
      )}
    </div>
  );
};