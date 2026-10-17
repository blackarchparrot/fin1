import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, Palette } from 'lucide-react';
import { Budget, TransactionCategory } from '../types/finance.js';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (budgetData: {
    category: TransactionCategory;
    limit: number;
    color: string;
  }) => Promise<void>;
  existingBudget?: Budget | null;
  existingCategories: TransactionCategory[];
}

const CATEGORIES: TransactionCategory[] = [
  'Dining',
  'Groceries',
  'Housing',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Subscriptions',
  'Other',
];

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#38BDF8', // Sky
  '#A855F7', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingBudget,
}) => {
  const [category, setCategory] = useState<TransactionCategory>('Dining');
  const [limit, setLimit] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingBudget) {
      setCategory(existingBudget.category);
      setLimit(existingBudget.limit.toString());
      setColor(existingBudget.color || PRESET_COLORS[0]);
    } else {
      setCategory('Dining');
      setLimit('500');
      setColor(PRESET_COLORS[0]);
    }
    setError(null);
  }, [existingBudget, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Please specify a positive monthly budget limit');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        category,
        limit: parsedLimit,
        color,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0F1424] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-white">
              {existingBudget ? `Adjust ${existingBudget.category} Budget` : 'Set Category Budget'}
            </h2>
            <p className="text-xs text-slate-400">
              Establish spending limits to receive autonomous alerts
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-950/40 border border-red-800/50 p-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <select
                value={category}
                disabled={!!existingBudget}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-white focus:border-indigo-500 focus:outline-hidden disabled:opacity-75"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Monthly Limit (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="10"
                required
                placeholder="400"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            {existingBudget && (
              <p className="mt-1 text-[11px] text-slate-500">
                Current month spend in this category: ${existingBudget.spent.toLocaleString()}
              </p>
            )}
          </div>

          {/* Color accent selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              <span>Accent Color</span>
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0F1424]' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : existingBudget ? 'Update Limit' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
