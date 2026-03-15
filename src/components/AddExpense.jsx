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

export const AddExpense = ({ onAddExpense, onClose }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState(''); // Estado para a nota

  // BLOQUEAR SCROLL DA HOME
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!amount || !category) {
      return alert(t('actions.fillAll') || "Please fill all fields!");
    }

    // Convertemos para número antes de enviar, garantindo que o ponto decimal é usado
    const numericAmount = parseFloat(amount.replace(',', '.'));

    onAddExpense({
      amount: numericAmount, 
      category, 
      note: note.trim() // Remove espaços desnecessários
    });

    setAmount('');
    setCategory('');
    setNote('');
  };

  return (
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl border-t border-slate-100 relative animate-slide-up">
      {/* Botão de Fechar */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-6 text-slate-300 hover:text-slate-600 text-2xl font-bold p-2 transition-colors"
      >
        ×
      </button>

      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 text-center">
          {t('nav.addExpense')}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input de Valor */}
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">€</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(',', '.');
              if (/^\d*\.?\d*$/.test(val)) {
                // Mantemos o valor original (com vírgula se o user preferir) no ecrã
                setAmount(e.target.value); 
              }
            }}
            className="w-full pl-12 pr-6 py-5 bg-slate-50 rounded-2xl text-3xl font-black outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all text-slate-800"
            autoFocus
          />
        </div>

        {/* Campo de Nota (Opcional) - Integrado aqui */}
        <div className="relative">
           <input
            type="text"
            placeholder={t('auth.placeholderNote') || "Nota (ex: Jantar com amigos)"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-5 py-3 bg-slate-50 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-blue-200 focus:bg-white transition-all text-slate-600"
          />
        </div>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
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

        {/* Botão de Confirmação */}
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
        >
          {t('actions.save')}
        </button>
      </form>
    </div>
  );
};