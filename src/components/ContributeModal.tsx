import React, { useState } from 'react';
import { X, DollarSign, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal } from '../types/finance.js';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onSubmit: (goalId: string, amount: number) => Promise<void>;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSubmit,
}) => {
  const [amount, setAmount] = useState('100');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !goal) return null;

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleQuickAdd = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive dollar amount');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(goal.id, parsedAmount);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6366F1', '#38BDF8', '#A855F7', '#10B981'],
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deposit savings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0F1424] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Contribute to Goal</span>
            </h2>
            <p className="text-xs text-slate-400">
              {goal.name} · ${remaining.toLocaleString()} remaining to hit target
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
          {/* Quick preset buttons */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Quick Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickAdd(preset)}
                  className={`rounded-lg border py-2 text-xs font-semibold font-mono tabular-nums transition-colors ${
                    amount === preset.toString()
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  +${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Deposit Amount (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="5"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Goal progress after contribution */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Current Progress</span>
              <span className="font-mono text-white">
                ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-indigo-300 font-medium">
              <span>New Projected Total</span>
              <span className="font-mono">
                ${(goal.currentAmount + (parseFloat(amount) || 0)).toLocaleString()}
              </span>
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
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{submitting ? 'Depositing...' : 'Confirm Deposit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
