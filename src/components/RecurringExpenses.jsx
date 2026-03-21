import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// CATEGORY ICONS MAP
// A plain object that maps each category name to its emoji icon.
// We use it to display the right icon next to each recurring expense.
// ---------------------------------------------------------------------------
const CATEGORY_ICONS = {
  'Bills': '📄', 'Subscriptions': '🔄', 'Entertainment': '🎬',
  'Food & Drink': '🍴', 'Groceries': '🛒', 'Health & Wellbeing': '💊',
  'Shopping': '🛍️', 'Transport': '🚗', 'Travel': '✈️',
  'Business': '💼', 'Gifts': '🎁', 'Other': '🌀'
};

// ---------------------------------------------------------------------------
// RECURRINGEXPENSES COMPONENT
//
// This component shows the list of recurring expense templates.
// It lets the user:
//   - Toggle a recurring expense on/off (active/inactive)
//   - Delete a recurring expense — but only going forward from the selected month
//
// Props:
//   - recurringExpenses: the array of recurring templates loaded from the database
//   - onUpdate: a function to call after any change, to refresh the list
//   - selectedMonth: the currently viewed month in "YYYY-MM" format (e.g. "2025-03")
// ---------------------------------------------------------------------------
export const RecurringExpenses = ({ recurringExpenses, onUpdate, selectedMonth }) => {
  const { t } = useTranslation();

  // loading stores the ID of the item currently being processed (to show a
  // disabled state on that specific row while the database call is in progress).
  // null means nothing is loading.
  const [loading, setLoading] = useState(null);

  // ---------------------------------------------------------------------------
  // HANDLER: Toggle a recurring expense between active and inactive
  //
  // When inactive, the expense won't be injected into future months.
  // We flip the current value using !item.active.
  // ---------------------------------------------------------------------------
  const handleToggleActive = async (item) => {
    setLoading(item.id); // Mark this item as loading

    const { error } = await supabase
      .from('recurring_expenses')
      .update({ active: !item.active }) // Flip the active flag
      .eq('id', item.id);               // Only update this specific row

    if (!error) onUpdate(); // Tell the parent to refresh the list
    setLoading(null);       // Clear the loading state
  };

  // ---------------------------------------------------------------------------
  // HANDLER: "Delete" a recurring expense — the right way
  //
  // THE OLD PROBLEM:
  // Before, deleting a recurring expense removed it entirely from the database.
  // This caused two issues:
  //   1. The injected expenses in past months lost their link (orphaned rows)
  //   2. Navigating back to a past month would re-inject the expense, or show
  //      broken data
  //
  // THE FIX — Soft Delete with end_month:
  // Instead of deleting the row, we set an end_month on it.
  // The injection system (in Home.jsx) checks end_month before injecting,
  // so the expense stops appearing in future months — but past months are
  // left untouched. The data stays clean and consistent.
  //
  // We use the selectedMonth passed from the parent so the "end" is relative
  // to where the user is in the calendar, not just today's date.
  // ---------------------------------------------------------------------------
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Stop this recurring expense from this month onwards?");
    if (!confirmed) return;

    setLoading(id);

    // Set end_month to the currently selected month.
    // The injection filter in Home.jsx uses: end_month < selectedMonth
    // So setting end_month = selectedMonth means it stops injecting from this
    // month forward, but all previous months are unchanged.
    const { error } = await supabase
      .from('recurring_expenses')
      .update({
        end_month: selectedMonth, // Stop injecting from this month onwards
        active: false             // Also mark as inactive so the toggle reflects this
      })
      .eq('id', id);

    if (!error) onUpdate(); // Refresh the list in the parent
    setLoading(null);
  };

  // ---------------------------------------------------------------------------
  // FILTER: Only show recurring expenses that are relevant for the selected month
  //
  // A recurring expense should appear in the list for a given month if:
  //   1. It started on or before that month (start_month <= selectedMonth)
  //   2. It hasn't been ended before that month (no end_month, or end_month >= selectedMonth)
  //
  // This mirrors the same logic used in injectRecurringForMonth() in Home.jsx,
  // so the visual list always matches what actually gets injected.
  // ---------------------------------------------------------------------------
  const visibleRecurring = recurringExpenses.filter(r => {
    const hasNotStartedYet = r.start_month > selectedMonth;
    const hasAlreadyEnded = r.end_month && r.end_month < selectedMonth;
    return !hasNotStartedYet && !hasAlreadyEnded;
  });

  // If there are no recurring expenses visible for this month, render nothing
  if (visibleRecurring.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Section header */}
      <h3 className="text-[11px] font-bold text-gray-400 px-4 uppercase tracking-[0.05em]">🔁 Recorrentes</h3>

      <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-gray-50">
        {/* Loop through only the recurring expenses visible for this month */}
        {visibleRecurring.map((item, idx) => (
          <div
            key={item.id} // React needs a unique key when rendering lists
            className={`p-4 flex justify-between items-center transition-colors
              ${idx !== 0 ? 'border-t border-gray-50' : ''}
              ${!item.active ? 'opacity-40' : ''}`}
            // When inactive, we reduce opacity so it looks "greyed out"
          >

            {/* LEFT SIDE: icon, category name, and optional note */}
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {/* Fall back to 🌀 if the category isn't in our map */}
                {CATEGORY_ICONS[item.category] || '🌀'}
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-[13px] text-gray-800 tracking-tight leading-none">
                  {t(`categories.${item.category}`)}
                </span>
                {/* Only show the note if there is one */}
                {item.note && (
                  <span className="text-[11px] text-gray-400 italic mt-0.5">{item.note}</span>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: amount, active toggle, delete button */}
            <div className="flex items-center gap-3">
              <span className="font-bold text-[14px] text-black tracking-tight">
                -{parseFloat(item.amount).toFixed(2).replace('.', ',')}€
              </span>

              {/* Active/inactive toggle switch */}
              <button
                onClick={() => handleToggleActive(item)}
                disabled={loading === item.id} // Disable while this row is loading
                className={`w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5
                  ${item.active ? 'bg-blue-500' : 'bg-slate-200'}`}
              >
                {/* The white circle slides right when active, left when inactive */}
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all duration-300
                  ${item.active ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>

              {/* Delete (soft) button */}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={loading === item.id} // Disable while this row is loading
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