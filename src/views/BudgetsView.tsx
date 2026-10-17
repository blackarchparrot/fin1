import React from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Trash2,
  Edit2
} from 'lucide-react';
import { Budget, TransactionCategory } from '../types/finance.js';

interface BudgetsViewProps {
  budgets: Budget[];
  onOpenCreateBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => Promise<void>;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  onOpenCreateBudget,
  onEditBudget,
  onDeleteBudget,
}) => {
  const totalBudgeted = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const remaining = Math.max(0, totalBudgeted - totalSpent);
  const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Budgets & Category Spending Limits</h2>
          <p className="text-xs text-slate-400">
            Real-time limits monitored by FinPilot AI with automatic over-utilization alarms
          </p>
        </div>

        <button
          onClick={onOpenCreateBudget}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Budget Limit</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Total Budgeted</span>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalBudgeted.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Across {budgets.length} spending categories</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Current Spend</span>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {Math.round((totalSpent / (totalBudgeted || 1)) * 100)}% overall utilization
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Remaining Cushion</span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Available before limits are reached</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Status & Alerts</span>
          <div className="mt-1 flex items-center gap-2">
            {overBudgetCount > 0 ? (
              <>
                <span className="text-2xl font-extrabold text-red-400 font-mono">
                  {overBudgetCount}
                </span>
                <span className="text-xs text-red-400 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Category Over Limit</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  0
                </span>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  <span>All Within Budget</span>
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Auto-adjusted as transactions occur</p>
        </div>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const pct = Math.round((b.spent / b.limit) * 100);
          const isOver = pct > 100;
          const isWarning = pct >= 85 && !isOver;
          const leftToSpend = Math.max(0, b.limit - b.spent);

          return (
            <div
              key={b.id}
              className={`rounded-xl border bg-[#0E1424] p-5 shadow-xs transition-all ${
                isOver
                  ? 'border-red-800/60 bg-red-950/10'
                  : isWarning
                  ? 'border-amber-800/60 bg-amber-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: b.color || '#6366F1' }}
                  />
                  <div>
                    <h3 className="font-bold text-sm text-white">{b.category}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Monthly Limit
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditBudget(b)}
                    title="Adjust Limit"
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${b.category} budget?`)) {
                        onDeleteBudget(b.id);
                      }
                    }}
                    title="Delete Budget"
                    className="rounded p-1 text-slate-400 hover:bg-red-900/30 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress and Numbers */}
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Spent: </span>
                    <span className="font-mono text-base font-bold text-white tabular-nums">
                      ${b.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Limit: </span>
                    <span className="font-mono text-sm text-slate-300 tabular-nums">
                      ${b.limit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-indigo-500'
                    }`}
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: !isOver && !isWarning ? b.color : undefined,
                    }}
                  />
                </div>

                {/* Status text */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-mono font-semibold text-slate-300">
                    {pct}% utilized
                  </span>
                  {isOver ? (
                    <span className="text-red-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Over by ${(b.spent - b.limit).toFixed(2)}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      ${leftToSpend.toFixed(2)} remaining
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
