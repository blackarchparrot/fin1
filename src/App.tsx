/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { OverviewView } from './views/OverviewView.js';
import { TransactionsView } from './views/TransactionsView.js';
import { BudgetsView } from './views/BudgetsView.js';
import { SavingsView } from './views/SavingsView.js';
import { BillsView } from './views/BillsView.js';
import { AgentView } from './views/AgentView.js';
import { WorkflowView } from './views/WorkflowView.js';
import { TransactionModal } from './components/TransactionModal.js';
import { BudgetModal } from './components/BudgetModal.js';
import { SavingsGoalModal } from './components/SavingsGoalModal.js';
import { ContributeModal } from './components/ContributeModal.js';
import { OnboardingModal } from './components/OnboardingModal.js';
import { safeFetchJson } from './utils/apiSafe.js';
import {
  FinanceDataState,
  Transaction,
  Budget,
  SavingsGoal,
  TransactionCategory,
  TransactionType,
  AIProviderStatus,
  PendingProposal,
  ToolCallTrace,
} from './types/finance.js';

export default function App() {
  const [financeState, setFinanceState] = useState<FinanceDataState | null>(null);
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus | null>(null);
  const [currency, setCurrency] = useState('৳');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('workflow');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const [isSavingsGoalModalOpen, setIsSavingsGoalModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [goalToContribute, setGoalToContribute] = useState<SavingsGoal | null>(null);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch full finances state and provider status
  const fetchState = async (isManual = false) => {
    try {
      setLoading(true);
      const finResult = await safeFetchJson<FinanceDataState>('/api/finances');

      if (!finResult.ok || !finResult.data) {
        throw new Error(finResult.error || 'FinPilot backend service warming up. Reconnecting...');
      }

      setFinanceState(finResult.data);

      const provResult = await safeFetchJson<AIProviderStatus>('/api/ai/provider-status').catch(() => null);
      if (provResult && provResult.ok && provResult.data) {
        setProviderStatus(provResult.data);
      }

      setError(null);
      setRetryCount(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown connection error';
      setError(msg);

      // Auto-retry reconnection every 1.8 seconds up to 8 attempts
      setRetryCount((prev) => {
        const next = isManual ? 1 : prev + 1;
        if (next <= 8) {
          setTimeout(() => {
            fetchState();
          }, 1800);
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Floating Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // Handlers
  const handleResetData = async () => {
    try {
      const res = await safeFetchJson<{ state: FinanceDataState }>('/api/finances/reset', { method: 'POST' });
      if (!res.ok || !res.data) throw new Error(res.error || 'Failed to reset demo data');
      setFinanceState(res.data.state);
      showToast('success', 'Financial ledger reset to initial demo state.');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to reset demo data');
    }
  };

  const handleSaveTransaction = async (txData: {
    description: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    account: string;
    date: string;
  }) => {
    const url = transactionToEdit ? `/api/transactions/${transactionToEdit.id}` : '/api/transactions';
    const method = transactionToEdit ? 'PUT' : 'POST';
    const res = await safeFetchJson<{ state: FinanceDataState }>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to save transaction');
    setFinanceState(res.data.state);
  };

  const handleDeleteTransaction = async (id: string) => {
    const res = await safeFetchJson<{ state: FinanceDataState }>(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to delete transaction');
    setFinanceState(res.data.state);
  };

  const handleSaveBudget = async (budgetData: {
    category: TransactionCategory;
    limit: number;
    color: string;
  }) => {
    const res = await safeFetchJson<{ state: FinanceDataState }>('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budgetData),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to save budget');
    setFinanceState(res.data.state);
  };

  const handleDeleteBudget = async (id: string) => {
    const res = await safeFetchJson<{ state: FinanceDataState }>(`/api/budgets/${id}`, { method: 'DELETE' });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to delete budget');
    setFinanceState(res.data.state);
  };

  const handleSaveGoal = async (goalData: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
    color: string;
  }) => {
    const res = await safeFetchJson<{ state: FinanceDataState }>('/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goalData),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to create goal');
    setFinanceState(res.data.state);
  };

  const handleContributeGoal = async (goalId: string, amount: number) => {
    const res = await safeFetchJson<{ state: FinanceDataState }>(`/api/savings-goals/${goalId}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to contribute to goal');
    setFinanceState(res.data.state);
  };

  const handleDeleteGoal = async (id: string) => {
    const res = await safeFetchJson<{ state: FinanceDataState }>(`/api/savings-goals/${id}`, { method: 'DELETE' });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to delete goal');
    setFinanceState(res.data.state);
  };

  const handlePayBill = async (billId: string) => {
    try {
      const res = await safeFetchJson<{ state: FinanceDataState; bill?: { name: string } }>(`/api/bills/${billId}/pay`, {
        method: 'POST',
      });
      if (!res.ok || !res.data) {
        showToast('error', res.error || 'Payment rejected: insufficient reserves.');
        throw new Error(res.error || 'Failed to pay bill');
      }
      setFinanceState(res.data.state);
      showToast('success', `Payment processed & verified: ${res.data.bill?.name || 'Bill'} settled.`);
    } catch (err: unknown) {
      if (!toast) {
        showToast('error', err instanceof Error ? err.message : 'Failed to pay bill');
      }
      throw err;
    }
  };

  const handleSendMessage = async (prompt: string): Promise<{
    reply: string;
    actionExecuted?: string;
    toolCalls?: ToolCallTrace[];
    pendingProposal?: PendingProposal;
  }> => {
    const res = await safeFetchJson<{
      reply: string;
      actionExecuted?: string;
      toolCalls?: ToolCallTrace[];
      pendingProposal?: PendingProposal;
      state?: FinanceDataState;
    }>('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (res.data?.state) {
      setFinanceState(res.data.state);
    }
    return {
      reply: res.data?.reply || res.error || 'Request processed.',
      actionExecuted: res.data?.actionExecuted,
      toolCalls: res.data?.toolCalls,
      pendingProposal: res.data?.pendingProposal,
    };
  };

  const handleApproveProposal = async (proposalId: string) => {
    const res = await safeFetchJson<{ state: FinanceDataState }>(`/api/ai/proposals/${proposalId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Failed to approve proposal');
    }
    setFinanceState(res.data.state);
  };

  const handleRejectProposal = async (proposalId: string) => {
    const res = await safeFetchJson<{ state: FinanceDataState }>(`/api/ai/proposals/${proposalId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'User declined action in UI' }),
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Failed to decline proposal');
    }
    setFinanceState(res.data.state);
  };

  const handleExecutePromptFromKicker = (promptText: string) => {
    setActiveTab('agent');
    setTimeout(() => {
      handleSendMessage(promptText);
    }, 150);
  };

  if (loading && !financeState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] text-white">
        <div className="text-center space-y-3">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Initializing FinPilot AI Deterministic Engine...
          </p>
        </div>
      </div>
    );
  }

  if (error || !financeState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] text-white p-4">
        <div className="max-w-md w-full rounded-2xl border border-indigo-500/30 bg-[#0E1322] p-6 text-center space-y-4 shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
            <RotateCcw className="h-6 w-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">FinPilot AI Engine Connecting</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {error || 'Syncing ledger state with backend service...'}
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => fetchState(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 active:scale-95"
            >
              Retry Connection Now
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Auto-reconnecting every 1.8s · Server Port 3000
          </p>
        </div>
      </div>
    );
  }

  const unpaidBillsCount = financeState.upcomingBills.filter(b => b.status === 'upcoming').length;
  const pendingProposals = financeState.pendingProposals || [];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onResetData={handleResetData}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        totalBalance={financeState.summary.totalBalance}
        savingsRate={financeState.summary.savingsRate}
        currency={currency}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Header
          activeTab={activeTab}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onOpenTransactionModal={() => {
            setTransactionToEdit(null);
            setIsTransactionModalOpen(true);
          }}
          onNavigateToAgent={() => setActiveTab('agent')}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          unpaidBillsCount={unpaidBillsCount}
          pendingProposalsCount={pendingProposals.length}
          providerStatus={providerStatus}
          currency={currency}
          onToggleCurrency={(c) => setCurrency(c)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'workflow' && (
            <WorkflowView
              financeState={financeState}
              currency={currency}
              onRefreshState={fetchState}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewView
              summary={financeState.summary}
              transactions={financeState.transactions}
              budgets={financeState.budgets}
              savingsGoals={financeState.savingsGoals}
              upcomingBills={financeState.upcomingBills}
              cashFlowHistory={financeState.cashFlowHistory}
              onNavigateTab={setActiveTab}
              onOpenTransactionModal={() => {
                setTransactionToEdit(null);
                setIsTransactionModalOpen(true);
              }}
              onOpenContributeModal={(goal) => {
                setGoalToContribute(goal);
                setIsContributeModalOpen(true);
              }}
              onPayBill={handlePayBill}
              onExecutePrompt={handleExecutePromptFromKicker}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={financeState.transactions}
              onOpenAddModal={() => {
                setTransactionToEdit(null);
                setIsTransactionModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setTransactionToEdit(tx);
                setIsTransactionModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              budgets={financeState.budgets}
              onOpenCreateBudget={() => {
                setBudgetToEdit(null);
                setIsBudgetModalOpen(true);
              }}
              onEditBudget={(b) => {
                setBudgetToEdit(b);
                setIsBudgetModalOpen(true);
              }}
              onDeleteBudget={handleDeleteBudget}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsView
              savingsGoals={financeState.savingsGoals}
              onOpenCreateGoal={() => setIsSavingsGoalModalOpen(true)}
              onOpenContributeModal={(goal) => {
                setGoalToContribute(goal);
                setIsContributeModalOpen(true);
              }}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeTab === 'bills' && (
            <BillsView
              bills={financeState.upcomingBills}
              checkingBalance={5240.25}
              onPayBill={handlePayBill}
            />
          )}

          {activeTab === 'agent' && (
            <AgentView
              actionHistory={financeState.actionHistory}
              financeState={financeState}
              pendingProposals={pendingProposals}
              providerStatus={providerStatus}
              onSendMessage={handleSendMessage}
              onApproveProposal={handleApproveProposal}
              onRejectProposal={handleRejectProposal}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSubmit={handleSaveTransaction}
        initialData={transactionToEdit}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetToEdit(null);
        }}
        onSubmit={handleSaveBudget}
        existingBudget={budgetToEdit}
        existingCategories={financeState.budgets.map(b => b.category)}
      />

      <SavingsGoalModal
        isOpen={isSavingsGoalModalOpen}
        onClose={() => setIsSavingsGoalModalOpen(false)}
        onSubmit={handleSaveGoal}
      />

      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => {
          setIsContributeModalOpen(false);
          setGoalToContribute(null);
        }}
        goal={goalToContribute}
        onSubmit={handleContributeGoal}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setIsOnboardingOpen(false);
        }}
        onResetData={handleResetData}
        currency={currency}
      />

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md ${
              toast.type === 'error'
                ? 'border-red-500/40 bg-red-950/90 text-red-100'
                : 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100'
            }`}
          >
            <div className="text-sm font-medium leading-snug flex-1">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
