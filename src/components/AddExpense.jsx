import { useState } from 'react';

const CATEGORIES = [
  { id: 'Bills', label: 'Bills', icon: '📄' },
  { id: 'Subscriptions', label: 'Subscriptions', icon: '🔄' },
  { id: 'Entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'Food & Drink', label: 'Food & Drink', icon: '🍴' },
  { id: 'Groceries', label: 'Groceries', icon: '🛒' },
  { id: 'Health & Wellbeing', label: 'Health & Wellbeing', icon: '💊' },
  { id: 'Shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'Transport', label: 'Transport', icon: '🚗' },
  { id: 'Travel', label: 'Travel', icon: '✈️' },
  { id: 'Business', label: 'Business', icon: '💼' },
  { id: 'Gifts', label: 'Gifts', icon: '🎁' },
  { id: 'Other', label: 'Other', icon: '🌀' }
];

export const AddExpense = ({ onAddExpense, onClose }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!amount || !category) {
      return alert("Por favor, preenche o valor e escolhe uma categoria!");
    }

    // Criar o objeto da despesa
    const newExpense = {
      amount: parseFloat(amount),
      category: category,
    };

    onAddExpense(newExpense);
    
    // Limpar o formulário
    setAmount('');
    setCategory('');
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
          Registar Gasto
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input de Valor */}
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">€</span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-12 pr-6 py-5 bg-slate-50 rounded-2xl text-3xl font-black outline-none border-2 border-transparent focus:border-primary focus:bg-white transition-all text-slate-800"
            autoFocus
          />
        </div>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                category === cat.id 
                  ? 'border-primary bg-primary/5 text-primary scale-95 shadow-inner font-bold' 
                  : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
              }`}
            >
              <span className="text-xl mb-1">{cat.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Botão de Confirmação */}
        <button 
          type="submit" 
          className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90"
        >
          Confirmar Gasto
        </button>
      </form>
    </div>
  );
};