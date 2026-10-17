import fs from 'fs';
import path from 'path';
import {
  FinanceDataState,
  Transaction,
  Budget,
  SavingsGoal,
  UpcomingBill,
  AgentActionLog,
  TransactionCategory
} from '../src/types/finance.js';
import { VALID_CATEGORIES } from './agentTools.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'finance-store.json');

function createInitialState(): FinanceDataState {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      date: '2026-10-15',
      description: 'TechCorp Bi-Weekly Direct Deposit',
      amount: 3200.00,
      type: 'income',
      category: 'Income',
      account: 'Checking',
      status: 'completed',
      source: 'manual',
    },
    {
      id: 'tx-2',
      date: '2026-10-14',
      description: 'Whole Foods Market',
      amount: 142.80,
      type: 'expense',
      category: 'Groceries',
      account: 'Sapphire Card',
      status: 'completed',
      source: 'ai_agent',
    },
    {
      id: 'tx-3',
      date: '2026-10-14',
      description: 'Blue Bottle Coffee',
      amount: 6.75,
      type: 'expense',
      category: 'Dining',
      account: 'Sapphire Card',
      status: 'completed',
      source: 'manual',
    },
    {
      id: 'tx-4',
      date: '2026-10-12',
      description: 'ConEdison Electric & Gas',
      amount: 84.20,
      type: 'expense',
      category: 'Utilities',
      account: 'Checking',
      status: 'completed',
      source: 'recurring_bill',
    },
    {
      id: 'tx-5',
      date: '2026-10-11',
      description: 'Netflix & Spotify Subscriptions',
      amount: 28.98,
      type: 'expense',
      category: 'Subscriptions',
      account: 'Sapphire Card',
      status: 'completed',
      source: 'recurring_bill',
    },
    {
      id: 'tx-6',
      date: '2026-10-10',
      description: 'Uber Ride SFO Airport',
      amount: 42.50,
      type: 'expense',
      category: 'Transportation',
      account: 'Sapphire Card',
      status: 'completed',
      source: 'manual',
    },
    {
      id: 'tx-7',
      date: '2026-10-08',
      description: 'Equinox Health & Fitness',
      amount: 160.00,
      type: 'expense',
      category: 'Healthcare',
      account: 'Checking',
      status: 'completed',
      source: 'manual',
    },
    {
      id: 'tx-8',
      date: '2026-10-06',
      description: 'Trader Joe\'s Provisions',
      amount: 88.35,
      type: 'expense',
      category: 'Groceries',
      account: 'Sapphire Card',
      status: 'completed',
      source: 'manual',
    },
    {
      id: 'tx-9',
      date: '2026-10-04',
      description: 'Sweetgreen Salad',
      amount: 18.25,
      type: 'expense',
      category: 'Dining',
      account: 'Sapphire Card',
      status: 'completed',
      source: 'manual',
    },
    {
      id: 'tx-10',
      date: '2026-10-01',
      description: 'Skyline Residences Monthly Rent',
      amount: 2100.00,
      type: 'expense',
      category: 'Housing',
      account: 'Checking',
      status: 'completed',
      source: 'recurring_bill',
    },
    {
      id: 'tx-11',
      date: '2026-10-01',
      description: 'Monthly High-Yield Savings Sweep',
      amount: 600.00,
      type: 'transfer',
      category: 'Savings',
      account: 'Savings',
      status: 'completed',
      source: 'ai_agent',
    },
    {
      id: 'tx-12',
      date: '2026-09-28',
      description: 'Freelance UX Architecture Payout',
      amount: 850.00,
      type: 'income',
      category: 'Income',
      account: 'Checking',
      status: 'completed',
      source: 'manual',
    },
    {
      id: 'tx-13',
      date: '2026-09-26',
      description: 'Amazon Essentials & Office Gear',
      amount: 64.12,
      type: 'expense',
      category: 'Shopping',
      account: 'Sapphire Card',
      status: 'completed',
      source: 'manual',
    }
  ];

  const budgets: Budget[] = [
    { id: 'b-1', category: 'Housing', limit: 2200, spent: 2100, period: 'monthly', color: '#6366F1' },
    { id: 'b-2', category: 'Groceries', limit: 600, spent: 231.15, period: 'monthly', color: '#38BDF8' },
    { id: 'b-3', category: 'Dining', limit: 350, spent: 25.00, period: 'monthly', color: '#A855F7' },
    { id: 'b-4', category: 'Utilities', limit: 180, spent: 84.20, period: 'monthly', color: '#06B6D4' },
    { id: 'b-5', category: 'Transportation', limit: 200, spent: 42.50, period: 'monthly', color: '#3B82F6' },
    { id: 'b-6', category: 'Entertainment', limit: 200, spent: 0.00, period: 'monthly', color: '#EC4899' },
    { id: 'b-7', category: 'Shopping', limit: 250, spent: 64.12, period: 'monthly', color: '#F59E0B' },
  ];

  const savingsGoals: SavingsGoal[] = [
    {
      id: 'sg-1',
      name: 'Emergency Fund (6 Months)',
      targetAmount: 18000,
      currentAmount: 13500,
      deadline: '2026-12-31',
      category: 'Emergency',
      color: '#3B82F6',
    },
    {
      id: 'sg-2',
      name: 'Tokyo & Kyoto Summer Trip',
      targetAmount: 4800,
      currentAmount: 3200,
      deadline: '2027-06-15',
      category: 'Travel',
      color: '#8B5CF6',
    },
    {
      id: 'sg-3',
      name: 'Next-Gen Workstation Setup',
      targetAmount: 2500,
      currentAmount: 1850,
      deadline: '2026-11-30',
      category: 'Technology',
      color: '#06B6D4',
    },
    {
      id: 'sg-4',
      name: 'EV Vehicle Down Payment',
      targetAmount: 10000,
      currentAmount: 4200,
      deadline: '2027-04-01',
      category: 'Automotive',
      color: '#10B981',
    },
  ];

  const upcomingBills: UpcomingBill[] = [
    {
      id: 'bill-1',
      name: 'Verizon Gigabit Fiber Internet',
      amount: 79.99,
      dueDate: '2026-10-19',
      category: 'Utilities',
      isAutoPay: true,
      status: 'upcoming',
      isEssential: true,
    },
    {
      id: 'bill-2',
      name: 'CleanPower Grid Utility',
      amount: 112.45,
      dueDate: '2026-10-22',
      category: 'Utilities',
      isAutoPay: false,
      status: 'upcoming',
      isEssential: true,
    },
    {
      id: 'bill-3',
      name: 'Geico Auto Insurance',
      amount: 145.00,
      dueDate: '2026-10-28',
      category: 'Transportation',
      isAutoPay: true,
      status: 'upcoming',
      isEssential: false,
    },
    {
      id: 'bill-4',
      name: 'Cloud Storage & Workspace Tools',
      amount: 24.99,
      dueDate: '2026-10-31',
      category: 'Subscriptions',
      isAutoPay: true,
      status: 'upcoming',
      isEssential: false,
    },
  ];

  const actionHistory: AgentActionLog[] = [
    {
      id: 'act-1',
      timestamp: '2026-10-15T14:22:10.000Z',
      userPrompt: 'Categorize recent grocery purchases and check budget status',
      actionType: 'financial_query',
      summary: 'Audited 2 recent grocery transactions totaling $231.15; Groceries budget currently at 38.5% utilization ($368.85 remaining).',
      details: { category: 'Groceries', totalSpent: 231.15, budgetLimit: 600 },
      status: 'success',
      aiModel: 'meta-llama/llama-3.3-70b-instruct:free',
    },
    {
      id: 'act-2',
      timestamp: '2026-10-14T09:15:32.000Z',
      userPrompt: 'Add $150 contribution to Tokyo trip goal',
      actionType: 'contribute_savings',
      summary: 'Transferred $150.00 into Tokyo & Kyoto Summer Trip goal; current balance increased to $3,200.00 (66.7% of $4,800 goal).',
      details: { goalId: 'sg-2', contribution: 150, newBalance: 3200 },
      status: 'success',
      aiModel: 'meta-llama/llama-3.3-70b-instruct:free',
    },
    {
      id: 'act-3',
      timestamp: '2026-10-12T16:40:05.000Z',
      userPrompt: 'Analyze upcoming bills for next 14 days and check liquidity',
      actionType: 'financial_query',
      summary: 'Identified 4 upcoming bills totaling $362.43. Checking balance of $5,240.25 comfortably covers all obligations with $4,877.82 margin.',
      details: { billsCount: 4, totalDue: 362.43, checkingBalance: 5240.25 },
      status: 'success',
      aiModel: 'meta-llama/llama-3.3-70b-instruct:free',
    },
  ];

  const cashFlowHistory = [
    { month: 'May 2026', income: 5900, expenses: 3820, savings: 1100 },
    { month: 'Jun 2026', income: 6400, expenses: 3950, savings: 1350 },
    { month: 'Jul 2026', income: 6150, expenses: 3700, savings: 1200 },
    { month: 'Aug 2026', income: 6600, expenses: 4120, savings: 1400 },
    { month: 'Sep 2026', income: 6400, expenses: 3810, savings: 1300 },
    { month: 'Oct 2026', income: 6400, expenses: 2953, savings: 1250 },
  ];

  const summary = calculateSummary(transactions, budgets);

  return {
    summary,
    transactions,
    budgets,
    savingsGoals,
    upcomingBills,
    actionHistory,
    cashFlowHistory,
  };
}

