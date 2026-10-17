import { PendingProposal } from '../src/types/finance.js';
import {
  toolCreateOrUpdateBudget,
  toolCreateSavingsPlan,
  toolCreateBillReminder,
  toolVerifyFinancialPlan,
} from './agentTools.js';
import { financeStore } from './financeStore.js';

class ProposalStore {
  private proposals: Map<string, PendingProposal> = new Map();

  addProposal(proposal: Omit<PendingProposal, 'timestamp' | 'status'>): PendingProposal {
    const fullProposal: PendingProposal = {
      ...proposal,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    this.proposals.set(fullProposal.id, fullProposal);
    return fullProposal;
  }

  getProposal(id: string): PendingProposal | undefined {
    return this.proposals.get(id);
  }

  getAllPending(): PendingProposal[] {
    return Array.from(this.proposals.values()).filter((p) => p.status === 'pending');
  }

  async executeApprovedProposal(id: string): Promise<{
    success: boolean;
    proposal: PendingProposal;
    result?: unknown;
    error?: string;
  }> {
    const proposal = this.proposals.get(id);
    if (!proposal) {
      return {
        success: false,
        proposal: {
          id,
          timestamp: new Date().toISOString(),
          actionType: 'create_or_update_budget',
          title: 'Unknown Proposal',
          description: '',
          impactAnalysis: '',
          proposedChanges: {},
          isConsequential: false,
          status: 'failed',
        },
        error: `Proposal with ID ${id} was not found or has expired.`,
      };
    }

    if (proposal.status !== 'pending') {
      return {
        success: false,
        proposal,
        error: `Proposal ${id} is already in '${proposal.status}' state.`,
      };
    }

    try {
      let executionResult: any;

      if (proposal.actionType === 'create_or_update_budget') {
        const params = proposal.proposedChanges as { category: string; limit: number; reason?: string };
        const res = toolCreateOrUpdateBudget({
          category: params.category,
          limit: params.limit,
          reason: params.reason,
          confirmed: true,
        });

        if (!res.success || !res.data) {
          proposal.status = 'failed';
          return { success: false, proposal, error: res.error || 'Execution failed' };
        }

        executionResult = res.data;
        proposal.status = 'executed';
        proposal.verificationDetails = res.data.message;

        financeStore.addActionLog({
          userPrompt: `Approved Proposal: ${proposal.title}`,
          actionType: 'create_or_update_budget',
          summary: res.data.message,
          details: { proposal, executionResult: res.data },
          status: 'success',
          aiModel: 'finpilot-deterministic-engine',
          verificationResult: {
            verified: res.data.verified,
            message: res.data.message,
          },
        });
      } else if (proposal.actionType === 'create_savings_plan') {
        const params = proposal.proposedChanges as {
          goalName: string;
          targetAmount: number;
          deadline: string;
          category?: string;
        };
        const res = toolCreateSavingsPlan({
          goalName: params.goalName,
          targetAmount: params.targetAmount,
          deadline: params.deadline,
          category: params.category,
          confirmed: true,
        });

        if (!res.success || !res.data) {
          proposal.status = 'failed';
          return { success: false, proposal, error: res.error || 'Execution failed' };
        }

        executionResult = res.data;
        proposal.status = 'executed';
        proposal.verificationDetails = res.data.message;

        financeStore.addActionLog({
          userPrompt: `Approved Proposal: ${proposal.title}`,
          actionType: 'create_savings_plan',
          summary: res.data.message,
          details: { proposal, executionResult: res.data },
          status: 'success',
          aiModel: 'finpilot-deterministic-engine',
          verificationResult: {
            verified: res.data.verified,
            message: res.data.message,
          },
        });
      } else if (proposal.actionType === 'create_bill_reminder') {
        const params = proposal.proposedChanges as {
          name: string;
          amount: number;
          dueDate: string;
          category?: string;
          isAutoPay?: boolean;
        };
        const res = toolCreateBillReminder({
          name: params.name,
          amount: params.amount,
          dueDate: params.dueDate,
          category: params.category,
          isAutoPay: params.isAutoPay,
          confirmed: true,
        });

        if (!res.success || !res.data) {
          proposal.status = 'failed';
          return { success: false, proposal, error: res.error || 'Execution failed' };
        }

        executionResult = res.data;
        proposal.status = 'executed';
        proposal.verificationDetails = res.data.message;

        financeStore.addActionLog({
          userPrompt: `Approved Proposal: ${proposal.title}`,
          actionType: 'create_bill_reminder',
          summary: res.data.message,
          details: { proposal, executionResult: res.data },
          status: 'success',
          aiModel: 'finpilot-deterministic-engine',
          verificationResult: {
            verified: res.data.verified,
            message: res.data.message,
          },
        });
      } else {
        return { success: false, proposal, error: `Unsupported proposal action: ${proposal.actionType}` };
      }

      return {
        success: true,
        proposal,
        result: executionResult,
      };
    } catch (err: unknown) {
      proposal.status = 'failed';
      return {
        success: false,
        proposal,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  rejectProposal(id: string, reason?: string): { success: boolean; proposal?: PendingProposal; error?: string } {
    const proposal = this.proposals.get(id);
    if (!proposal) return { success: false, error: 'Proposal not found' };

    if (proposal.status !== 'pending') {
      return { success: false, proposal, error: `Proposal ${id} is already in '${proposal.status}' state.` };
    }

    proposal.status = 'rejected';
    financeStore.addActionLog({
      userPrompt: `Declined Proposal: ${proposal.title}`,
      actionType: 'proposal_rejected',
      summary: `User declined proposed action "${proposal.title}". No financial state was modified. Reason: ${reason || 'User cancelled'}.`,
      details: { proposal, reason },
      status: 'info',
      aiModel: 'finpilot-deterministic-engine',
    });

    return { success: true, proposal };
  }
}

export const proposalStore = new ProposalStore();
