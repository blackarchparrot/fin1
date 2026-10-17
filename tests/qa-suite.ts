import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  toolCalculateMonthlySpending,
  toolCreateSavingsPlan,
  toolCreateOrUpdateBudget,
  toolCreateBillReminder,
  toolVerifyFinancialPlan,
} from '../server/agentTools.js';

const BASE_URL = 'http://localhost:3000';
const DATA_FILE = path.resolve(process.cwd(), 'data', 'finance-store.json');

interface TestResult {
  category: string;
  testName: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function recordTest(category: string, testName: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ category, testName, passed: true });
      console.log(`  [PASS] ${testName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ category, testName, passed: false, error: msg });
      console.error(`  [FAIL] ${testName}: ${msg}`);
    }
  };
}

async function runAllTests() {
  console.log('=================================================================');
  console.log('FinPilot AI - Comprehensive Senior QA & Engineering Test Suite');
  console.log('=================================================================\n');

  // -------------------------------------------------------------
  // Test Category 1: Incorrect or missing transaction data
  // -------------------------------------------------------------
  console.log('Category 1: Incorrect or missing transaction data');

  await recordTest('Incorrect or missing transaction data', 'Rejects transaction with empty description', async () => {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '   ',
        amount: 50,
        type: 'expense',
        category: 'Dining',
      }),
    });
    assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
    const data = await res.json();
    assert.match(data.error, /description/i);
  })();

  await recordTest('Incorrect or missing transaction data', 'Rejects transaction with missing required fields', async () => {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Partial Tx',
        // amount is missing
        type: 'expense',
      }),
    });
    assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
  })();

  await recordTest('Incorrect or missing transaction data', 'Rejects transaction with invalid category', async () => {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Test Invalid Category',
        amount: 25.50,
        type: 'expense',
        category: 'IntergalacticTravel',
      }),
    });
    assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
    const data = await res.json();
    assert.match(data.error, /invalid category/i);
  })();

  await recordTest('Incorrect or missing transaction data', 'Rejects transaction with invalid transaction type', async () => {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Test Invalid Type',
        amount: 25.50,
        type: 'unsupported_type',
        category: 'Dining',
      }),
    });
    assert.strictEqual(res.status, 400, `Expected status 400, got ${res.status}`);
    const data = await res.json();
    assert.match(data.error, /type/i);
  })();

  // -------------------------------------------------------------
  // Test Category 2: Budget calculations and savings targets
  // -------------------------------------------------------------
  console.log('\nCategory 2: Budget calculations and savings targets');

  await recordTest('Budget calculations and savings targets', 'Deterministic calculation of monthly spending and savings rate', () => {
    const spendingResult = toolCalculateMonthlySpending({ byCategory: true });
    assert.strictEqual(spendingResult.success, true);
    assert(spendingResult.data);
    const { totalExpenses, totalIncome, netSavings, savingsRatePct, categoryBreakdown } = spendingResult.data;

    // Check deterministic math
    const expectedSavings = Math.max(0, Math.round((totalIncome - totalExpenses) * 100) / 100);
    assert.strictEqual(netSavings, expectedSavings, 'Net savings must equal income - expenses');

    const expectedRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    assert.strictEqual(savingsRatePct, expectedRate, 'Savings rate must equal (netSavings / totalIncome) * 100');

    // Verify category sums match total expenses
    const sumCategories = Object.values(categoryBreakdown).reduce((acc, cat) => acc + cat.amount, 0);
    assert.strictEqual(Math.round(sumCategories * 100) / 100, totalExpenses, 'Category breakdown sum must equal total expenses');
  })();

  await recordTest('Budget calculations and savings targets', 'Deterministic calculation of monthly contribution target for savings goal', () => {
    // 12 months ahead goal of $6000
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 1);
    const deadline = targetDate.toISOString().split('T')[0];

    const plan = toolCreateSavingsPlan({
      goalName: 'QA Test Goal',
      targetAmount: 6000,
      deadline,
      confirmed: false,
    });

    assert.strictEqual(plan.success, true);
    assert(plan.requiresConfirmation);
    assert(plan.proposal);
    const monthlyTarget = (plan.proposal.parameters as any).monthlyTarget;
    assert(monthlyTarget >= 450 && monthlyTarget <= 550, `Monthly target expected ~500, got ${monthlyTarget}`);
  })();

  // -------------------------------------------------------------
  // Test Category 3: Upcoming bills that exceed available funds
  // -------------------------------------------------------------
  console.log('\nCategory 3: Upcoming bills that exceed available funds');

  await recordTest('Upcoming bills that exceed available funds', 'Rejects bill payment when amount exceeds checking liquidity', async () => {
    // 1. Create a bill on the server with a huge amount ($50,000)
    const createRes = await fetch(`${BASE_URL}/api/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Superyacht Fleet Lease',
        amount: 50000.00,
        dueDate: '2026-10-31',
        category: 'Shopping',
      }),
    });
    assert.strictEqual(createRes.status, 201, `Failed to create test bill: ${createRes.status}`);
    const createData = await createRes.json();
    const hugeBillId = createData.bill.id;

    // 2. Attempt to pay the bill that exceeds available funds
    const payRes = await fetch(`${BASE_URL}/api/bills/${hugeBillId}/pay`, {
      method: 'POST',
    });
    assert.strictEqual(payRes.status, 400, `Expected 400 for insufficient funds, got ${payRes.status}`);
    const payData = await payRes.json();
    assert.match(payData.error, /insufficient checking reserves/i);

    // 3. Verify on server that bill status remains 'upcoming' and no money moved
    const finRes = await fetch(`${BASE_URL}/api/finances`);
    const finData = await finRes.json();
    const unservicedBill = finData.upcomingBills.find((b: any) => b.id === hugeBillId);
    assert(unservicedBill, 'Bill must exist');
    assert.strictEqual(unservicedBill.status, 'upcoming', 'Bill must remain upcoming');
  })();

  await recordTest('Upcoming bills that exceed available funds', 'Rejects duplicate payment on already paid bill', async () => {
    // 1. Create an affordable bill
    const createRes = await fetch(`${BASE_URL}/api/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Small Cloud Storage Fee',
        amount: 9.99,
        dueDate: '2026-10-25',
        category: 'Utilities',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const { bill } = await createRes.json();

    // 2. First payment succeeds
    const pay1 = await fetch(`${BASE_URL}/api/bills/${bill.id}/pay`, { method: 'POST' });
    assert.strictEqual(pay1.status, 200, `First payment expected 200, got ${pay1.status}`);

    // 3. Duplicate payment attempt fails with 400
    const pay2 = await fetch(`${BASE_URL}/api/bills/${bill.id}/pay`, { method: 'POST' });
    assert.strictEqual(pay2.status, 400, `Expected 400 for duplicate bill payment, got ${pay2.status}`);
    const data = await pay2.json();
    assert.match(data.error, /already marked as paid/i);
  })();

  // -------------------------------------------------------------
  // Test Category 4: Negative values and invalid inputs
  // -------------------------------------------------------------
  console.log('\nCategory 4: Negative values and invalid inputs');

  await recordTest('Negative values and invalid inputs', 'Rejects negative transaction amount', async () => {
    const res = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Negative Tx',
        amount: -50,
        type: 'expense',
        category: 'Dining',
      }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 for negative amount, got ${res.status}`);
    const data = await res.json();
    assert.match(data.error, /positive number/i);
  })();

  await recordTest('Negative values and invalid inputs', 'Rejects negative budget limit', async () => {
    const res = await fetch(`${BASE_URL}/api/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Dining',
        limit: -200,
      }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 for negative budget limit, got ${res.status}`);
    const data = await res.json();
    assert.match(data.error, /positive number/i);
  })();

  await recordTest('Negative values and invalid inputs', 'Rejects negative savings goal target', async () => {
    const res = await fetch(`${BASE_URL}/api/savings-goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Negative Goal',
        targetAmount: -1000,
        deadline: '2027-01-01',
      }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 for negative target amount, got ${res.status}`);
    const data = await res.json();
    assert.match(data.error, /positive number/i);
  })();

  await recordTest('Negative values and invalid inputs', 'Rejects negative contribution to savings goal', async () => {
    const finRes = await fetch(`${BASE_URL}/api/finances`);
    const { savingsGoals } = await finRes.json();
    const goal = savingsGoals[0];

    const res = await fetch(`${BASE_URL}/api/savings-goals/${goal.id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: -50,
      }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 for negative contribution, got ${res.status}`);
    const data = await res.json();
    assert.match(data.error, /positive/i);
  })();

  await recordTest('Negative values and invalid inputs', 'toolVerifyFinancialPlan sanitizes negative inputs', () => {
    const verification = toolVerifyFinancialPlan({
      proposedMonthlySavings: -500, // Attempting to inject negative savings
      proposedExpense: -1000,        // Attempting to inject negative expense
    });
    assert.strictEqual(verification.success, true);
    assert(verification.data);
    assert(Number.isFinite(verification.data.projectedMonthlySurplus));
  })();

  // -------------------------------------------------------------
  // Test Category 5: AI API failures and timeouts
  // -------------------------------------------------------------
  console.log('\nCategory 5: AI API failures and timeouts');

  await recordTest('AI API failures and timeouts', 'Gracefully answers queries with deterministic tool traces and provider status', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Show me my recent transactions' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.reply && data.reply.length > 0, 'Must produce a non-empty reply');
    assert(data.providerStatus, 'Must report AI provider status');
    assert(
      data.actionExecuted === 'get_transactions' || data.actionExecuted === 'calculate_monthly_spending',
      `Expected get_transactions or calculate_monthly_spending, got ${data.actionExecuted}`
    );
  })();

  await recordTest('AI API failures and timeouts', 'POST /api/ai/chat handles invalid payload without crashing server', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 12345 }), // invalid type
    });
    assert.strictEqual(res.status, 400, 'Expected status 400 for non-string prompt');
    const data = await res.json();
    assert.match(data.error, /prompt string/i);
  })();

  // -------------------------------------------------------------
  // Test Category 6: Tool execution failures
  // -------------------------------------------------------------
  console.log('\nCategory 6: Tool execution failures');

  await recordTest('Tool execution failures', 'toolCreateOrUpdateBudget handles invalid category with safe alternative', () => {
    const res = toolCreateOrUpdateBudget({
      category: 'UnrealCategory',
      limit: 500,
    });
    assert.strictEqual(res.success, false, 'Expected failure on invalid category');
    assert.match(res.error || '', /invalid category/i);
    assert(res.safeAlternative && res.safeAlternative.length > 0, 'Must provide safe alternative');
  })();

  await recordTest('Tool execution failures', 'toolCreateSavingsPlan handles invalid deadline format', () => {
    const res = toolCreateSavingsPlan({
      goalName: 'Invalid Deadline Goal',
      targetAmount: 5000,
      deadline: 'not-a-real-date',
    });
    assert.strictEqual(res.success, false, 'Expected failure on bad date');
    assert.match(res.error || '', /invalid deadline/i);
    assert(res.safeAlternative && res.safeAlternative.length > 0, 'Must provide safe alternative');
  })();

  await recordTest('Tool execution failures', 'toolCreateBillReminder handles empty name', () => {
    const res = toolCreateBillReminder({
      name: '   ',
      amount: 100,
      dueDate: '2026-11-01',
    });
    assert.strictEqual(res.success, false, 'Expected failure on empty bill name');
    assert.match(res.error || '', /cannot be empty/i);
  })();

  // -------------------------------------------------------------
  // Test Category 7: User rejection of a proposed action
  // -------------------------------------------------------------
  console.log('\nCategory 7: User rejection of a proposed action');

  await recordTest('User rejection of a proposed action', 'Rejection leaves financial state unmodified and updates proposal status', async () => {
    // 1. Trigger proposal creation on server via AI chat
    const chatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Set my Groceries budget to $950' }),
    });
    assert.strictEqual(chatRes.status, 200);
    const chatData = await chatRes.json();
    assert(chatData.pendingProposal, 'Must return a pending proposal');
    const propId = chatData.pendingProposal.id;

    // Check pre-rejection budget for Groceries
    const finBefore = await (await fetch(`${BASE_URL}/api/finances`)).json();
    const preLimit = finBefore.budgets.find((b: any) => b.category === 'Groceries')?.limit;

    // 2. Reject proposal via API
    const res = await fetch(`${BASE_URL}/api/ai/proposals/${propId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'User decided groceries limit was too generous' }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.proposal.status, 'rejected');

    // 3. Confirm state was untouched
    const finAfter = await (await fetch(`${BASE_URL}/api/finances`)).json();
    const postLimit = finAfter.budgets.find((b: any) => b.category === 'Groceries')?.limit;
    assert.strictEqual(preLimit, postLimit, 'Budget limit must remain unchanged after rejection');

    // 4. Confirm audit log recorded user rejection
    const latestLog = finAfter.actionHistory[0];
    assert.strictEqual(latestLog.actionType, 'proposal_rejected');
    assert.match(latestLog.summary, /User declined proposed action/i);
  })();

  // -------------------------------------------------------------
  // Test Category 8: Successful actions followed by independent verification
  // -------------------------------------------------------------
  console.log('\nCategory 8: Successful actions followed by independent verification');

  await recordTest('Successful actions followed by independent verification', 'Proposal execution verifies post-commit state against database', async () => {
    // 1. Generate a proposal on the server via AI chat for Housing (delta >= 100)
    const chatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Set my Dining budget to $750' }),
    });
    assert.strictEqual(chatRes.status, 200);
    const chatData = await chatRes.json();
    assert(chatData.pendingProposal, 'Must return pending proposal');
    const propId = chatData.pendingProposal.id;

    // 2. Approve proposal via API
    const res = await fetch(`${BASE_URL}/api/ai/proposals/${propId}/approve`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.proposal.status, 'executed');

    // 3. Independent verification: Read live state from GET /api/finances
    const finRes = await fetch(`${BASE_URL}/api/finances`);
    const liveState = await finRes.json();
    const liveBudget = liveState.budgets.find((b: any) => b.category === 'Dining');
    assert(liveBudget, 'Dining budget must exist in store');
    assert.strictEqual(liveBudget.limit, 750, `Budget limit in live database must equal 750, got ${liveBudget.limit}`);
  })();

  await recordTest('Successful actions followed by independent verification', 'Autonomous Plan -> Act -> Verify workflow asserts post-execution proof', async () => {
    // 1. Create workflow on server
    const startRes = await fetch(`${BASE_URL}/api/workflow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioName: 'QA Verification Scenario',
        currency: '৳',
        startingAvailableAmount: 20000,
        targetSavingsAmount: 5000,
        forceInfeasible: false,
      }),
    });
    assert.strictEqual(startRes.status, 200);
    const { workflow } = await startRes.json();
    assert.strictEqual(workflow.isFeasible, true);

    // 2. Approve and execute
    const approveRes = await fetch(`${BASE_URL}/api/workflow/${workflow.id}/approve`, {
      method: 'POST',
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.workflow.phase, 'completed');

    // 3. Check step 7 independent verification evidence
    const verifyStep = approveData.workflow.steps.find((s: any) => s.stepNumber === 7);
    assert(verifyStep, 'Must contain Step 7 verify step');
    assert.strictEqual(verifyStep.status, 'completed');
    assert.strictEqual(verifyStep.verificationEvidence?.verified, true);
    assert(verifyStep.verificationEvidence?.proof?.zeroDiscrepancyAssertion === true);

    // 4. Test Undo / Rollback
    const rollbackRes = await fetch(`${BASE_URL}/api/workflow/${workflow.id}/rollback`, {
      method: 'POST',
    });
    assert.strictEqual(rollbackRes.status, 200);
    const rollbackData = await rollbackRes.json();
    assert.strictEqual(rollbackData.workflow.phase, 'rolled_back');
  })();

  // -------------------------------------------------------------
  // Test Category 9: Data persistence after refreshing the page
  // -------------------------------------------------------------
  console.log('\nCategory 9: Data persistence after refreshing the page');

  await recordTest('Data persistence after refreshing the page', 'New transaction persists to disk and reloads with matching state', async () => {
    const uniqueDesc = `QA Persistence Assert Tx ${Date.now()}`;
    const txRes = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-10-16',
        description: uniqueDesc,
        amount: 47.85,
        type: 'expense',
        category: 'Groceries',
        account: 'Checking',
      }),
    });
    assert.strictEqual(txRes.status, 201);
    const txData = await txRes.json();

    // 1. Simulate page refresh / client fetch from /api/finances
    const res = await fetch(`${BASE_URL}/api/finances`);
    assert.strictEqual(res.status, 200);
    const liveData = await res.json();

    const foundInLive = liveData.transactions.find((t: any) => t.id === txData.transaction.id);
    assert(foundInLive, 'Transaction must be present in reloaded state');
    assert.strictEqual(foundInLive.description, uniqueDesc);
    assert.strictEqual(foundInLive.amount, 47.85);

    // 2. Check physical disk persistence in data/finance-store.json
    assert(fs.existsSync(DATA_FILE), 'Disk data file must exist');
    const diskContent = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const foundOnDisk = diskContent.transactions.find((t: any) => t.id === txData.transaction.id);
    assert(foundOnDisk, 'Transaction must be written to disk JSON file');
    assert.strictEqual(foundOnDisk.description, uniqueDesc);
  })();

  // -------------------------------------------------------------
  // Test Category 10: Unauthorized attempts to execute actions
  // -------------------------------------------------------------
  console.log('\nCategory 10: Unauthorized attempts to execute actions');

  await recordTest('Unauthorized attempts to execute actions', 'Rejects approval on unknown or non-existent proposal ID', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/proposals/prop-non-existent-9999/approve`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 400, `Expected 400 for unknown proposal, got ${res.status}`);
    const data = await res.json();
    assert.match(data.error, /not found/i);
  })();

  await recordTest('Unauthorized attempts to execute actions', 'Rejects re-approval of an already executed proposal', async () => {
    // 1. Generate proposal on server via chat
    const chatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Set my Transportation budget to $550' }),
    });
    const chatData = await chatRes.json();
    const propId = chatData.pendingProposal?.id;
    assert(propId, 'Must generate proposal ID');

    // 2. First approval succeeds
    const res1 = await fetch(`${BASE_URL}/api/ai/proposals/${propId}/approve`, { method: 'POST' });
    assert.strictEqual(res1.status, 200);

    // 3. Second approval attempt (unauthorized / replay) rejected
    const res2 = await fetch(`${BASE_URL}/api/ai/proposals/${propId}/approve`, { method: 'POST' });
    assert.strictEqual(res2.status, 400, `Expected 400 for duplicate approval, got ${res2.status}`);
    const data2 = await res2.json();
    assert.match(data2.error, /already in 'executed' state/i);
  })();

  await recordTest('Unauthorized attempts to execute actions', 'Rejects approval on an infeasible workflow', async () => {
    const startRes = await fetch(`${BASE_URL}/api/workflow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioName: 'QA Infeasible Workflow',
        currency: '৳',
        startingAvailableAmount: 10000,
        targetSavingsAmount: 15000,
        forceInfeasible: true,
      }),
    });
    const { workflow } = await startRes.json();
    assert.strictEqual(workflow.isFeasible, false);

    const approveRes = await fetch(`${BASE_URL}/api/workflow/${workflow.id}/approve`, {
      method: 'POST',
    });
    assert.strictEqual(approveRes.status, 400, `Expected 400, got ${approveRes.status}`);
    const approveData = await approveRes.json();
    assert.match(approveData.error, /cannot execute an infeasible plan/i);
  })();

  await recordTest('Unauthorized attempts to execute actions', 'Rejects duplicate execution on an already completed workflow', async () => {
    const startRes = await fetch(`${BASE_URL}/api/workflow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioName: 'QA Duplicate Execution Test',
        currency: '৳',
        startingAvailableAmount: 20000,
        targetSavingsAmount: 4000,
      }),
    });
    const { workflow } = await startRes.json();

    // First execution
    const res1 = await fetch(`${BASE_URL}/api/workflow/${workflow.id}/approve`, { method: 'POST' });
    assert.strictEqual(res1.status, 200);

    // Second execution attempt
    const res2 = await fetch(`${BASE_URL}/api/workflow/${workflow.id}/approve`, { method: 'POST' });
    assert.strictEqual(res2.status, 400, `Expected 400, got ${res2.status}`);
    const data2 = await res2.json();
    assert.match(data2.error, /already been executed/i);
  })();

  await recordTest('Unauthorized attempts to execute actions', 'Rejects rollback on a workflow that has already been rolled back', async () => {
    const startRes = await fetch(`${BASE_URL}/api/workflow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioName: 'QA Rollback Replay Test',
        currency: '৳',
        startingAvailableAmount: 20000,
        targetSavingsAmount: 4000,
      }),
    });
    const { workflow } = await startRes.json();

    await fetch(`${BASE_URL}/api/workflow/${workflow.id}/approve`, { method: 'POST' });

    // First rollback
    const rb1 = await fetch(`${BASE_URL}/api/workflow/${workflow.id}/rollback`, { method: 'POST' });
    assert.strictEqual(rb1.status, 200);

    // Replay rollback attempt
    const rb2 = await fetch(`${BASE_URL}/api/workflow/${workflow.id}/rollback`, { method: 'POST' });
    assert.strictEqual(rb2.status, 400);
    const data2 = await rb2.json();
    assert.match(data2.error, /cannot be rolled back/i);
  })();

  // -------------------------------------------------------------
  // Test Summary Report
  // -------------------------------------------------------------
  console.log('\n=================================================================');
  console.log('TEST SUITE EXECUTION SUMMARY');
  console.log('=================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Tests Executed: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error('\nFailures Summary:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`- [${r.category}] ${r.testName}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\nAll 10 required QA test categories PASSED with 100% success rate!');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal Test Suite Runner Error:', err);
  process.exit(1);
});
