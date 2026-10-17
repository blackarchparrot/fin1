export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionCategory =
  | 'Dining'
  | 'Groceries'
  | 'Housing'
  | 'Utilities'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Healthcare'
  | 'Income'
  | 'Savings'
  | 'Subscriptions'
  | 'Other';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  account: string;
  status: 'completed' | 'pending';
  source?: 'manual' | 'ai_agent' | 'recurring_bill' | 'autonomous_workflow';
}

export interface Budget {
  id: string;
  category: TransactionCategory;
  limit: number;
  spent: number;
  period: 'monthly';
  color: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  color: string;
  monthlyTarget?: number;
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: TransactionCategory;
  isAutoPay: boolean;
  status: 'upcoming' | 'paid' | 'overdue';
  isEssential?: boolean;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  netCashFlow: number;
}

export interface ToolCallTrace {
  toolName: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: string;
}

export interface PendingProposal {
  id: string;
  timestamp: string;
  actionType: 'create_or_update_budget' | 'create_savings_plan' | 'create_bill_reminder' | 'pay_bill' | 'contribute_savings';
  title: string;
  description: string;
  impactAnalysis: string;
  proposedChanges: Record<string, unknown>;
  isConsequential: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  verificationDetails?: string;
  alternativeSuggestion?: string;
}

export interface AgentActionLog {
  id: string;
  timestamp: string;
  userPrompt: string;
  actionType:
    | 'get_transactions'
    | 'calculate_monthly_spending'
    | 'get_upcoming_bills'
    | 'create_or_update_budget'
    | 'create_savings_plan'
    | 'create_bill_reminder'
    | 'verify_financial_plan'
    | 'add_transaction'
    | 'contribute_savings'
    | 'pay_bill'
    | 'financial_query'
    | 'proposal_created'
    | 'proposal_approved'
    | 'proposal_rejected'
    | 'workflow_plan'
    | 'workflow_act'
    | 'workflow_verify'
    | 'workflow_recover'
    | 'workflow_rollback';
  summary: string;
  details: Record<string, unknown>;
  status: 'success' | 'failed' | 'info' | 'awaiting_confirmation';
  aiModel: string;
  toolCalls?: ToolCallTrace[];
  verificationResult?: {
    verified: boolean;
    message: string;
    metricsBefore?: Record<string, unknown>;
    metricsAfter?: Record<string, unknown>;
  };
}

export interface MonthlyCashFlowPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

// Plan -> Act -> Verify -> Recover Types
export type WorkflowPhase = 'plan' | 'act' | 'verify' | 'recover' | 'completed' | 'rolled_back';

export interface WorkflowStep {
  id: string;
  phase: 'plan' | 'act' | 'verify' | 'recover';
  stepNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed' | 'skipped';
  timestamp: string;
  toolCalled?: string;
  inputs?: Record<string, unknown>;
  calculationResult?: Record<string, unknown>;
  actionRationale?: string;
  verificationEvidence?: {
    verified: boolean;
    expected: string;
    actual: string;
    proof: Record<string, unknown>;
  };
}

export interface PlanRationaleItem {
  target: string;
  chosenAction: string;
  whySelected: string;
  alternativeConsidered: string;
}

export interface AutonomousWorkflowState {
  id: string;
  scenarioName: string;
  currency: string;
  startingAvailableAmount: number;
  targetSavingsAmount: number;
  essentialBillsTotal: number;
  discretionaryBuffer: number;
  isFeasible: boolean;
  phase: WorkflowPhase;
  currentStepIndex: number;
  steps: WorkflowStep[];
  rationales: PlanRationaleItem[];
  proposedChanges: {
    budgetAdjustments: Array<{ category: TransactionCategory; previousLimit: number; proposedLimit: number; reason: string }>;
    savingsAllocation: { goalName: string; amount: number; targetGoalId?: string };
    protectedBills: Array<{ name: string; amount: number; dueDate: string }>;
  };
  recoveryPlan?: {
    shortfallAmount: number;
    explanation: string;
    suggestedAdjustments: Array<{ action: string; impact: string }>;
    revisedSavingsTarget: number;
  };
  canUndo: boolean;
  rollbackSnapshot?: {
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    transactionsCount: number;
    summary: FinancialSummary;
  };
}

export interface FinanceDataState {
  summary: FinancialSummary;
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  upcomingBills: UpcomingBill[];
  actionHistory: AgentActionLog[];
  cashFlowHistory: MonthlyCashFlowPoint[];
  pendingProposals?: PendingProposal[];
  activeWorkflow?: AutonomousWorkflowState | null;
}

export interface AIProviderStatus {
  provider: 'openrouter' | 'demo';
  model: string;
  hasApiKey: boolean;
  description: string;
  isFreeModel?: boolean;
  error?: string;
}
