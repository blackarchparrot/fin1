import { financeStore } from './financeStore.js';
import { proposalStore } from './proposalStore.js';
import {
  toolGetTransactions,
  toolCalculateMonthlySpending,
  toolGetUpcomingBills,
  toolCreateOrUpdateBudget,
  toolCreateSavingsPlan,
  toolCreateBillReminder,
  toolVerifyFinancialPlan,
  ToolResult,
} from './agentTools.js';
import {
  ToolCallTrace,
  PendingProposal,
  AIProviderStatus,
} from '../src/types/finance.js';

const DEFAULT_FREE_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

export function getAIProviderStatus(): AIProviderStatus {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const configuredModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_FREE_MODEL;
  const isFreeModel = configuredModel.endsWith(':free');

  if (apiKey && apiKey.length > 0) {
    return {
      provider: 'openrouter',
      model: configuredModel,
      hasApiKey: true,
      isFreeModel,
      description: `Connected to OpenRouter Free Model (${configuredModel})`,
    };
  }

  return {
    provider: 'demo',
    model: 'finpilot-deterministic-engine',
    hasApiKey: false,
    isFreeModel: true,
    description: 'Demo Mode: Running deterministic local tool-calling engine (Zero external API dependencies)',
  };
}

// 7 Explicit Function Declarations (OpenAI / OpenRouter JSON Schema format)
const OPENROUTER_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_transactions',
      description: 'Retrieve real deterministic transactions from the user ledger. Filter by category, type (income, expense, transfer), or limit.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Optional category filter, e.g. Dining, Groceries, Housing' },
          type: { type: 'string', description: "Optional transaction type: 'income', 'expense', or 'transfer'" },
          limit: { type: 'number', description: 'Max number of transactions to return (default: 10)' },
          startDate: { type: 'string', description: 'Optional start date YYYY-MM-DD' },
          endDate: { type: 'string', description: 'Optional end date YYYY-MM-DD' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_monthly_spending',
      description: 'Perform deterministic financial calculations on expenses, net savings, category percentage breakdown, and budget limits.',
      parameters: {
        type: 'object',
        properties: {
          byCategory: { type: 'boolean', description: 'Whether to include per-category breakdown and budget comparisons' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_bills',
      description: 'Retrieve upcoming scheduled recurring bills and verify if current checking liquidity covers them.',
      parameters: {
        type: 'object',
        properties: {
          daysAhead: { type: 'number', description: 'Number of days ahead to look (default: 30)' },
          status: { type: 'string', description: "'upcoming', 'paid', or 'all'" },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_or_update_budget',
      description: 'Set or adjust the monthly spending limit for a category. Significant changes require user confirmation before committing.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Category name (e.g. Dining, Groceries, Shopping, Transportation)' },
          limit: { type: 'number', description: 'New monthly limit in dollars' },
          reason: { type: 'string', description: 'Rationale for the budget change' },
          confirmed: { type: 'boolean', description: 'Set true ONLY if the user has explicitly confirmed this change' },
        },
        required: ['category', 'limit'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_savings_plan',
      description: 'Create a new savings goal with target amount and deadline. Calculates required monthly contributions and requires confirmation before committing.',
      parameters: {
        type: 'object',
        properties: {
          goalName: { type: 'string', description: 'Name of the savings goal' },
          targetAmount: { type: 'number', description: 'Target dollar amount' },
          deadline: { type: 'string', description: 'Target date in YYYY-MM-DD format' },
          category: { type: 'string', description: 'Category, e.g. Travel, Emergency, Technology' },
          confirmed: { type: 'boolean', description: 'Set true ONLY if user has explicitly confirmed' },
        },
        required: ['goalName', 'targetAmount', 'deadline'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_bill_reminder',
      description: 'Schedule a recurring bill reminder. Validates parameters and requires user confirmation before committing.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Bill provider name' },
          amount: { type: 'number', description: 'Bill amount in dollars' },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          category: { type: 'string', description: 'Category (e.g. Utilities, Subscriptions, Transportation)' },
          isAutoPay: { type: 'boolean', description: 'Whether the bill is set to auto-pay' },
          confirmed: { type: 'boolean', description: 'Set true ONLY if user explicitly confirmed' },
        },
        required: ['name', 'amount', 'dueDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'verify_financial_plan',
      description: 'Run deterministic stress tests against proposed budget changes, extra savings, and liquid checking reserves to detect deficits or risks.',
      parameters: {
        type: 'object',
        properties: {
          proposedBudgetChanges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                limit: { type: 'number' },
              },
              required: ['category', 'limit'],
            },
            description: 'Array of proposed category limits',
          },
          proposedMonthlySavings: { type: 'number', description: 'Extra monthly savings proposed' },
          proposedExpense: { type: 'number', description: 'Additional planned one-off expense' },
        },
      },
    },
  },
];

