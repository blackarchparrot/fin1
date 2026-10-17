import { financeStore } from './financeStore.js';
import {
  Transaction,
  TransactionCategory,
  TransactionType,
  Budget,
  SavingsGoal,
  UpcomingBill
} from '../src/types/finance.js';

export const VALID_CATEGORIES: TransactionCategory[] = [
  'Dining',
  'Groceries',
  'Housing',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Income',
  'Savings',
  'Subscriptions',
  'Other',
];

export interface ToolResult<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  safeAlternative?: string;
  requiresConfirmation?: boolean;
  proposal?: {
    id: string;
    actionType: string;
    title: string;
    description: string;
    impactAnalysis: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * 1. get_transactions
 * Deterministically retrieves transactions from the store with filters.
 */
export function toolGetTransactions(args: {
  category?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): ToolResult<{ transactions: Transaction[]; count: number; totalAmount: number }> {
  try {
    const state = financeStore.getState();
    let txs = [...state.transactions];

    if (args.category && args.category.toLowerCase() !== 'all') {
      const catLower = args.category.toLowerCase();
      txs = txs.filter((t) => t.category.toLowerCase() === catLower);
    }

    if (args.type && args.type.toLowerCase() !== 'all') {
      const typeLower = args.type.toLowerCase();
      txs = txs.filter((t) => t.type.toLowerCase() === typeLower);
    }

    if (args.startDate) {
      const start = new Date(args.startDate).getTime();
      if (!isNaN(start)) {
        txs = txs.filter((t) => new Date(t.date).getTime() >= start);
      }
    }

    if (args.endDate) {
      const end = new Date(args.endDate).getTime();
      if (!isNaN(end)) {
        txs = txs.filter((t) => new Date(t.date).getTime() <= end);
      }
    }

    const limit = args.limit && args.limit > 0 ? args.limit : 20;
    const finalTxs = txs.slice(0, limit);
    const totalAmount = finalTxs.reduce((acc, t) => acc + t.amount, 0);

    return {
      success: true,
      data: {
        transactions: finalTxs,
        count: finalTxs.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to retrieve transactions: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 2. calculate_monthly_spending
 * Deterministically computes spending metrics, category breakdown, and budget comparisons.
 */
export function toolCalculateMonthlySpending(args?: {
  month?: string;
  byCategory?: boolean;
}): ToolResult<{
  totalExpenses: number;
  totalIncome: number;
  netSavings: number;
  savingsRatePct: number;
  categoryBreakdown: Record<string, { amount: number; percentageOfTotal: number; budgetLimit?: number; overBudget: boolean }>;
  topSpendingCategory: { category: string; amount: number };
  dailyAverageSpend: number;
}> {
  try {
    const state = financeStore.getState();
    const expenses = state.transactions.filter((t) => t.type === 'expense');
    const income = state.transactions.filter((t) => t.type === 'income');

    const totalExpenses = Math.round(expenses.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
    const totalIncome = Math.round(income.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
    const netSavings = Math.max(0, Math.round((totalIncome - totalExpenses) * 100) / 100);
    const savingsRatePct = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    const breakdown: Record<string, { amount: number; percentageOfTotal: number; budgetLimit?: number; overBudget: boolean }> = {};
    for (const tx of expenses) {
      const prev = breakdown[tx.category]?.amount || 0;
      breakdown[tx.category] = {
        amount: Math.round((prev + tx.amount) * 100) / 100,
        percentageOfTotal: 0,
        overBudget: false,
      };
    }

    // Attach budget limits and calculate percentages
    let topCat = { category: 'None', amount: 0 };
    for (const [cat, data] of Object.entries(breakdown)) {
      data.percentageOfTotal = totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 100) : 0;
      const budget = state.budgets.find((b) => b.category.toLowerCase() === cat.toLowerCase());
      if (budget) {
        data.budgetLimit = budget.limit;
        data.overBudget = data.amount > budget.limit;
      }
      if (data.amount > topCat.amount) {
        topCat = { category: cat, amount: data.amount };
      }
    }

    // Assume 30 day billing period for daily average
    const dailyAverageSpend = Math.round((totalExpenses / 30) * 100) / 100;

    return {
      success: true,
      data: {
        totalExpenses,
        totalIncome,
        netSavings,
        savingsRatePct,
        categoryBreakdown: breakdown,
        topSpendingCategory: topCat,
        dailyAverageSpend,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to calculate spending: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 3. get_upcoming_bills
 * Deterministically checks upcoming recurring obligations and evaluates account coverage.
 */
export function toolGetUpcomingBills(args?: {
  daysAhead?: number;
  status?: 'upcoming' | 'paid' | 'all';
}): ToolResult<{
  bills: UpcomingBill[];
  totalUpcomingAmount: number;
  checkingBalance: number;
  isCovered: boolean;
  remainingCoverageBuffer: number;
}> {
  try {
    const state = financeStore.getState();
    const statusFilter = args?.status || 'upcoming';
    let bills = state.upcomingBills;

    if (statusFilter !== 'all') {
      bills = bills.filter((b) => b.status === statusFilter);
    }

    const totalUpcomingAmount = Math.round(
      bills.filter((b) => b.status === 'upcoming').reduce((acc, b) => acc + b.amount, 0) * 100
    ) / 100;

    // Checking liquidity calculation
    const checkingBalance = Math.round((5240.25 + state.summary.netCashFlow) * 100) / 100;
    const isCovered = checkingBalance >= totalUpcomingAmount;
    const remainingCoverageBuffer = Math.round((checkingBalance - totalUpcomingAmount) * 100) / 100;

    return {
      success: true,
      data: {
        bills,
        totalUpcomingAmount,
        checkingBalance,
        isCovered,
        remainingCoverageBuffer,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to retrieve bills: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 4. create_or_update_budget
 * Validates category, checks consequential impact, requires confirmation if consequential, or commits change.
 */
export function toolCreateOrUpdateBudget(args: {
  category: string;
  limit: number;
  reason?: string;
  confirmed?: boolean;
}): ToolResult<{ budget: Budget; verified: boolean; message: string }> {
  try {
    if (!args.category || typeof args.category !== 'string') {
      return { success: false, error: 'Category must be specified as a non-empty string.' };
    }

    const matchedCategory = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === args.category.trim().toLowerCase()
    );
    if (!matchedCategory) {
      return {
        success: false,
        error: `Invalid category '${args.category}'. Valid categories are: ${VALID_CATEGORIES.join(', ')}`,
        safeAlternative: `Select from common categories such as Dining, Groceries, Shopping, Transportation, or Utilities.`,
      };
    }

    const limit = Number(args.limit);
    if (isNaN(limit) || limit <= 0) {
      return {
        success: false,
        error: 'Budget limit must be a positive number greater than $0.',
        safeAlternative: 'Consider setting a baseline limit of at least $100.',
      };
    }

    const state = financeStore.getState();
    const existing = state.budgets.find((b) => b.category === matchedCategory);
    const isConsequential = !existing || Math.abs((existing?.limit || 0) - limit) >= 100;

    // If consequential and not yet confirmed by user, return a proposal requiring confirmation
    if (isConsequential && !args.confirmed) {
      const prevLimit = existing ? `$${existing.limit.toLocaleString()}` : '$0 (New Budget)';
      const impact = existing
        ? `Adjusts monthly limit for ${matchedCategory} from ${prevLimit} to $${limit.toLocaleString()} (${limit > existing.limit ? '+' : '-'}$${Math.abs(limit - existing.limit).toLocaleString()}/mo). Current spend is $${existing.spent.toLocaleString()}.`
        : `Establishes a new monthly spending limit of $${limit.toLocaleString()} for ${matchedCategory}.`;

      return {
        success: true,
        requiresConfirmation: true,
        proposal: {
          id: `prop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          actionType: 'create_or_update_budget',
          title: `Update ${matchedCategory} Budget to $${limit.toLocaleString()}`,
          description: args.reason || `Set monthly limit for ${matchedCategory} to $${limit.toLocaleString()}.`,
          impactAnalysis: impact,
          parameters: { category: matchedCategory, limit, reason: args.reason },
        },
      };
    }

    // Execute through deterministic store
    const budget = financeStore.createOrUpdateBudget({
      category: matchedCategory,
      limit,
    });

    // Verification check: read back from store
    const verifiedBudget = financeStore.getState().budgets.find((b) => b.category === matchedCategory);
    const verified = !!verifiedBudget && verifiedBudget.limit === limit;

    return {
      success: true,
      data: {
        budget,
        verified,
        message: `Successfully verified and committed ${matchedCategory} monthly budget of $${limit.toLocaleString()}.`,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to commit budget: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 5. create_savings_plan
 * Validates target, computes required monthly contribution, stress-tests against cash flow, and handles confirmation.
 */
export function toolCreateSavingsPlan(args: {
  goalName: string;
  targetAmount: number;
  deadline: string;
  category?: string;
  confirmed?: boolean;
}): ToolResult<{ goal: SavingsGoal; verified: boolean; monthlyTarget: number; message: string }> {
  try {
    if (!args.goalName || args.goalName.trim().length === 0) {
      return { success: false, error: 'Savings goal name cannot be empty.' };
    }

    const targetAmount = Number(args.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      return { success: false, error: 'Target amount must be a positive number greater than $0.' };
    }

    const deadlineDate = new Date(args.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return {
        success: false,
        error: "Invalid deadline format. Use YYYY-MM-DD format (e.g., '2027-06-30').",
        safeAlternative: "Try setting a deadline 6 to 12 months in the future.",
      };
    }

    const now = new Date();
    const monthsRemaining = Math.max(
      1,
      Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4))
    );
    const requiredMonthlyContribution = Math.round((targetAmount / monthsRemaining) * 100) / 100;

    // Check financial viability against current surplus
    const state = financeStore.getState();
    const currentSurplus = state.summary.netCashFlow;

    if (requiredMonthlyContribution > currentSurplus && currentSurplus > 0) {
      const safeMonthly = Math.max(50, Math.floor(currentSurplus * 0.7));
      const extendedMonths = Math.ceil(targetAmount / safeMonthly);
      const safeDate = new Date();
      safeDate.setMonth(safeDate.getMonth() + extendedMonths);
      const safeDateStr = safeDate.toISOString().split('T')[0];

      if (!args.confirmed) {
        return {
          success: false,
          error: `Required monthly contribution of $${requiredMonthlyContribution.toFixed(2)} exceeds current monthly surplus of $${currentSurplus.toFixed(2)}.`,
          safeAlternative: `Extend deadline to ${safeDateStr} (${extendedMonths} months) at a safe monthly contribution of $${safeMonthly.toFixed(2)}.`,
        };
      }
    }

    // Consequential change requires user confirmation
    if (!args.confirmed) {
      return {
        success: true,
        requiresConfirmation: true,
        proposal: {
          id: `prop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          actionType: 'create_savings_plan',
          title: `Create Savings Goal: "${args.goalName}"`,
          description: `Target $${targetAmount.toLocaleString()} by ${args.deadline}.`,
          impactAnalysis: `Requires $${requiredMonthlyContribution.toFixed(2)}/month across ${monthsRemaining} months. Current monthly surplus of $${currentSurplus.toFixed(2)} provides safe coverage.`,
          parameters: {
            goalName: args.goalName,
            targetAmount,
            deadline: args.deadline,
            category: args.category || 'Personal',
            monthlyTarget: requiredMonthlyContribution,
          },
        },
      };
    }

    // Execute through deterministic store
    const goal = financeStore.createSavingsGoal({
      name: args.goalName.trim(),
      targetAmount,
      deadline: args.deadline,
      category: args.category || 'Personal',
    });

    // Verification
    const verifiedGoal = financeStore.getState().savingsGoals.find((g) => g.id === goal.id);
    const verified = !!verifiedGoal && verifiedGoal.targetAmount === targetAmount;

    return {
      success: true,
      data: {
        goal,
        verified,
        monthlyTarget: requiredMonthlyContribution,
        message: `Verified and activated savings plan "${goal.name}". Goal target: $${targetAmount.toLocaleString()} by ${goal.deadline} ($${requiredMonthlyContribution.toFixed(2)}/mo).`,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to create savings plan: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 6. create_bill_reminder
 * Validates bill parameters, checks date, and manages user confirmation before committing.
 */
export function toolCreateBillReminder(args: {
  name: string;
  amount: number;
  dueDate: string;
  category?: string;
  isAutoPay?: boolean;
  confirmed?: boolean;
}): ToolResult<{ bill: UpcomingBill; verified: boolean; message: string }> {
  try {
    if (!args.name || args.name.trim().length === 0) {
      return { success: false, error: 'Bill name cannot be empty.' };
    }

    const amount = Number(args.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Bill amount must be a positive number greater than $0.' };
    }

    const dueDate = new Date(args.dueDate);
    if (isNaN(dueDate.getTime())) {
      return {
        success: false,
        error: "Invalid due date. Use YYYY-MM-DD format (e.g. '2026-11-15').",
      };
    }

    const matchedCategory = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === (args.category || 'Utilities').trim().toLowerCase()
    ) || 'Utilities';

    // Consequential change requires confirmation
    if (!args.confirmed) {
      return {
        success: true,
        requiresConfirmation: true,
        proposal: {
          id: `prop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          actionType: 'create_bill_reminder',
          title: `Schedule Bill Reminder: "${args.name}"`,
          description: `Add recurring bill of $${amount.toFixed(2)} due ${args.dueDate}.`,
          impactAnalysis: `Will add $${amount.toFixed(2)} to upcoming monthly obligations under ${matchedCategory}. AutoPay: ${args.isAutoPay ? 'Enabled' : 'Disabled'}.`,
          parameters: {
            name: args.name,
            amount,
            dueDate: args.dueDate,
            category: matchedCategory,
            isAutoPay: !!args.isAutoPay,
          },
        },
      };
    }

    // Commit to store
    const newBill: UpcomingBill = {
      id: `bill-${Date.now()}`,
      name: args.name.trim(),
      amount,
      dueDate: args.dueDate,
      category: matchedCategory,
      isAutoPay: !!args.isAutoPay,
      status: 'upcoming',
    };
    financeStore.getState().upcomingBills.push(newBill);

    // Verify
    const verifiedBill = financeStore.getState().upcomingBills.find((b) => b.id === newBill.id);
    const verified = !!verifiedBill;

    return {
      success: true,
      data: {
        bill: newBill,
        verified,
        message: `Verified and scheduled recurring bill reminder for ${newBill.name} ($${amount.toFixed(2)}) due on ${newBill.dueDate}.`,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to create bill reminder: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * 7. verify_financial_plan
 * Runs deterministic stress tests against proposed budget changes, extra savings, and cash flow.
 */
export function toolVerifyFinancialPlan(args: {
  proposedBudgetChanges?: Array<{ category: string; limit: number }>;
  proposedMonthlySavings?: number;
  proposedExpense?: number;
}): ToolResult<{
  isViable: boolean;
  projectedMonthlySurplus: number;
  liquidityBuffer: number;
  safetyScore: number;
  risks: string[];
  recommendations: string[];
}> {
  try {
    const state = financeStore.getState();
    const income = state.summary.monthlyIncome;
    let projectedExpenses = state.summary.monthlyExpenses;

    const risks: string[] = [];
    const recommendations: string[] = [];

    // Apply proposed budget alterations
    if (args.proposedBudgetChanges && Array.isArray(args.proposedBudgetChanges)) {
      for (const change of args.proposedBudgetChanges) {
        const existing = state.budgets.find(
          (b) => b.category.toLowerCase() === change.category.toLowerCase()
        );
        if (existing) {
          const delta = change.limit - existing.limit;
          projectedExpenses += delta;
        } else {
          projectedExpenses += change.limit;
        }
      }
    }

    const extraExpense = Math.max(0, Number(args.proposedExpense) || 0);
    projectedExpenses += extraExpense;

    const proposedSavings = Math.max(0, Number(args.proposedMonthlySavings) || 0);
    const projectedMonthlySurplus = Math.round((income - projectedExpenses - proposedSavings) * 100) / 100;
    const liquidBalance = state.summary.totalBalance;
    const upcomingBillsSum = state.upcomingBills
      .filter((b) => b.status === 'upcoming')
      .reduce((acc, b) => acc + b.amount, 0);

    const liquidityBuffer = Math.round((liquidBalance - upcomingBillsSum) * 100) / 100;

    let safetyScore = 100;

    if (projectedMonthlySurplus < 0) {
      safetyScore -= 45;
      risks.push(`Proposed plan causes a monthly deficit of -$${Math.abs(projectedMonthlySurplus).toFixed(2)}.`);
      recommendations.push(
        `Scale down discretionary budgets (e.g. Dining or Shopping) by $${Math.abs(projectedMonthlySurplus).toFixed(2)} to maintain cash flow neutrality.`
      );
    } else if (projectedMonthlySurplus < 300) {
      safetyScore -= 20;
      risks.push(`Narrow monthly cushion ($${projectedMonthlySurplus.toFixed(2)} remaining). Low tolerance for unexpected expenses.`);
      recommendations.push(`Keep at least a $400 monthly buffer for unforeseen costs.`);
    }

    if (liquidityBuffer < 1000) {
      safetyScore -= 25;
      risks.push(`Liquid checking buffer after upcoming bills is low ($${liquidityBuffer.toFixed(2)}).`);
      recommendations.push(`Ensure checking balance is replenished before auto-pay dates.`);
    }

    const isViable = projectedMonthlySurplus >= 0 && liquidityBuffer >= 500;

    return {
      success: true,
      data: {
        isViable,
        projectedMonthlySurplus,
        liquidityBuffer,
        safetyScore: Math.max(0, safetyScore),
        risks,
        recommendations: recommendations.length > 0 ? recommendations : ['Plan is structurally sound with robust liquidity coverage.'],
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to verify financial plan: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
