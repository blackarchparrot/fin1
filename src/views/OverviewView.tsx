import React from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import {
  FinancialSummary,
  Transaction,
  Budget,
  SavingsGoal,
  UpcomingBill,
  MonthlyCashFlowPoint
} from '../types/finance.js';
import { CashFlowChart } from '../components/CashFlowChart.js';
import { NavTab } from '../components/Sidebar.js';

interface OverviewViewProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  upcomingBills: UpcomingBill[];
  cashFlowHistory: MonthlyCashFlowPoint[];
  onNavigateTab: (tab: NavTab) => void;
  onOpenTransactionModal: () => void;
  onOpenContributeModal: (goal: SavingsGoal) => void;
  onPayBill: (billId: string) => Promise<void>;
  onExecutePrompt: (promptText: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  summary,
  transactions,
  budgets,
  savingsGoals,
  upcomingBills,
  cashFlowHistory,
  onNavigateTab,
  onOpenTransactionModal,
  onOpenContributeModal,
  onPayBill,
  onExecutePrompt,
}) => {
  const recentTransactions = transactions.slice(0, 5);
  const pendingBills = upcomingBills.filter(b => b.status === 'upcoming');

  return (
    <div className="space-y-6">
      {/* AI Copilot Quick Prompt Kicker */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500 text-white shadow-xs">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                FinPilot Autonomous Copilot
              </span>
            </div>
            <h2 className="text-base font-bold text-white">
              Ready to handle your personal finances. Try a natural command:
            </h2>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              "Spent $45 at Sweetgreen for lunch",
              "Set Dining budget to $400",
              "Add $200 to Emergency Fund",
              "Pay Verizon fiber bill"
            ].map((p) => (
              <button
                key={p}
                onClick={() => onExecutePrompt(p)}
                className="rounded-lg border border-indigo-500/30 bg-indigo-950/50 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:border-indigo-400 hover:bg-indigo-900/60 shadow-xs"
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Net Liquid Portfolio</span>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            ${summary.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Across 3 linked accounts & liquid reserves
          </p>
        </div>

        {/* Monthly Income */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly Inflow</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            +${summary.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Payroll direct deposit + freelance receipts
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly Outflow</span>
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400 border border-violet-500/20">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            ${summary.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Operating spend & recurring obligations
          </p>
        </div>

        {/* Savings Rate */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Savings Rate</span>
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400 border border-sky-500/20">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-sky-400 font-mono tabular-nums">
              {summary.savingsRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              (${summary.monthlySavings.toLocaleString()} saved)
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, summary.savingsRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Cash Flow Chart */}
      <CashFlowChart data={cashFlowHistory} />

      {/* Split Section: Budget Tracking & Upcoming Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budgets Progress (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Budget Utilization</h3>
              <p className="text-xs text-slate-400">Active category limits for this billing cycle</p>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>Manage Budgets</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {budgets.slice(0, 5).map((b) => {
              const pct = Math.round((b.spent / b.limit) * 100);
              const isOver = pct > 100;
              const isWarning = pct >= 85 && !isOver;

              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: b.color }}
                      />
                      <span className="font-semibold text-slate-200">{b.category}</span>
                      {isOver && (
                        <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Over by ${(b.spent - b.limit).toFixed(0)}</span>
                        </span>
                      )}
                      {isWarning && (
                        <span className="text-[10px] text-amber-400 font-medium">
                          Near limit
                        </span>
                      )}
                    </div>
                    <div className="text-slate-300 font-mono tabular-nums text-xs">
                      <span className={isOver ? 'text-red-400 font-bold' : 'text-white'}>
                        ${b.spent.toLocaleString()}
                      </span>
                      <span className="text-slate-500"> / ${b.limit.toLocaleString()}</span>
                      <span className="text-slate-500 ml-1.5">({pct}%)</span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-red-500'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: !isOver && !isWarning ? b.color : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Bills (1 Col) */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Upcoming Bills</h3>
                <p className="text-xs text-slate-400">{pendingBills.length} payments pending</p>
              </div>
              <button
                onClick={() => onNavigateTab('bills')}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                All Bills
              </button>
            </div>

            <div className="space-y-3">
              {pendingBills.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  All scheduled bills paid!
                </div>
              ) : (
                pendingBills.slice(0, 3).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/50 p-3"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white truncate max-w-[130px]">
                        {bill.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span>Due {bill.dueDate.split('-').slice(1).join('/')}</span>
                        {bill.isAutoPay && (
                          <span className="text-[10px] text-indigo-400">AutoPay</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-white font-mono tabular-nums">
                        ${bill.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onPayBill(bill.id)}
                        className="rounded-md bg-indigo-600/20 border border-indigo-500/30 px-2 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        Pay
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Checking balance covers all pending bills</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Savings Goals Preview Grid */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Savings Goals Accelerators</h3>
            <p className="text-xs text-slate-400">Target funds monitored and optimized by FinPilot AI</p>
          </div>
          <button
            onClick={() => onNavigateTab('savings')}
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            <span>View All Goals</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {savingsGoals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            return (
              <div
                key={goal.id}
                className="group relative rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {goal.category}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-0.5 truncate max-w-[160px]">
                      {goal.name}
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo-300">
                    {pct}%
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between text-xs">
                  <span className="font-mono font-bold text-white tabular-nums">
                    ${goal.currentAmount.toLocaleString()}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    of ${goal.targetAmount.toLocaleString()}
                  </span>
                </div>

                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: goal.color || '#6366F1',
                    }}
                  />
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Target: {goal.deadline.split('-')[0]}
                  </span>
                  <button
                    onClick={() => onOpenContributeModal(goal)}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    + Deposit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Latest activity posted to your accounts</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenTransactionModal}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              + Add Transaction
            </button>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              <span>Full Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-2.5 font-medium">Merchant & Description</th>
                <th className="pb-2.5 font-medium">Category</th>
                <th className="pb-2.5 font-medium">Account</th>
                <th className="pb-2.5 font-medium">Date</th>
                <th className="pb-2.5 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-slate-800/80 p-1.5 text-slate-300">
                        <CreditCard className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{tx.description}</p>
                        {tx.source === 'ai_agent' && (
                          <span className="text-[10px] text-indigo-400 font-medium">
                            Auto-logged by Copilot
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-slate-300">{tx.category}</td>
                  <td className="py-3 text-slate-400">{tx.account}</td>
                  <td className="py-3 text-slate-400 font-mono text-[11px]">{tx.date}</td>
                  <td className="py-3 text-right font-mono tabular-nums font-semibold">
                    <span
                      className={
                        tx.type === 'income'
                          ? 'text-emerald-400'
                          : tx.type === 'transfer'
                          ? 'text-indigo-400'
                          : 'text-slate-100'
                      }
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '↔' : '-'}
                      ${tx.amount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
