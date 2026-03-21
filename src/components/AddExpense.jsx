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

    if (!editingExpense) {
      setAmount(''); setCategory(''); setNote(''); setIsRecurring(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl border-t border-slate-100 relative animate-slide-up">
      <button 
        type="button"
        onClick={onClose} 
        className="absolute top-4 right-6 text-slate-300 hover:text-slate-600 text-2xl font-bold p-2 transition-colors"
      >
        ×
      </button>

      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 text-center">
          {editingExpense ? t('actions.editExpense') : t('nav.addExpense')}
        </h3>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 animate-pulse">
            <p className="text-[11px] text-red-500 font-bold text-center uppercase tracking-wider">
              ⚠️ {error}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">€</span>
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
            className={`w-full pl-12 pr-6 py-5 bg-slate-50 rounded-2xl text-3xl font-black outline-none border-2 transition-all text-slate-800 ${error && !amount ? 'border-red-200 bg-red-50/30' : 'border-transparent focus:border-blue-500 focus:bg-white'}`}
            autoFocus
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={t('expenses.placeholderNote')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-5 py-3 bg-slate-50 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-blue-200 focus:bg-white transition-all text-slate-600"
          />
        </div>

        {!editingExpense && (
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 ${
              isRecurring ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔁</span>
              <div className="text-left">
                <p className={`text-xs font-black uppercase tracking-wider ${isRecurring ? 'text-blue-600' : 'text-slate-400'}`}>
                  {t('expenses.recurringTitle')}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">{t('expenses.recurringSubtitle')}</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${isRecurring ? 'bg-blue-500' : 'bg-slate-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        )}

        <div className={`grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar p-1 rounded-2xl transition-all ${error && !category ? 'bg-red-50/50 ring-1 ring-red-100' : ''}`}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                setError('');
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                category === cat.id
                  ? 'border-blue-500 bg-blue-50 text-blue-600 scale-95 shadow-inner font-bold'
                  : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
              }`}
            >
              <span className="text-xl mb-1">{cat.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">
                {t(`categories.${cat.id}`)}
              </span>
            </button>
          ))}
        </div>

        <button
          type="submit"
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all ${
            error 
            ? 'bg-slate-400 text-white cursor-not-allowed' 
            : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
          }`}
        >
          {editingExpense ? t('actions.update') : t('actions.save')}
        </button>
      </form>
    </div>
  );
};