/**
 * Execute an explicitly requested tool deterministically
 */
function executeTool(
  toolName: string,
  args: Record<string, unknown>
): { result: ToolResult<unknown>; proposalCreated?: PendingProposal } {
  let result: ToolResult<unknown>;
  let proposalCreated: PendingProposal | undefined;

  switch (toolName) {
    case 'get_transactions':
      result = toolGetTransactions(args as Parameters<typeof toolGetTransactions>[0]);
      break;
    case 'calculate_monthly_spending':
      result = toolCalculateMonthlySpending(args as Parameters<typeof toolCalculateMonthlySpending>[0]);
      break;
    case 'get_upcoming_bills':
      result = toolGetUpcomingBills(args as Parameters<typeof toolGetUpcomingBills>[0]);
      break;
    case 'create_or_update_budget':
      result = toolCreateOrUpdateBudget(args as Parameters<typeof toolCreateOrUpdateBudget>[0]);
      break;
    case 'create_savings_plan':
      result = toolCreateSavingsPlan(args as Parameters<typeof toolCreateSavingsPlan>[0]);
      break;
    case 'create_bill_reminder':
      result = toolCreateBillReminder(args as Parameters<typeof toolCreateBillReminder>[0]);
      break;
    case 'verify_financial_plan':
      result = toolVerifyFinancialPlan(args as Parameters<typeof toolVerifyFinancialPlan>[0]);
      break;
    default:
      result = { success: false, error: `Unknown tool: ${toolName}` };
  }

  // If tool produced a proposal requiring user confirmation, save to proposalStore
  if (result.requiresConfirmation && result.proposal) {
    proposalCreated = proposalStore.addProposal({
      id: result.proposal.id,
      actionType: result.proposal.actionType as PendingProposal['actionType'],
      title: result.proposal.title,
      description: result.proposal.description,
      impactAnalysis: result.proposal.impactAnalysis,
      proposedChanges: result.proposal.parameters,
      isConsequential: true,
    });
  }

  return { result, proposalCreated };
}

