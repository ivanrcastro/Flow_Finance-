import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function BudgetChart({ currentMonthExpenses, lastMonthExpenses, totalSpent, remaining, budget }) {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const CATEGORIES = [
    "Bills", "Subscriptions", "Entertainment", "Food & Drink", "Groceries", 
    "Health & Wellbeing", "Other", "Shopping", "Transport", "Travel", "Business", "Gifts"
  ];

  const categoryTotals = CATEGORIES.map(cat => {
    const value = currentMonthExpenses
      .filter(e => e.category === cat)
      .reduce((a, b) => a + parseFloat(b.amount), 0);
    return { 
      id: cat, 
      name: t(`categories.${cat}`), 
      value 
    };
  }).filter(item => item.value > 0);

  const COLORS = ['#007AFF', '#5856D6', '#FF2D55', '#AF52DE', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#8E8E93', '#1C1C1E', '#6366f1'];

  const today = new Date().getDate();
  const spentUntilTodayLastMonth = lastMonthExpenses
    .filter(e => new Date(e.created_at).getDate() <= today)
    .reduce((a, b) => a + parseFloat(b.amount), 0);

  const diffUntilToday = totalSpent - spentUntilTodayLastMonth;
  const isSaving = diffUntilToday <= 0;

  const stats = categoryTotals.map(item => {
    const prevTotal = lastMonthExpenses
      .filter(e => e.category === item.id)
      .reduce((a, b) => a + parseFloat(b.amount), 0);
    const diff = prevTotal === 0 ? 0 : ((item.value - prevTotal) / prevTotal) * 100;
    return { 
      id: item.id,
      name: item.name, 
      diff, 
      isHigher: item.value > prevTotal, 
      current: item.value 
    };
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative">
        <div style={{ width: '100%', height: 224, minHeight: 224, position: 'relative' }}>
          
          {isMounted ? (
            <ResponsiveContainer width="100%" height={224}>
              <PieChart>
                <Pie
                  data={categoryTotals.length > 0 ? categoryTotals : [{ name: t('dashboard.no_data'), value: 1 }]}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {categoryTotals.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                  ))}
                  {categoryTotals.length === 0 && <Cell fill="#f1f5f9" />}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-50 border-t-blue-500 animate-spin" />
            </div>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              {t('dashboard.total_spent')}
            </span>
            <span className="text-4xl font-black text-slate-800">
              {totalSpent.toFixed(0)}€
            </span>
            <span className="text-[10px] font-bold text-blue-600 mt-1 px-3 py-0.5 bg-blue-50 rounded-full">
              {t('dashboard.budget')}: {budget}€
            </span>
          </div>
        </div>

        <div className={`mt-6 p-4 rounded-2xl flex items-center justify-between border transition-all ${isSaving ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
              {t('dashboard.vs_last_month')}
            </p>
            <p className={`text-sm font-bold ${isSaving ? 'text-green-600' : 'text-red-600'}`}>
              {isSaving 
                ? `${t('dashboard.saved')} ${Math.abs(diffUntilToday).toFixed(0)}€` 
                : `${t('dashboard.spent')} +${diffUntilToday.toFixed(0)}€`}
            </p>
          </div>
          <span className="text-xl">{isSaving ? '📉' : '📈'}</span>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <span>{t('dashboard.budget_progress')}</span>
            <span className={remaining < 0 ? 'text-red-500 font-black' : 'text-blue-600'}>
              {remaining < 0 
                ? `${t('dashboard.exceeded')} ${Math.abs(remaining).toFixed(0)}€` 
                : `${remaining.toFixed(0)}€ ${t('dashboard.left')}`}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${remaining < 0 ? 'bg-red-500' : 'bg-blue-600'}`} 
              style={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex flex-col justify-between min-h-[80px]">
            <p className="text-[9px] uppercase font-black text-slate-400 truncate">{s.name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold text-slate-700">{s.current.toFixed(0)}€</span>
              <span className={`text-[10px] font-black ${s.isHigher ? 'text-red-500' : 'text-green-500'}`}>
                {s.isHigher ? '↑' : '↓'} {Math.abs(s.diff).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}