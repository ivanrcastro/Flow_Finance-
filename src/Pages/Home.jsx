import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { AddExpense } from "../components/AddExpense";
import { RecurringExpenses } from "../components/RecurringExpenses";
import BudgetChart from "../components/BudgetChart";
import { Login } from "../components/Login";
import { useTranslation } from "react-i18next";

// ---------------------------------------------------------------------------
// FOOTER COMPONENT
// A small component that just shows the app name and year at the bottom.
// It's separated here to keep the main component clean and readable.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// HOME COMPONENT
// This is the main screen of the app. It handles:
//   - Loading the user's expenses and recurring expenses from the database
//   - Injecting recurring expenses into the selected month automatically
//   - Adding, editing, and deleting expenses
//   - Managing the monthly budget
// ---------------------------------------------------------------------------
export const Home = () => {
  const { t, i18n } = useTranslation();

  // --- STATE ---
  // Think of state as variables that, when changed, automatically update the UI.
  const [session, setSession] = useState(null);             // The logged-in user's session
  const [expenses, setExpenses] = useState([]);             // All expenses loaded from the database
  const [recurringExpenses, setRecurringExpenses] = useState([]); // Recurring expense templates
  const [showForm, setShowForm] = useState(false);          // Whether the add/edit form is visible
  const [monthlyBudget, setMonthlyBudget] = useState("");   // The budget limit for the selected month
  const [editingExpense, setEditingExpense] = useState(null); // The expense being edited (or null)

  // useRef is like a variable that doesn't trigger a re-render when changed.
  // We use it here as a simple "lock" to prevent the injection function
  // from running twice at the same time (a race condition).
  const isInjecting = useRef(false);

  // Replace this with the email of the admin user you want to highlight in the UI.
  const ADMIN_EMAIL = 'your-email@example.com';

  // The selected month in "YYYY-MM" format (e.g. "2025-03").
  // It starts as the current month using an initializer function (the arrow function inside useState).
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // ---------------------------------------------------------------------------
  // EFFECT: Listen for login/logout events
  // useEffect runs code after the component renders.
  // The empty array [] at the end means it only runs ONCE, when the app loads.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Get the current session (in case the user was already logged in)
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    // Subscribe to future auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    // The return here is a "cleanup function" — it unsubscribes when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // EFFECT: Load data when the user logs in or changes the selected month
  // The array [session, selectedMonth] means this runs whenever either value changes.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (session) {
      fetchExpenses();
      fetchMonthlyBudget();
      fetchRecurringExpenses();
    }
  }, [session, selectedMonth]);

  // ---------------------------------------------------------------------------
  // EFFECT: Inject recurring expenses for the selected month
  // This runs whenever the selected month changes OR the recurring list updates.
  // It automatically adds the recurring expense entries to the month if they
  // don't exist yet — but only if the recurring expense started on or before
  // the selected month (thanks to start_month).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (session && recurringExpenses.length > 0) {
      injectRecurringForMonth();
    }
  }, [selectedMonth, recurringExpenses]);

  // Extract a display name from the user's email (e.g. "john" from "john@email.com")
  const username = session?.user?.email?.split('@')[0];
  const displayName = username ? username.charAt(0).toUpperCase() + username.slice(1) : "User";

  // Toggle between Portuguese and English
  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  // Sign the user out and clear any cached data
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

  // ---------------------------------------------------------------------------
  // FETCH: Load all expenses from Supabase
  // We load all expenses and then filter them by month on the client side
  // (see currentMonthData below). This avoids extra database calls when the
  // user navigates between months.
  // ---------------------------------------------------------------------------
  async function fetchExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setExpenses(data);
  }

  // ---------------------------------------------------------------------------
  // FETCH: Load the recurring expense templates for this user
  // These are the "blueprints" — not the actual monthly entries.
  // ---------------------------------------------------------------------------
  async function fetchRecurringExpenses() {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    if (!error) setRecurringExpenses(data);
  }

  // ---------------------------------------------------------------------------
  // INJECT: Automatically add recurring expenses to the selected month
  //
  // HOW IT WORKS:
  // 1. Find all expenses in this month that already came from a recurring template
  // 2. Compare with the full list of recurring templates
  // 3. For any template not yet represented this month, insert a new expense entry
  //
  // THE FIX (why this didn't work before):
  // Previously, the code would inject into ANY month the user visited, even months
  // before the recurring expense was created. Now we check two things:
  //   - start_month: the recurring expense must have started on or before this month
  //   - end_month: the recurring expense must not have been deleted before this month
  // ---------------------------------------------------------------------------
  async function injectRecurringForMonth() {
    // The isInjecting ref acts as a lock — if this function is already running,
    // we skip this call to avoid duplicate inserts.
    if (isInjecting.current || !session?.user?.id || recurringExpenses.length === 0) return;
    isInjecting.current = true;

    try {
      const [year, month] = selectedMonth.split('-').map(Number);

      // Build the date range for the selected month (first day to last day)
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      // Query the database for recurring-linked expenses already in this month
      const { data: existing, error: checkError } = await supabase
        .from('expenses')
        .select('recurring_expense_id')
        .eq('user_id', session.user.id)
        .not('recurring_expense_id', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (checkError) throw checkError;

      // Build a list of recurring template IDs that are already injected this month
      const existingIds = (existing || []).map(e => e.recurring_expense_id);

      // Decide which recurring templates still need to be injected this month.
      // We filter out templates that:
      //   - are inactive (the user toggled them off)
      //   - are already injected (existingIds check)
      //   - started AFTER the selected month (start_month check) ← THE FIX
      //   - were ended BEFORE the selected month (end_month check) ← THE FIX
      const toInject = recurringExpenses.filter(r => {
        const hasNotStartedYet = r.start_month > selectedMonth;
        const hasAlreadyEnded = r.end_month && r.end_month < selectedMonth;

        return (
          r.active &&
          !existingIds.includes(r.id) &&
          !hasNotStartedYet &&
          !hasAlreadyEnded
        );
      });

      // If there's anything to inject, insert them all at once
      if (toInject.length > 0) {
        const rows = toInject.map(r => ({
          user_id: session.user.id,
          amount: r.amount,
          category: r.category,
          note: r.note,
          recurring_expense_id: r.id,
          // We use the 1st of the month at 8am as the timestamp for injected expenses
          created_at: new Date(year, month - 1, 1, 8, 0, 0).toISOString()
        }));

        const { error: insertError } = await supabase.from('expenses').insert(rows);
        if (!insertError) fetchExpenses(); // Refresh the expenses list after inserting
      }
    } catch (err) {
      console.error("Error injecting recurring expenses:", err);
    } finally {
      // Always release the lock when we're done, even if there was an error
      isInjecting.current = false;
    }
  }

  // ---------------------------------------------------------------------------
  // FETCH: Load the budget for the selected month
  // Each month can have its own budget limit stored in the "budgets" table.
  // ---------------------------------------------------------------------------
  async function fetchMonthlyBudget() {
    if (!session?.user?.id) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const { data, error } = await supabase
      .from('budgets')
      .select('amount')
      .eq('user_id', session.user.id)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle(); // Returns null instead of an error if no row is found
    if (!error && data) setMonthlyBudget(data.amount.toString().replace('.', ','));
    else setMonthlyBudget("1000"); // Default budget if none is set
  }

  // ---------------------------------------------------------------------------
  // HANDLER: Save the budget as the user types
  // We use "upsert" which means "update if exists, insert if not".
  // ---------------------------------------------------------------------------
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

  // Move the selected month forward or backward by a given number of months
  const handleMonthChange = (offset) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // Open the edit form pre-filled with the selected expense
  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Add a new expense or update an existing one
  // ---------------------------------------------------------------------------
  const handleAddExpense = async (expenseData) => {

    // --- EDIT MODE ---
    if (editingExpense) {
      // Update the existing expense row in the database
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
        // If this expense is linked to a recurring template, also update the template
        // so future months will use the new values
        if (editingExpense.recurring_expense_id) {
          await supabase
            .from('recurring_expenses')
            .update({
              amount: expenseData.amount,
              category: expenseData.category,
              note: expenseData.note
            })
            .eq('id', editingExpense.recurring_expense_id);

          fetchRecurringExpenses(); // Refresh the recurring list with the new values
        }

        // Update the local state so the UI reflects the change immediately
        // (without needing to reload from the database)
        setExpenses(prev => prev.map(ex => ex.id === editingExpense.id ? data[0] : ex));
        setShowForm(false);
        setEditingExpense(null);
      }

    // --- ADD MODE ---
    } else {
      // Decide what timestamp to use for the new expense.
      // If we're in the current month, use right now.
      // If we're in a past/future month, use noon on the 1st of that month.
      const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
      const dateToSave = isCurrentMonth ? new Date().toISOString() : `${selectedMonth}-01T12:00:00`;

      let recurringId = null;

      // If the user checked "recurring", create the template first
      if (expenseData.isRecurring) {
        const { data: recData, error: recError } = await supabase
          .from('recurring_expenses')
          .insert([{
            user_id: session.user.id,
            amount: expenseData.amount,
            category: expenseData.category,
            note: expenseData.note,
            active: true,
            // start_month tells the injection system when this recurring expense was created.
            // Without this, the system would inject it into past months too — which is wrong.
            start_month: selectedMonth
          }])
          .select().single();

        if (recError) return;
        recurringId = recData.id;
        fetchRecurringExpenses(); // Show the new template in the recurring list
      }

      // Insert the actual expense entry for this month
      const { data, error } = await supabase.from('expenses').insert([{
        amount: expenseData.amount,
        category: expenseData.category,
        note: expenseData.note,
        user_id: session.user.id,
        created_at: dateToSave,
        recurring_expense_id: recurringId // Links this expense to the template (or null)
      }]).select();

      if (!error) {
        // Add the new expense to the top of the local list
        setExpenses([data[0], ...expenses]);
        setShowForm(false);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Delete a one-off expense entry
  // This only deletes the single expense row, not the recurring template.
  // ---------------------------------------------------------------------------
  const handleDeleteExpense = async (id, e) => {
    // stopPropagation prevents the click from also triggering the row's onClick (edit)
    e.stopPropagation();
    if (!window.confirm(t('actions.cancel') + "?")) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    // Remove the deleted expense from local state so the UI updates immediately
    if (!error) setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  // If there's no session (user not logged in), show the login screen
  if (!session) return <Login />;

  // ---------------------------------------------------------------------------
  // DERIVED DATA
  // These are values calculated from the state — they update automatically
  // whenever the state they depend on changes.
  // ---------------------------------------------------------------------------

  // Only show expenses that belong to the selected month
  const currentMonthData = expenses.filter(exp => exp.created_at.startsWith(selectedMonth));

  const budgetAsNumber = parseFloat(String(monthlyBudget).replace(',', '.')) || 0;
  const totalSpent = currentMonthData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const remaining = parseFloat((budgetAsNumber - totalSpent).toFixed(2));

  // Calculate the previous month string (e.g. "2025-02" if selectedMonth is "2025-03")
  const prevDateObj = new Date(selectedMonth + "-01");
  prevDateObj.setMonth(prevDateObj.getMonth() - 1);
  const prevMonthStr = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthData = expenses.filter(exp => exp.created_at.startsWith(prevMonthStr));

  // ---------------------------------------------------------------------------
  // RENDER
  // Everything below is JSX — a mix of HTML and JavaScript that React renders
  // into the actual page.
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] font-sans antialiased flex flex-col">

      {/* ---- HEADER ---- */}
      <header className="px-6 pt-12 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Avatar circle showing the first letter of the username */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <span className="text-blue-600 font-bold text-sm">{displayName.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-black leading-none">
                {t('dashboard.welcome')} {displayName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">{t('dashboard.mtd')}</p>
                {/* Only show the Admin badge to the admin user */}
                {session.user.email === ADMIN_EMAIL && (
                  <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">Admin</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language toggle button */}
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

        {/* ---- BUDGET INPUT ---- */}
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
                  // When the user leaves the field, format the number to 2 decimal places
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

        {/* ---- MONTH SELECTOR ---- */}
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

        {/* ---- BUDGET CHART ---- */}
        <BudgetChart
          currentMonthExpenses={currentMonthData}
          lastMonthExpenses={lastMonthData}
          totalSpent={totalSpent}
          remaining={remaining}
          budget={budgetAsNumber}
        />

        {/* ---- RECURRING EXPENSES LIST ---- */}
        <RecurringExpenses
          recurringExpenses={recurringExpenses}
          onUpdate={fetchRecurringExpenses}
          selectedMonth={selectedMonth}
        />

        {/* ---- ACTIVITY LIST ---- */}
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
                      {/* Subtle edit icon that only appears on hover */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-400 opacity-0 group-hover/item:opacity-40 transition-opacity"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      {/* Show a recurring badge if this expense came from a template */}
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

      {/* ---- FLOATING ADD BUTTON ---- */}
      {/* fixed + bottom/right positions it over the content, always visible */}
      <button
        onClick={() => { setEditingExpense(null); setShowForm(true); }}
        className="fixed bottom-8 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>

      {/* ---- ADD / EDIT MODAL ---- */}
      {/* The modal is only rendered when showForm is true */}
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