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
    onAddExpense({ amount: numericAmount, category, note: note.trim(), isRecurring: editingExpense ? false : isRecurring });
    if (!editingExpense) {
      setAmount(''); setCategory(''); setNote(''); setIsRecurring(false);
    }
  };

  return (
    <div className="bg-white h-full w-full flex flex-col p-8 overflow-y-auto animate-slide-up">
      
      {/* Header Minimalista */}
      <div className="flex justify-between items-center mb-12">
        <button type="button" onClick={onClose} className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors">
          {t('actions.cancel')}
        </button>
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
          {editingExpense ? t('actions.editExpense') : t('nav.addExpense')}
        </h3>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-10">
        
        {/* Input de Valor com Linha Subtil */}
        <div className="text-center group">
          <div className="relative inline-block w-full max-w-[240px]">
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 font-black text-2xl transition-colors ${error && !amount ? 'text-red-300' : 'text-slate-300 group-focus-within:text-blue-500'}`}>€</span>
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
              className="text-6xl font-black outline-none bg-transparent text-slate-800 placeholder-slate-100 w-full text-center tracking-tighter border-b-2 border-slate-50 focus:border-blue-500 transition-all pb-2"
              autoFocus
            />
          </div>
          {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em] mt-4 animate-pulse">{error}</p>}
        </div>

        {/* Input de Nota com Linha Subtil */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('expenses.placeholderNote')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-1 py-3 bg-transparent text-sm font-bold outline-none border-b border-slate-100 focus:border-blue-400 transition-all text-slate-600 placeholder-slate-300"
          />
        </div>

        {/* Toggle Recorrente (Mais discreto) */}
        {!editingExpense && (
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className="flex items-center justify-between py-2 group"
          >
            <div className="flex items-center gap-3">
              <span className={`text-lg transition-opacity ${isRecurring ? 'opacity-100' : 'opacity-40'}`}>🔁</span>
              <div className="text-left">
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isRecurring ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                  {t('expenses.recurringTitle')}
                </span>
              </div>
            </div>
            <div className={`w-8 h-4 rounded-full transition-all flex items-center px-0.5 ${isRecurring ? 'bg-blue-500' : 'bg-slate-100'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-all ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        )}

        {/* Grelha de Categorias (4 colunas para evitar scroll) */}
        <div className="flex-grow pt-4">
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 ml-1">{t('dashboard.categories')}</p>
           <div className="grid grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setCategory(cat.id); setError(''); }}
                className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 ${
                  category === cat.id
                    ? 'bg-blue-50 text-blue-600 scale-95 shadow-inner ring-2 ring-blue-100'
                    : 'bg-white text-slate-300 hover:text-slate-500 border border-slate-50'
                }`}
              >
                <span className="text-2xl mb-2">{cat.icon}</span>
                <span className={`text-[7px] font-black uppercase tracking-tighter text-center px-1 leading-tight ${category === cat.id ? 'text-blue-600' : 'text-slate-400'}`}>
                  {t(`categories.${cat.id}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Botão de Guardar Estilo Premium */}
        <button
          type="submit"
          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all mt-auto"
        >
          {editingExpense ? t('actions.update') : t('actions.save')}
        </button>
      </form>
    </div>
  );
};