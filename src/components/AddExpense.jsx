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
    // Previne scroll no fundo mas permite dentro do modal se necessário
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount === '0' || amount === '0,00') return setError(t('errors.invalidAmount'));
    if (!category) return setError(t('errors.selectCategory'));

    const numericAmount = parseFloat(amount.replace(',', '.'));
    onAddExpense({ amount: numericAmount, category, note: note.trim(), isRecurring: editingExpense ? false : isRecurring });
  };

  return (
    // Mudança para min-h-screen e flex-col para garantir que cabe em ecrãs pequenos
    <div className="bg-white min-h-[100dvh] w-full flex flex-col p-5 overflow-y-auto animate-slide-up">
      
      {/* Header mais compacto */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <button type="button" onClick={onClose} className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          {t('actions.cancel')}
        </button>
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
          {editingExpense ? t('actions.editExpense') : t('nav.addExpense')}
        </h3>
        <div className="w-8"></div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-grow justify-between gap-4">
        
        {/* Secção de Valor (Reduzida para caber com teclado) */}
        <div className="text-center py-2">
          <div className="relative inline-block w-full max-w-[200px]">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-xl text-slate-300">€</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => { setError(''); setAmount(e.target.value.replace('.', ',')); }}
              className="text-5xl font-black outline-none bg-transparent text-slate-800 w-full text-center tracking-tighter border-b border-slate-100 focus:border-blue-500 transition-all pb-1"
              autoFocus
            />
          </div>
          {error && <p className="text-[9px] text-red-500 font-bold uppercase mt-2 tracking-tighter">{error}</p>}
        </div>

        {/* Nota Compacta */}
        <input
          type="text"
          placeholder={t('expenses.placeholderNote')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-1 py-2 bg-transparent text-xs font-bold outline-none border-b border-slate-50 focus:border-blue-300 transition-all text-slate-600"
        />

        {/* Categorias - Mais pequenas e sem margens gigantes */}
        <div className="flex-grow flex flex-col justify-center">
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setCategory(cat.id); setError(''); }}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
                  category === cat.id
                    ? 'bg-blue-600 text-white scale-95 shadow-lg shadow-blue-200'
                    : 'bg-slate-50 text-slate-400 border border-transparent'
                }`}
              >
                <span className="text-lg mb-0.5">{cat.icon}</span>
                <span className="text-[6px] font-black uppercase tracking-tighter text-center leading-none px-0.5">
                  {t(`categories.${cat.id}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Recorrente Minimalista */}
        {!editingExpense && (
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className="flex items-center justify-between py-1 px-1"
          >
            <span className={`text-[9px] font-black uppercase tracking-widest ${isRecurring ? 'text-blue-600' : 'text-slate-300'}`}>
              {t('expenses.recurringTitle')}
            </span>
            <div className={`w-7 h-3.5 rounded-full flex items-center px-0.5 transition-all ${isRecurring ? 'bg-blue-500' : 'bg-slate-200'}`}>
              <div className={`w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-all ${isRecurring ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </div>
          </button>
        )}

        {/* Botão Final - Sempre visível */}
        <button
          type="submit"
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-all mt-2 shadow-lg"
        >
          {editingExpense ? t('actions.update') : t('actions.save')}
        </button>
      </form>
    </div>
  );
};