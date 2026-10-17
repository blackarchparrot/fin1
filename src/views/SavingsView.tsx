import React from 'react';
import {
  Target,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trash2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { SavingsGoal } from '../types/finance.js';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  onOpenCreateGoal: () => void;
  onOpenContributeModal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  savingsGoals,
  onOpenCreateGoal,
  onOpenContributeModal,
  onDeleteGoal,
}) => {
  const totalTarget = savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalCurrent = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Savings Goals & Dedicated Funds</h2>
          <p className="text-xs text-slate-400">
            Automated milestone tracking and proactive sweep strategies
          </p>
        </div>

        <button
          onClick={onOpenCreateGoal}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Total Accumulated Savings</span>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalCurrent.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Reserved across dedicated accounts</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Aggregate Target Milestone</span>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalTarget.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            ${Math.max(0, totalTarget - totalCurrent).toLocaleString()} to reach all goals
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Overall Progress</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-sky-400 font-mono tabular-nums">
              {overallPct}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Completed</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {savingsGoals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const isComplete = goal.currentAmount >= goal.targetAmount;

          return (
            <div
              key={goal.id}
              className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs transition-all hover:border-slate-700 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {goal.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{goal.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-indigo-300">
                    {pct}%
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete savings goal "${goal.name}"?`)) {
                        onDeleteGoal(goal.id);
                      }
                    }}
                    title="Delete Goal"
                    className="rounded p-1 text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Amounts */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-mono font-bold text-lg text-white tabular-nums">
                    ${goal.currentAmount.toLocaleString()}
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    Target: ${goal.targetAmount.toLocaleString()}
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: goal.color || '#6366F1',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>Target Date: {goal.deadline}</span>
                  </span>
                  <span>${remaining.toLocaleString()} left</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                {isComplete ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Goal Reached!</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    FinPilot recommended: $
                    {Math.round(remaining / 6).toLocaleString()}
                    /mo
                  </div>
                )}

                <button
                  onClick={() => onOpenContributeModal(goal)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all shadow-xs"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Deposit Funds</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