function calculateSummary(transactions: Transaction[], budgets: Budget[]) {
  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      monthlyIncome += t.amount;
    } else if (t.type === 'expense') {
      monthlyExpenses += t.amount;
    }
  }

  const netCashFlow = monthlyIncome - monthlyExpenses;
  const totalBalance = 16820.50 + netCashFlow;
  const monthlySavings = Math.max(0, netCashFlow);
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;

  return {
    totalBalance: Math.round(totalBalance * 100) / 100,
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    savingsRate,
    netCashFlow: Math.round(netCashFlow * 100) / 100,
  };
}

class FinanceStore {
  private state: FinanceDataState;

  constructor() {
    this.state = this.loadFromDisk() || createInitialState();
    this.recomputeBudgetsAndSummary();
  }

  private loadFromDisk(): FinanceDataState | null {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.transactions && parsed.budgets) {
          return parsed as FinanceDataState;
        }
      }
    } catch (err: unknown) {
      console.warn('Could not load persistent state from disk, starting fresh:', err);
    }
    return null;
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err: unknown) {
      console.warn('Failed to persist financial state to disk:', err);
    }
  }

  getState(): FinanceDataState {
    return this.state;
  }

  resetState(): FinanceDataState {
    this.state = createInitialState();
    this.recomputeBudgetsAndSummary();
    this.saveToDisk();
    return this.state;
  }

  private recomputeBudgetsAndSummary() {
    const categorySpentMap: Record<string, number> = {};
    for (const tx of this.state.transactions) {
      if (tx.type === 'expense') {
        categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount;
      }
    }

    this.state.budgets = this.state.budgets.map(b => ({
      ...b,
      spent: Math.round((categorySpentMap[b.category] || 0) * 100) / 100,
    }));

    this.state.summary = calculateSummary(this.state.transactions, this.state.budgets);
  }

  addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
    // Input validation
    if (!tx.description || tx.description.trim().length === 0) {
      throw new Error('Transaction description cannot be empty.');
    }

    const amount = Number(tx.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Transaction amount must be a positive number greater than 0.');
    }

    if (!['income', 'expense', 'transfer'].includes(tx.type)) {
      throw new Error("Invalid transaction type. Must be 'income', 'expense', or 'transfer'.");
    }

    const matchedCategory = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === (tx.category || '').trim().toLowerCase()
    );
    if (!matchedCategory) {
      throw new Error(`Invalid category '${tx.category}'. Valid categories are: ${VALID_CATEGORIES.join(', ')}`);
    }

    const newTx: Transaction = {
      ...tx,
      description: tx.description.trim(),
      amount: Math.round(amount * 100) / 100,
      category: matchedCategory,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    this.state.transactions.unshift(newTx);
    this.recomputeBudgetsAndSummary();
    this.saveToDisk();
    return newTx;
  }

  updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id'>>): Transaction | null {
    const idx = this.state.transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;

    if (updates.amount !== undefined) {
      const amount = Number(updates.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Transaction amount must be a positive number greater than 0.');
      }
      updates.amount = Math.round(amount * 100) / 100;
    }

    if (updates.description !== undefined && updates.description.trim().length === 0) {
      throw new Error('Transaction description cannot be empty.');
    }

    if (updates.category !== undefined) {
      const matched = VALID_CATEGORIES.find(
        (c) => c.toLowerCase() === updates.category!.trim().toLowerCase()
      );
      if (!matched) throw new Error(`Invalid category '${updates.category}'.`);
      updates.category = matched;
    }

    this.state.transactions[idx] = {
      ...this.state.transactions[idx],
      ...updates,
    };
    this.recomputeBudgetsAndSummary();
    this.saveToDisk();
    return this.state.transactions[idx];
  }

  deleteTransaction(id: string): boolean {
    const idx = this.state.transactions.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.state.transactions.splice(idx, 1);
    this.recomputeBudgetsAndSummary();
    this.saveToDisk();
    return true;
  }

  createOrUpdateBudget(budget: { category: TransactionCategory; limit: number; color?: string }): Budget {
    const limit = Number(budget.limit);
    if (isNaN(limit) || limit <= 0) {
      throw new Error('Budget limit must be a positive number greater than 0.');
    }

    const matchedCategory = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === (budget.category || '').trim().toLowerCase()
    );
    if (!matchedCategory) {
      throw new Error(`Invalid budget category '${budget.category}'.`);
    }

    const existingIdx = this.state.budgets.findIndex(b => b.category === matchedCategory);
    if (existingIdx !== -1) {
      this.state.budgets[existingIdx].limit = Math.round(limit * 100) / 100;
      if (budget.color) this.state.budgets[existingIdx].color = budget.color;
      this.recomputeBudgetsAndSummary();
      this.saveToDisk();
      return this.state.budgets[existingIdx];
    } else {
      const colors = ['#6366F1', '#38BDF8', '#A855F7', '#06B6D4', '#EC4899', '#10B981', '#F59E0B'];
      const newBudget: Budget = {
        id: `b-${Date.now()}`,
        category: matchedCategory,
        limit: Math.round(limit * 100) / 100,
        spent: 0,
        period: 'monthly',
        color: budget.color || colors[this.state.budgets.length % colors.length],
      };
      this.state.budgets.push(newBudget);
      this.recomputeBudgetsAndSummary();
      this.saveToDisk();
      return newBudget;
    }
  }

  deleteBudget(id: string): boolean {
    const idx = this.state.budgets.findIndex(b => b.id === id);
    if (idx === -1) return false;
    this.state.budgets.splice(idx, 1);
    this.saveToDisk();
    return true;
  }

  createSavingsGoal(goal: { name: string; targetAmount: number; currentAmount?: number; deadline: string; category?: string; color?: string }): SavingsGoal {
    if (!goal.name || goal.name.trim().length === 0) {
      throw new Error('Savings goal name cannot be empty.');
    }

    const targetAmount = Number(goal.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      throw new Error('Savings target amount must be a positive number greater than 0.');
    }

    const currentAmount = goal.currentAmount !== undefined ? Number(goal.currentAmount) : 0;
    if (isNaN(currentAmount) || currentAmount < 0) {
      throw new Error('Starting amount cannot be negative.');
    }

    const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#EC4899', '#F59E0B'];
    const newGoal: SavingsGoal = {
      id: `sg-${Date.now()}`,
      name: goal.name.trim(),
      targetAmount: Math.round(targetAmount * 100) / 100,
      currentAmount: Math.round(currentAmount * 100) / 100,
      deadline: goal.deadline,
      category: goal.category || 'Personal',
      color: goal.color || colors[this.state.savingsGoals.length % colors.length],
    };
    this.state.savingsGoals.push(newGoal);
    this.saveToDisk();
    return newGoal;
  }

  contributeToSavingsGoal(goalId: string, amount: number): { goal: SavingsGoal; transaction: Transaction } | null {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Contribution amount must be a positive number greater than 0.');
    }

    const goal = this.state.savingsGoals.find(g => g.id === goalId);
    if (!goal) return null;

    goal.currentAmount = Math.round((goal.currentAmount + numAmount) * 100) / 100;

    const tx = this.addTransaction({
      date: new Date().toISOString().split('T')[0],
      description: `Contribution to ${goal.name}`,
      amount: numAmount,
      type: 'transfer',
      category: 'Savings',
      account: 'Savings',
      status: 'completed',
      source: 'ai_agent',
    });

    this.saveToDisk();
    return { goal, transaction: tx };
  }

  deleteSavingsGoal(id: string): boolean {
    const idx = this.state.savingsGoals.findIndex(g => g.id === id);
    if (idx === -1) return false;
    this.state.savingsGoals.splice(idx, 1);
    this.saveToDisk();
    return true;
  }

  createBill(bill: {
    name: string;
    amount: number;
    dueDate: string;
    category?: TransactionCategory;
    isAutoPay?: boolean;
    isEssential?: boolean;
  }): UpcomingBill {
    const amount = Number(bill.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Bill amount must be a positive number greater than 0.');
    }
    const newBill: UpcomingBill = {
      id: `bill-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: bill.name.trim(),
      amount: Math.round(amount * 100) / 100,
      dueDate: bill.dueDate,
      category: bill.category || 'Utilities',
      isAutoPay: !!bill.isAutoPay,
      status: 'upcoming',
      isEssential: !!bill.isEssential,
    };
    this.state.upcomingBills.push(newBill);
    this.saveToDisk();
    return newBill;
  }

  payBill(billId: string): { bill: UpcomingBill; transaction: Transaction } {
    const bill = this.state.upcomingBills.find(b => b.id === billId);
    if (!bill) {
      throw new Error(`Bill with ID '${billId}' does not exist.`);
    }

    if (bill.status === 'paid') {
      throw new Error(`Bill '${bill.name}' is already marked as paid. Duplicate payment rejected.`);
    }

    // Check available checking liquidity
    const checkingBalance = Math.round((5240.25 + this.state.summary.netCashFlow) * 100) / 100;
    if (checkingBalance < bill.amount) {
      throw new Error(
        `Insufficient checking reserves ($${checkingBalance.toFixed(2)}) to service bill '${bill.name}' ($${bill.amount.toFixed(2)}). Real payment rejected.`
      );
    }

    bill.status = 'paid';

    const tx = this.addTransaction({
      date: new Date().toISOString().split('T')[0],
      description: `Bill Payment: ${bill.name}`,
      amount: bill.amount,
      type: 'expense',
      category: bill.category,
      account: 'Checking',
      status: 'completed',
      source: 'recurring_bill',
    });

    this.saveToDisk();
    return { bill, transaction: tx };
  }

  addActionLog(log: Omit<AgentActionLog, 'id' | 'timestamp'>): AgentActionLog {
    const newLog: AgentActionLog = {
      ...log,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.state.actionHistory.unshift(newLog);
    this.saveToDisk();
    return newLog;
  }
}

export const financeStore = new FinanceStore();