export async function processFinancialAgentRequest(prompt: string): Promise<{
  reply: string;
  actionExecuted?: string;
  toolCalls: ToolCallTrace[];
  pendingProposal?: PendingProposal;
  providerStatus: AIProviderStatus;
  details?: Record<string, unknown>;
}> {
  const providerStatus = getAIProviderStatus();
  const toolTraces: ToolCallTrace[] = [];

  // 1. Direct confirmation of pending proposal (e.g., "approve prop-123")
  const approveMatch = prompt.match(/(?:approve|confirm|proceed with|yes to)\s+(prop-[\w-]+)/i);
  if (approveMatch && approveMatch[1]) {
    const propId = approveMatch[1];
    const exec = await proposalStore.executeApprovedProposal(propId);
    if (exec.success) {
      return {
        reply: `Action approved and executed successfully: ${exec.proposal.title}. ${exec.proposal.verificationDetails || 'Verified and committed.'}`,
        actionExecuted: exec.proposal.actionType,
        toolCalls: [],
        providerStatus,
        details: { proposal: exec.proposal, result: exec.result },
      };
    } else {
      return {
        reply: `Failed to execute proposal: ${exec.error}. No changes were made.`,
        actionExecuted: 'proposal_failed',
        toolCalls: [],
        providerStatus,
      };
    }
  }

  // 2. OpenRouter API integration if OPENROUTER_API_KEY is configured
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openRouterModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_FREE_MODEL;

  if (openRouterKey && openRouterKey.length > 0) {
    try {
      const systemMessage = {
        role: 'system',
        content: `You are FinPilot AI, a precision autonomous Personal Finance Copilot.
You have access to 7 deterministic financial tools:
1. get_transactions: Inspect actual transactions. NEVER invent transaction figures.
2. calculate_monthly_spending: Calculate exact monthly outlays, category percentages, and budget overruns.
3. get_upcoming_bills: Check upcoming bills and verify checking account coverage.
4. create_or_update_budget: Propose or modify a category spending limit. Consequential changes require user confirmation before committing.
5. create_savings_plan: Create a savings goal and verify monthly affordability. Requires confirmation before committing.
6. create_bill_reminder: Schedule a bill reminder. Requires confirmation before committing.
7. verify_financial_plan: Deterministically stress-test proposed financial alterations against cash flow.

RULES:
- When a user asks about transactions, bills, or spending, ALWAYS call the appropriate tool.
- Consequential changes (creating budgets, setting savings plans, adding bills) will return requiresConfirmation: true. When that occurs, clearly present the proposed change, the calculated impact, and ask the user to confirm.
- If a tool reports an error (e.g. insufficient surplus), explain the error clearly and offer the suggested safe alternative.
- NEVER claim to have moved money or paid a bill unless an actual payment tool was executed and verified.
- Be concise, accurate, and professional.`,
      };

      const userMessage = { role: 'user', content: prompt };

      const openRouterPayload = {
        model: openRouterModel,
        messages: [systemMessage, userMessage],
        tools: OPENROUTER_TOOLS,
        tool_choice: 'auto',
      };

      const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://github.com/finpilot-ai/finpilot-hackathon-2026',
          'X-Title': 'FinPilot AI Autonomous Copilot',
        },
        body: JSON.stringify(openRouterPayload),
        signal: AbortSignal.timeout(5000),
      });

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        let errorJson: Record<string, unknown> | null = null;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // non-JSON error
        }

        const errMsg =
          (errorJson?.error as { message?: string })?.message ||
          `OpenRouter API HTTP ${apiRes.status}: ${errorText.slice(0, 160)}`;

        console.warn(`[OpenRouter Warning] Model ${openRouterModel} returned error:`, errMsg);

        // Check if rate limited or model unavailable
        if (apiRes.status === 429) {
          return {
            reply: `OpenRouter Free Model Rate Limit Exceeded: The free model "${openRouterModel}" is currently receiving high community traffic. You can configure another free model (e.g., set OPENROUTER_MODEL="stepfun/step-3.5-flash:free" or "cognitivecomputations/dolphin3.0-r1-mistral-24b:free"), or FinPilot will seamlessly handle your query with the deterministic local engine.`,
            actionExecuted: 'openrouter_rate_limit',
            toolCalls: [],
            providerStatus: {
              ...providerStatus,
              error: 'Rate limit reached on free model',
            },
          };
        }

        if (apiRes.status === 404 || apiRes.status === 400) {
          return {
            reply: `OpenRouter Model Unavailable: The configured model "${openRouterModel}" returned an error (${errMsg}). Please check available free models on OpenRouter (e.g., meta-llama/llama-3.3-70b-instruct:free, stepfun/step-3.5-flash:free) or verify your OPENROUTER_MODEL setting.`,
            actionExecuted: 'openrouter_model_error',
            toolCalls: [],
            providerStatus: {
              ...providerStatus,
              error: `Model unavailable: ${errMsg}`,
            },
          };
        }

        // Fall back gracefully to deterministic engine
        return runDeterministicLocalAgent(prompt, {
          ...providerStatus,
          error: errMsg,
        });
      }

      const completion = await apiRes.json();
      const choice = completion.choices?.[0];
      const assistantMessage = choice?.message;

      // Handle function calling if OpenRouter returned tool_calls
      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0];
        const toolName = toolCall.function?.name || 'unknown_tool';
        let callArgs: Record<string, unknown> = {};
        try {
          callArgs = JSON.parse(toolCall.function?.arguments || '{}');
        } catch {
          callArgs = {};
        }

        const { result, proposalCreated } = executeTool(toolName, callArgs);
        toolTraces.push({
          toolName,
          arguments: callArgs,
          result: (result.data || { error: result.error, safeAlternative: result.safeAlternative }) as Record<string, unknown>,
          timestamp: new Date().toISOString(),
        });

        // Second turn: send tool result back to OpenRouter for natural synthesis
        try {
          const secondPayload = {
            model: openRouterModel,
            messages: [
              systemMessage,
              userMessage,
              assistantMessage,
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolName,
                content: JSON.stringify(result),
              },
            ],
          };

          const secondRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openRouterKey}`,
              'HTTP-Referer': 'https://github.com/finpilot-ai/finpilot-hackathon-2026',
              'X-Title': 'FinPilot AI Autonomous Copilot',
            },
            body: JSON.stringify(secondPayload),
            signal: AbortSignal.timeout(5000),
          });

          if (secondRes.ok) {
            const secondCompletion = await secondRes.json();
            const synthesizedReply = secondCompletion.choices?.[0]?.message?.content;
            if (synthesizedReply) {
              financeStore.addActionLog({
                userPrompt: prompt,
                actionType: toolName as Parameters<typeof financeStore.addActionLog>[0]['actionType'],
                summary: synthesizedReply.slice(0, 160) + (synthesizedReply.length > 160 ? '...' : ''),
                details: { toolCalls: toolTraces, proposal: proposalCreated },
                status: result.success ? (result.requiresConfirmation ? 'awaiting_confirmation' : 'success') : 'failed',
                aiModel: openRouterModel,
                toolCalls: toolTraces,
                verificationResult: {
                  verified: result.success,
                  message: result.error ? `Failed: ${result.error}` : 'Deterministic execution verified against ledger',
                },
              });

              return {
                reply: synthesizedReply,
                actionExecuted: toolName,
                toolCalls: toolTraces,
                pendingProposal: proposalCreated,
                providerStatus,
                details: { toolResult: result },
              };
            }
          }
        } catch {
          // If synthesis fails, proceed to deterministic response formatting
        }

        // Direct deterministic response formatting if synthesis turn was skipped or failed
        let formattedReply = `Executed tool '${toolName}':\n`;
        if (result.success) {
          if (proposalCreated) {
            formattedReply = `Action Proposed for Confirmation:\n• ${proposalCreated.title}\n• ${proposalCreated.description}\nImpact: ${proposalCreated.impactAnalysis}\n\nPlease confirm to commit this change to your ledger.`;
          } else {
            formattedReply = `Tool '${toolName}' executed successfully with verified deterministic output.`;
          }
        } else {
          formattedReply = `Tool execution failed: ${result.error}${result.safeAlternative ? `\nSuggested Alternative: ${result.safeAlternative}` : ''}`;
        }

        return {
          reply: formattedReply,
          actionExecuted: toolName,
          toolCalls: toolTraces,
          pendingProposal: proposalCreated,
          providerStatus,
          details: { toolResult: result },
        };
      }

      // If text response without tool call
      const textReply = assistantMessage?.content || 'I have analyzed your request.';
      financeStore.addActionLog({
        userPrompt: prompt,
        actionType: 'financial_query',
        summary: textReply.slice(0, 160) + (textReply.length > 160 ? '...' : ''),
        details: { response: textReply },
        status: 'info',
        aiModel: openRouterModel,
      });

      return {
        reply: textReply,
        actionExecuted: 'financial_query',
        toolCalls: [],
        providerStatus,
      };
    } catch (err: unknown) {
      console.warn('OpenRouter tool invocation encountered an issue, falling back to deterministic local tool engine:', err);
    }
  }

  // 3. Demo Mode / Resilient Local Deterministic Agent (Zero paid API dependencies)
  return runDeterministicLocalAgent(prompt, providerStatus);
}

/**
 * Resilient deterministic agent execution for Demo Mode and offline operation.
 * Maps user natural language requests to the 7 explicitly defined tools.
 */
function runDeterministicLocalAgent(
  prompt: string,
  providerStatus: AIProviderStatus
): {
  reply: string;
  actionExecuted?: string;
  toolCalls: ToolCallTrace[];
  pendingProposal?: PendingProposal;
  providerStatus: AIProviderStatus;
  details?: Record<string, unknown>;
} {
  const lower = prompt.toLowerCase();
  const toolTraces: ToolCallTrace[] = [];

  // 1. Transaction queries: e.g. "show transactions", "what did I spend on groceries", "get transactions"
  if (
    lower.includes('transaction') ||
    lower.includes('recent purchases') ||
    lower.includes('what did i spend on') ||
    lower.includes('how much did i spend on')
  ) {
    let category: string | undefined;
    if (lower.includes('grocer')) category = 'Groceries';
    else if (lower.includes('dining') || lower.includes('food') || lower.includes('restaurant')) category = 'Dining';
    else if (lower.includes('transport') || lower.includes('uber')) category = 'Transportation';
    else if (lower.includes('utilit') || lower.includes('electric')) category = 'Utilities';

    const { result } = executeTool('get_transactions', { category, limit: 5 });
    toolTraces.push({
      toolName: 'get_transactions',
      arguments: { category, limit: 5 },
      result: (result.data || {}) as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });

    const data = result.data as { transactions: Array<{ date: string; description: string; amount: number; account: string; category: string }>; count: number; totalAmount: number };
    const reply = category
      ? `Retrieved ${data.count} recent transaction(s) under ${category} totaling $${data.totalAmount.toFixed(2)}:\n` +
        data.transactions.map((t) => `• ${t.date} — ${t.description}: $${t.amount.toFixed(2)} (${t.account})`).join('\n')
      : `Retrieved your ${data.count} most recent transactions totaling $${data.totalAmount.toFixed(2)}:\n` +
        data.transactions.map((t) => `• ${t.date} — ${t.description}: $${t.amount.toFixed(2)} [${t.category}]`).join('\n');

    financeStore.addActionLog({
      userPrompt: prompt,
      actionType: 'get_transactions',
      summary: `Retrieved ${data.count} deterministic transactions totaling $${data.totalAmount.toFixed(2)}.`,
      details: { toolCalls: toolTraces },
      status: 'success',
      aiModel: 'finpilot-deterministic-engine (Demo Mode)',
      toolCalls: toolTraces,
      verificationResult: { verified: true, message: 'Verified against current ledger' },
    });

    return {
      reply,
      actionExecuted: 'get_transactions',
      toolCalls: toolTraces,
      providerStatus,
    };
  }

  // 2. Spending calculations: e.g. "calculate monthly spending", "how is my spending", "spending breakdown", "spending this month"
  if (
    lower.includes('spending') ||
    lower.includes('outflow') ||
    lower.includes('expenses this month') ||
    lower.includes('monthly breakdown')
  ) {
    const { result } = executeTool('calculate_monthly_spending', { byCategory: true });
    toolTraces.push({
      toolName: 'calculate_monthly_spending',
      arguments: { byCategory: true },
      result: (result.data || {}) as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });

    interface SpendingData {
      totalExpenses: number;
      dailyAverageSpend: number;
      totalIncome: number;
      netSavings: number;
      savingsRatePct: number;
      topSpendingCategory: { category: string; amount: number };
      categoryBreakdown: Record<string, { amount: number; percentageOfTotal: number; budgetLimit?: number }>;
    }
    const data = result.data as SpendingData;
    const reply =
      `Monthly Spending Analysis (Deterministic Calculation):\n` +
      `• Total Outflow: $${data.totalExpenses.toLocaleString()} across 30 days ($${data.dailyAverageSpend.toFixed(2)}/day)\n` +
      `• Total Inflow: $${data.totalIncome.toLocaleString()} (Net Savings: +$${data.netSavings.toLocaleString()}, ${data.savingsRatePct}% savings rate)\n` +
      `• Top Category: ${data.topSpendingCategory.category} ($${data.topSpendingCategory.amount.toLocaleString()})\n\n` +
      `Category Outlays:\n` +
      Object.entries(data.categoryBreakdown)
        .map(
          ([cat, info]) =>
            `• ${cat}: $${info.amount.toLocaleString()} (${info.percentageOfTotal}% of total spend${info.budgetLimit ? ` / $${info.budgetLimit} limit` : ''})`
        )
        .join('\n');

    financeStore.addActionLog({
      userPrompt: prompt,
      actionType: 'calculate_monthly_spending',
      summary: `Computed monthly outflow of $${data.totalExpenses.toLocaleString()} and net savings of $${data.netSavings.toLocaleString()} (${data.savingsRatePct}% rate).`,
      details: { toolCalls: toolTraces },
      status: 'success',
      aiModel: 'finpilot-deterministic-engine (Demo Mode)',
      toolCalls: toolTraces,
      verificationResult: { verified: true, message: 'Exact mathematical calculation verified' },
    });

    return {
      reply,
      actionExecuted: 'calculate_monthly_spending',
      toolCalls: toolTraces,
      providerStatus,
    };
  }

  // 3. Upcoming bills: e.g. "what bills are due", "get upcoming bills", "bills due this month"
  if (
    lower.includes('bill') &&
    (lower.includes('due') || lower.includes('upcoming') || lower.includes('what') || lower.includes('check') || lower.includes('list'))
  ) {
    const { result } = executeTool('get_upcoming_bills', { daysAhead: 30, status: 'upcoming' });
    toolTraces.push({
      toolName: 'get_upcoming_bills',
      arguments: { daysAhead: 30, status: 'upcoming' },
      result: (result.data || {}) as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });

    interface BillsData {
      bills: Array<{ name: string; amount: number; dueDate: string; isAutoPay: boolean }>;
      totalUpcomingAmount: number;
      checkingBalance: number;
      isCovered: boolean;
      remainingCoverageBuffer: number;
    }
    const data = result.data as BillsData;
    const reply =
      `Upcoming Obligations Check (Next 30 Days):\n` +
      `• ${data.bills.length} pending bill(s) totaling $${data.totalUpcomingAmount.toFixed(2)}\n` +
      `• Checking Reserve: $${data.checkingBalance.toLocaleString()}\n` +
      `• Coverage Status: ${data.isCovered ? 'Fully Covered' : 'Deficit Risk'} with a safe buffer of +$${data.remainingCoverageBuffer.toFixed(2)}\n\n` +
      data.bills
        .map((b) => `• ${b.name}: $${b.amount.toFixed(2)} (Due ${b.dueDate}, AutoPay: ${b.isAutoPay ? 'ON' : 'OFF'})`)
        .join('\n');

    financeStore.addActionLog({
      userPrompt: prompt,
      actionType: 'get_upcoming_bills',
      summary: `Audited ${data.bills.length} upcoming bills totaling $${data.totalUpcomingAmount.toFixed(2)}; verified $${data.remainingCoverageBuffer.toFixed(2)} liquidity buffer.`,
      details: { toolCalls: toolTraces },
      status: 'success',
      aiModel: 'finpilot-deterministic-engine (Demo Mode)',
      toolCalls: toolTraces,
      verificationResult: { verified: true, message: 'Coverage verified against checking reserves' },
    });

    return {
      reply,
      actionExecuted: 'get_upcoming_bills',
      toolCalls: toolTraces,
      providerStatus,
    };
  }

  // 4. Create or update budget: e.g. "set dining budget to 450", "update transportation budget to 550"
  const amountMatch = prompt.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

  if (
    lower.includes('budget') &&
    amount &&
    (lower.includes('set') || lower.includes('update') || lower.includes('change') || lower.includes('create') || lower.includes('limit'))
  ) {
    let cat = 'Dining';
    if (lower.includes('grocer')) cat = 'Groceries';
    else if (lower.includes('transport')) cat = 'Transportation';
    else if (lower.includes('entertain')) cat = 'Entertainment';
    else if (lower.includes('shop')) cat = 'Shopping';
    else if (lower.includes('utilit')) cat = 'Utilities';
    else if (lower.includes('hous') || lower.includes('rent')) cat = 'Housing';

    const { result, proposalCreated } = executeTool('create_or_update_budget', {
      category: cat,
      limit: amount,
      reason: prompt,
      confirmed: false,
    });

    toolTraces.push({
      toolName: 'create_or_update_budget',
      arguments: { category: cat, limit: amount, confirmed: false },
      result: (result.proposal || result.data || {}) as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });

    if (result.requiresConfirmation && proposalCreated) {
      const reply =
        `Consequential Budget Change Proposed:\n` +
        `• Category: ${cat}\n` +
        `• Proposed Monthly Limit: $${amount.toLocaleString()}\n` +
        `• Impact Analysis: ${proposalCreated.impactAnalysis}\n\n` +
        `Please confirm to commit this change to your financial plan.`;

      financeStore.addActionLog({
        userPrompt: prompt,
        actionType: 'proposal_created',
        summary: `Generated proposal ${proposalCreated.id}: ${proposalCreated.title}. Awaiting user approval.`,
        details: { proposal: proposalCreated, toolCalls: toolTraces },
        status: 'awaiting_confirmation',
        aiModel: 'finpilot-deterministic-engine (Demo Mode)',
        toolCalls: toolTraces,
      });

      return {
        reply,
        actionExecuted: 'create_or_update_budget',
        toolCalls: toolTraces,
        pendingProposal: proposalCreated,
        providerStatus,
      };
    }
  }

  // 5. Create savings plan: e.g. "create savings goal New Car target 6000 by 2027-05-01"
  if (
    (lower.includes('saving') || lower.includes('goal')) &&
    (lower.includes('create') || lower.includes('plan') || lower.includes('target') || lower.includes('new goal'))
  ) {
    const targetAmt = amount || 3000;
    const dateMatch = prompt.match(/\d{4}-\d{2}-\d{2}/);
    const deadline = dateMatch ? dateMatch[0] : '2027-06-30';

    let goalName = 'Special Savings Goal';
    const nameMatch = prompt.match(/(?:for|named|goal:?)\s+([A-Za-z0-9\s'&]+?)(?:\s+(?:target|by|due|of))/i);
    if (nameMatch && nameMatch[1]) {
      goalName = nameMatch[1].trim();
    }

    const { result, proposalCreated } = executeTool('create_savings_plan', {
      goalName,
      targetAmount: targetAmt,
      deadline,
      confirmed: false,
    });

    toolTraces.push({
      toolName: 'create_savings_plan',
      arguments: { goalName, targetAmount: targetAmt, deadline, confirmed: false },
      result: (result.proposal || result.data || { error: result.error }) as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });

    if (!result.success) {
      return {
        reply: `Savings Plan Assessment: ${result.error}\nSafe Alternative: ${result.safeAlternative || 'Adjust your target date or amount.'}`,
        actionExecuted: 'create_savings_plan',
        toolCalls: toolTraces,
        providerStatus,
      };
    }

    if (result.requiresConfirmation && proposalCreated) {
      const reply =
        `Savings Plan Proposed:\n` +
        `• Goal: "${goalName}"\n` +
        `• Target: $${targetAmt.toLocaleString()} by ${deadline}\n` +
        `• Assessment: ${proposalCreated.impactAnalysis}\n\n` +
        `Please confirm to activate this savings plan.`;

      financeStore.addActionLog({
        userPrompt: prompt,
        actionType: 'proposal_created',
        summary: `Generated proposal ${proposalCreated.id}: ${proposalCreated.title}. Awaiting user approval.`,
        details: { proposal: proposalCreated, toolCalls: toolTraces },
        status: 'awaiting_confirmation',
        aiModel: 'finpilot-deterministic-engine (Demo Mode)',
        toolCalls: toolTraces,
      });

      return {
        reply,
        actionExecuted: 'create_savings_plan',
        toolCalls: toolTraces,
        pendingProposal: proposalCreated,
        providerStatus,
      };
    }
  }

  // 6. Create bill reminder: e.g. "add bill reminder Gym Membership 85 due 2026-11-05"
  if (lower.includes('reminder') || lower.includes('add bill') || lower.includes('schedule bill')) {
    const billAmt = amount || 50;
    const dateMatch = prompt.match(/\d{4}-\d{2}-\d{2}/);
    const dueDate = dateMatch ? dateMatch[0] : '2026-11-15';

    let billName = 'Recurring Service';
    const nameMatch = prompt.match(/(?:for|named|bill:?)\s+([A-Za-z0-9\s'&]+?)(?:\s+(?:\$|\d+|due))/i);
    if (nameMatch && nameMatch[1]) {
      billName = nameMatch[1].trim();
    }

    const { result, proposalCreated } = executeTool('create_bill_reminder', {
      name: billName,
      amount: billAmt,
      dueDate,
      category: 'Utilities',
      isAutoPay: lower.includes('autopay'),
      confirmed: false,
    });

    toolTraces.push({
      toolName: 'create_bill_reminder',
      arguments: { name: billName, amount: billAmt, dueDate, confirmed: false },
      result: (result.proposal || result.data || {}) as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });

    if (result.requiresConfirmation && proposalCreated) {
      const reply =
        `Bill Reminder Proposed:\n` +
        `• Service: "${billName}"\n` +
        `• Amount: $${billAmt.toFixed(2)} due on ${dueDate}\n` +
        `• Impact: ${proposalCreated.impactAnalysis}\n\n` +
        `Please confirm to schedule this reminder.`;

      financeStore.addActionLog({
        userPrompt: prompt,
        actionType: 'proposal_created',
        summary: `Generated proposal ${proposalCreated.id}: ${proposalCreated.title}. Awaiting user approval.`,
        details: { proposal: proposalCreated, toolCalls: toolTraces },
        status: 'awaiting_confirmation',
        aiModel: 'finpilot-deterministic-engine (Demo Mode)',
        toolCalls: toolTraces,
      });

      return {
        reply,
        actionExecuted: 'create_bill_reminder',
        toolCalls: toolTraces,
        pendingProposal: proposalCreated,
        providerStatus,
      };
    }
  }

  // 7. Verify financial plan / stress test: e.g. "verify my plan", "can i afford", "stress test"
  if (
    lower.includes('verify') ||
    lower.includes('stress test') ||
    lower.includes('can i afford') ||
    lower.includes('is my plan safe')
  ) {
    const { result } = executeTool('verify_financial_plan', {
      proposedMonthlySavings: 200,
      proposedExpense: amount || 0,
    });

    toolTraces.push({
      toolName: 'verify_financial_plan',
      arguments: { proposedMonthlySavings: 200, proposedExpense: amount || 0 },
      result: (result.data || {}) as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });

    interface PlanVerificationData {
      safetyScore: number;
      isViable: boolean;
      projectedMonthlySurplus: number;
      liquidityBuffer: number;
      risks: string[];
      recommendations: string[];
    }
    const data = result.data as PlanVerificationData;
    const reply =
      `Financial Plan Stress Test Results:\n` +
      `• Safety Score: ${data.safetyScore}/100 (${data.isViable ? 'Plan is Viable' : 'Risk Warning'})\n` +
      `• Projected Net Monthly Surplus: $${data.projectedMonthlySurplus.toFixed(2)}\n` +
      `• Liquidity Buffer after Bills: $${data.liquidityBuffer.toFixed(2)}\n\n` +
      (data.risks.length > 0 ? `Identified Risks:\n${data.risks.map((r: string) => `• ${r}`).join('\n')}\n\n` : '') +
      `Recommendations:\n${data.recommendations.map((r: string) => `• ${r}`).join('\n')}`;

    financeStore.addActionLog({
      userPrompt: prompt,
      actionType: 'verify_financial_plan',
      summary: `Stress-tested financial plan (Score: ${data.safetyScore}/100, Viable: ${data.isViable}).`,
      details: { toolCalls: toolTraces },
      status: data.isViable ? 'success' : 'failed',
      aiModel: 'finpilot-deterministic-engine (Demo Mode)',
      toolCalls: toolTraces,
      verificationResult: { verified: true, message: `Score: ${data.safetyScore}/100` },
    });

    return {
      reply,
      actionExecuted: 'verify_financial_plan',
      toolCalls: toolTraces,
      providerStatus,
    };
  }

  // Default fallback: calculate monthly spending
  const { result } = executeTool('calculate_monthly_spending', { byCategory: false });
  toolTraces.push({
    toolName: 'calculate_monthly_spending',
    arguments: { byCategory: false },
    result: (result.data || {}) as Record<string, unknown>,
    timestamp: new Date().toISOString(),
  });

  const state = financeStore.getState();
  const reply =
    `FinPilot AI Portfolio Status:\n` +
    `• Liquid Reserves: $${state.summary.totalBalance.toLocaleString()}\n` +
    `• Monthly Inflow: $${state.summary.monthlyIncome.toLocaleString()} | Outflow: $${state.summary.monthlyExpenses.toLocaleString()}\n` +
    `• Net Cash Flow: +$${state.summary.netCashFlow.toLocaleString()} (${state.summary.savingsRate}% savings rate)\n` +
    `• Active Budgets: ${state.budgets.length} | Upcoming Bills: ${state.upcomingBills.filter((b) => b.status === 'upcoming').length}\n\n` +
    `You can ask me to inspect transactions, calculate spending breakdown, check upcoming bills, modify budgets, schedule bill reminders, or stress-test your plan.`;

  return {
    reply,
    actionExecuted: 'financial_query',
    toolCalls: toolTraces,
    providerStatus,
  };
}
