import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { financeStore } from './server/financeStore.js';
import { proposalStore } from './server/proposalStore.js';
import { processFinancialAgentRequest, getAIProviderStatus } from './server/aiService.js';
import { autonomousWorkflowEngine } from './server/autonomousWorkflow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Helper to return full financial state including pending proposals
  const getFullState = () => ({
    ...financeStore.getState(),
    pendingProposals: proposalStore.getAllPending(),
  });

  // API Routes
  // 0. Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Get full state
  app.get('/api/finances', (_req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.json(getFullState());
    } catch (err: unknown) {
      console.error('Error fetching financial state:', err);
      res.status(500).setHeader('Content-Type', 'application/json').json({
        error: 'Failed to retrieve financial state',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 2. Reset demo data
  app.post('/api/finances/reset', (_req: Request, res: Response) => {
    try {
      financeStore.resetState();
      res.setHeader('Content-Type', 'application/json');
      res.json({ message: 'Financial state reset to defaults', state: getFullState() });
    } catch (err: unknown) {
      console.error('Error resetting financial state:', err);
      res.status(500).setHeader('Content-Type', 'application/json').json({
        error: 'Failed to reset financial state',
      });
    }
  });

  // 3. Transactions
  app.post('/api/transactions', (req: Request, res: Response) => {
    try {
      const { date, description, amount, type, category, account, status } = req.body;
      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        res.status(400).json({ error: 'Transaction description cannot be empty' });
        return;
      }
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Transaction amount must be a positive number greater than 0' });
        return;
      }
      if (!type || !['income', 'expense', 'transfer'].includes(type)) {
        res.status(400).json({ error: "Transaction type must be 'income', 'expense', or 'transfer'" });
        return;
      }
      if (!category) {
        res.status(400).json({ error: 'Transaction category is required' });
        return;
      }
      const tx = financeStore.addTransaction({
        date: date || new Date().toISOString().split('T')[0],
        description: description.trim(),
        amount: numAmount,
        type,
        category,
        account: account || 'Checking',
        status: status || 'completed',
        source: 'manual',
      });
      res.status(201).json({ transaction: tx, state: getFullState() });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid transaction input' });
    }
  });

  app.put('/api/transactions/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = financeStore.updateTransaction(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      res.json({ transaction: updated, state: getFullState() });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid transaction update' });
    }
  });

  app.delete('/api/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const success = financeStore.deleteTransaction(id);
    if (!success) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json({ success: true, state: getFullState() });
  });

  // 4. Budgets
  app.post('/api/budgets', (req: Request, res: Response) => {
    try {
      const { category, limit, color } = req.body;
      if (!category) {
        res.status(400).json({ error: 'Category is required' });
        return;
      }
      const numLimit = Number(limit);
      if (isNaN(numLimit) || numLimit <= 0) {
        res.status(400).json({ error: 'Budget limit must be a positive number greater than 0' });
        return;
      }
      const budget = financeStore.createOrUpdateBudget({
        category,
        limit: numLimit,
        color,
      });
      res.status(201).json({ budget, state: getFullState() });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid budget input' });
    }
  });

  app.delete('/api/budgets/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const success = financeStore.deleteBudget(id);
    if (!success) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    res.json({ success: true, state: getFullState() });
  });

  // 5. Savings Goals
  app.post('/api/savings-goals', (req: Request, res: Response) => {
    try {
      const { name, targetAmount, currentAmount, deadline, category, color } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Savings goal name cannot be empty' });
        return;
      }
      const numTarget = Number(targetAmount);
      if (isNaN(numTarget) || numTarget <= 0) {
        res.status(400).json({ error: 'Target amount must be a positive number greater than 0' });
        return;
      }
      if (currentAmount !== undefined) {
        const numCurrent = Number(currentAmount);
        if (isNaN(numCurrent) || numCurrent < 0) {
          res.status(400).json({ error: 'Starting amount cannot be negative' });
          return;
        }
      }
      if (!deadline || isNaN(new Date(deadline).getTime())) {
        res.status(400).json({ error: 'Valid deadline date is required (YYYY-MM-DD)' });
        return;
      }
      const goal = financeStore.createSavingsGoal({
        name: name.trim(),
        targetAmount: numTarget,
        currentAmount: Number(currentAmount) || 0,
        deadline,
        category,
        color,
      });
      res.status(201).json({ goal, state: getFullState() });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid savings goal input' });
    }
  });

  app.post('/api/savings-goals/:id/contribute', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'A positive contribution amount is required' });
        return;
      }
      const result = financeStore.contributeToSavingsGoal(id, numAmount);
      if (!result) {
        res.status(404).json({ error: 'Savings goal not found' });
        return;
      }
      res.json({ ...result, state: getFullState() });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to contribute to savings goal' });
    }
  });

  app.delete('/api/savings-goals/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const success = financeStore.deleteSavingsGoal(id);
    if (!success) {
      res.status(404).json({ error: 'Savings goal not found' });
      return;
    }
    res.json({ success: true, state: getFullState() });
  });

  // 6. Bills
  app.post('/api/bills', (req: Request, res: Response) => {
    try {
      const { name, amount, dueDate, category, isAutoPay, isEssential } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Bill name cannot be empty' });
        return;
      }
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Bill amount must be a positive number greater than 0' });
        return;
      }
      if (!dueDate || isNaN(new Date(dueDate).getTime())) {
        res.status(400).json({ error: 'Valid due date is required (YYYY-MM-DD)' });
        return;
      }
      const bill = financeStore.createBill({
        name: name.trim(),
        amount: numAmount,
        dueDate,
        category,
        isAutoPay: !!isAutoPay,
        isEssential: !!isEssential,
      });
      res.status(201).json({ bill, state: getFullState() });
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid bill input' });
    }
  });

  app.post('/api/bills/:id/pay', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = financeStore.payBill(id);
      res.json({ ...result, state: getFullState() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to pay bill';
      if (msg.includes('does not exist')) {
        res.status(404).json({ error: msg });
      } else {
        res.status(400).json({ error: msg });
      }
    }
  });

  // 7. AI Provider Status
  app.get('/api/ai/provider-status', (_req: Request, res: Response) => {
    res.json(getAIProviderStatus());
  });

  // 8. AI Proposals (Approval & Rejection)
  app.get('/api/ai/proposals', (_req: Request, res: Response) => {
    res.json(proposalStore.getAllPending());
  });

  app.post('/api/ai/proposals/:id/approve', async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await proposalStore.executeApprovedProposal(id);
    if (!result.success) {
      res.status(400).json({ error: result.error, proposal: result.proposal, state: getFullState() });
      return;
    }
    res.json({ ...result, state: getFullState() });
  });

  app.post('/api/ai/proposals/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const result = proposalStore.rejectProposal(id, reason);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Proposal not found', state: getFullState() });
      return;
    }
    res.json({ ...result, state: getFullState() });
  });

  // 9. AI Assistant Chat
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt string is required' });
      return;
    }

    try {
      const response = await processFinancialAgentRequest(prompt);
      res.json({
        ...response,
        state: getFullState(),
      });
    } catch (err: unknown) {
      console.error('Error processing AI financial request:', err);
      res.status(500).json({
        error: 'Failed to process AI request',
        reply: "I encountered an error analyzing your request. Please try again.",
        state: getFullState(),
      });
    }
  });

  // 10. Action History
  app.get('/api/action-history', (_req: Request, res: Response) => {
    res.json(financeStore.getState().actionHistory);
  });

  // 11. Autonomous Workflow: Plan -> Act -> Verify -> Recover
  app.post('/api/workflow/start', (req: Request, res: Response) => {
    const { scenarioName, currency, startingAvailableAmount, targetSavingsAmount, forceInfeasible } = req.body;
    const workflow = autonomousWorkflowEngine.createWorkflow({
      scenarioName,
      currency,
      startingAvailableAmount,
      targetSavingsAmount,
      forceInfeasible,
    });
    res.json({ workflow, state: getFullState() });
  });

  app.get('/api/workflow/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const workflow = autonomousWorkflowEngine.getWorkflow(id);
    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }
    res.json({ workflow });
  });

  app.post('/api/workflow/:id/approve', (req: Request, res: Response) => {
    const { id } = req.params;
    const result = autonomousWorkflowEngine.executeApproval(id);
    if (!result.success) {
      res.status(400).json({ error: result.error, workflow: result.workflow, state: getFullState() });
      return;
    }
    res.json({ workflow: result.workflow, state: getFullState() });
  });

  app.post('/api/workflow/:id/rollback', (req: Request, res: Response) => {
    const { id } = req.params;
    const result = autonomousWorkflowEngine.rollbackWorkflow(id);
    if (!result.success) {
      res.status(400).json({ error: result.error, workflow: result.workflow, state: getFullState() });
      return;
    }
    res.json({ workflow: result.workflow, state: getFullState() });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const portNumber = Number(PORT) || 3000;
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`FinPilot AI server running on http://0.0.0.0:${portNumber}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
