import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { id: 'Bills', icon: '📄' },
  { id: 'Subscriptions', icon: '🔄' },
  { id: 'Entertainment', icon: '🎬' },
  { id: 'Food & Drink', icon: '🍴' },
  { id: 'Groceries', icon: '🛒' },
  { id: 'Health & Wellbeing', icon: '💊' },
  { id: 'Shopping', icon: '🛍️' },
  { id: 'Transport', icon: '🚗' },
  { id: 'Travel', icon: '✈️' },
  { id: 'Business', icon: '💼' },
  { id: 'Gifts', icon: '🎁' },
  { id: 'Other', icon: '🌀' }
];

export const AddExpense = ({ onAddExpense, onClose, editingExpense }) => {
  const { t } = useTranslation();
  
  const [amount, setAmount] = useState(editingExpense ? editingExpense.amount.toString().replace('.', ',') : '');
  const [category, setCategory] = useState(editingExpense ? editingExpense.category : '');
  const [note, setNote] = useState(editingExpense ? editingExpense.note : '');
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!amount || amount === '0' || amount === '0,00') {
      setError(t('errors.invalidAmount'));
      return;
    }
    if (!category) {
      setError(t('errors.selectCategory'));
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    onAddExpense({ 
      amount: numericAmount, 
      category, 
      note: note.trim(), 
      isRecurring: editingExpense ? false : isRecurring 
    });
  };

  return (
    <div className="bg-white p-6 rounded-t-[40px] shadow-2xl border-t border-slate-100 relative animate-slide-up max-h-[90vh] overflow-y-auto">
      {/* Botão de fechar original */}
      <button 
        type="button"
        onClick={onClose} 
        className="absolute top-4 right-6 text-slate-300 hover:text-slate-600 text-2xl font-bold p-2 transition-colors"
      >
        ×
      </button>

      <div className="mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">
          {editingExpense ? t('actions.editExpense') : t('nav.addExpense')}
        </h3>
        {error && (
          <p className="text-[9px] text-red-500 font-bold text-center uppercase tracking-wider mt-2 animate-pulse">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Input de Valor com a linha subtil que preferes */}
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">€</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => {
              setError('');
              const val = e.target.value;
              if (/^[0-9]*[.,]?[0-9]*$/.test(val)) setAmount(val);
            }}
            className="w-full pl-10 pr-4 py-4 bg-transparent text-4xl font-black outline-none border-b-2 border-slate-50 focus:border-blue-500 transition-all text-slate-800 text-center"
            autoFocus
          />
        </div>

        {/* Nota com linha subtil */}
        <input
          type="text"
          placeholder={t('expenses.placeholderNote')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-2 py-3 bg-transparent text-sm font-semibold outline-none border-b border-slate-50 focus:border-blue-200 transition-all text-slate-600"
        />

        {/* Toggle Recorrente compacto */}
        {!editingExpense && (
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
              isRecurring ? 'border-blue-100 bg-blue-50/30' : 'border-slate-50 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm">🔁</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isRecurring ? 'text-blue-600' : 'text-slate-400'}`}>
                {t('expenses.recurringTitle')}
              </span>
            </div>
            <div className={`w-8 h-4 rounded-full transition-all flex items-center px-0.5 ${isRecurring ? 'bg-blue-500' : 'bg-slate-200'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow transition-all ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        )}

        {/* Grelha de Categorias - 4 Colunas (Mais pequenas) */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setCategory(cat.id); setError(''); }}
              className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${
                category === cat.id
                  ? 'border-blue-500 bg-blue-50 text-blue-600 scale-95 shadow-inner'
                  : 'border-transparent bg-slate-50 text-slate-400'
              }`}
            >
              <span className="text-lg mb-1">{cat.icon}</span>
              <span className="text-[7px] font-black uppercase tracking-tighter text-center leading-none px-0.5">
                {t(`categories.${cat.id}`)}
              </span>
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-xs"
        >
          {editingExpense ? t('actions.update') : t('actions.save')}
        </button>
      </form>
    </div>
  );
};