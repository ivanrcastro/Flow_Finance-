import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

const CATEGORY_ICONS = {
  'Bills': '📄', 'Subscriptions': '🔄', 'Entertainment': '🎬',
  'Food & Drink': '🍴', 'Groceries': '🛒', 'Health & Wellbeing': '💊',
  'Shopping': '🛍️', 'Transport': '🚗', 'Travel': '✈️',
  'Business': '💼', 'Gifts': '🎁', 'Other': '🌀'
};

export const RecurringExpenses = ({ recurringExpenses, onUpdate }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(null);

  const handleToggleActive = async (item) => {
    setLoading(item.id);
    const { error } = await supabase
      .from('recurring_expenses')
      .update({ active: !item.active })
      .eq('id', item.id);
    if (!error) onUpdate();
    setLoading(null);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Apagar esta despesa recorrente permanentemente?");
    if (!confirm) return;
    setLoading(id);
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);
    if (!error) onUpdate();
    setLoading(null);
  };

  if (recurringExpenses.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-bold text-gray-400 px-4 uppercase tracking-[0.05em]">🔁 Recorrentes</h3>
      <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-gray-50">
        {recurringExpenses.map((item, idx) => (
          <div
            key={item.id}
            className={`p-4 flex justify-between items-center transition-colors ${idx !== 0 ? 'border-t border-gray-50' : ''} ${!item.active ? 'opacity-40' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{CATEGORY_ICONS[item.category] || '🌀'}</span>
              <div className="flex flex-col">
                <span className="font-bold text-[13px] text-gray-800 tracking-tight leading-none">
                  {t(`categories.${item.category}`)}
                </span>
                {item.note && (
                  <span className="text-[11px] text-gray-400 italic mt-0.5">{item.note}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-[14px] text-black tracking-tight">
                -{parseFloat(item.amount).toFixed(2).replace('.', ',')}€
              </span>

              {/* Toggle ativo/inativo */}
              <button
                onClick={() => handleToggleActive(item)}
                disabled={loading === item.id}
                className={`w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 ${item.active ? 'bg-blue-500' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${item.active ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>

              {/* Apagar */}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={loading === item.id}
                className="text-gray-200 hover:text-red-500 active:opacity-20 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};