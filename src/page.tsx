'use client'
import { useState, useEffect } from 'react'
import BudgetChart from '@/components/BudgetChart'
import AddExpense from '@/components/AddExpense'

const BUDGET = 1200

export default function Home() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0)
  const remaining = BUDGET - totalSpent
  const progress = (totalSpent / BUDGET) * 100

  const chartData = Object.entries(
    expenses.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return (
    <main className="max-w-md mx-auto min-h-screen p-6 pb-32">
      <header className="mb-8">
        <h1 className="text-gray-400 text-xs font-bold uppercase tracking-tighter">Saldo Disponível</h1>
        <p className={`text-4xl font-black ${remaining < 100 ? 'text-red-500' : 'text-gray-900'}`}>
          {remaining.toFixed(2)}€
        </p>
        
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </header>

      <BudgetChart data={chartData} />

      <section className="space-y-4">
        <h3 className="font-bold text-gray-800">Últimos Gastos</h3>
        {expenses.map((exp) => (
          <div key={exp.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
            <div>
              <p className="font-bold capitalize text-gray-700">{exp.category}</p>
              <p className="text-[10px] text-gray-400">{new Date(exp.created_at).toLocaleDateString()}</p>
            </div>
            <span className="font-black text-red-500">-{exp.amount.toFixed(2)}€</span>
          </div>
        ))}
      </section>

      <button 
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-1/2 translate-x-1/2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
      >
        <span className="text-xl">+</span> Adicionar
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom duration-300">
            <AddExpense 
              onAdd={(newExp) => setExpenses([newExp, ...expenses])} 
              onComplete={() => setShowForm(false)} 
            />
          </div>
        </div>
      )}
    </main>
  )
}