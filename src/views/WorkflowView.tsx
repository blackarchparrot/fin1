import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Code2,
  ArrowRight,
  Check,
  X,
  FileCheck2,
  Lock,
  Layers,
  HelpCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  AutonomousWorkflowState,
  WorkflowStep,
  PlanRationaleItem,
  FinanceDataState
} from '../types/finance.js';
import { safeFetchJson } from '../utils/apiSafe.js';

interface WorkflowViewProps {
  financeState: FinanceDataState;
  currency: string;
  onRefreshState: () => Promise<void>;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  financeState,
  currency,
  onRefreshState,
}) => {
  const [workflow, setWorkflow] = useState<AutonomousWorkflowState | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [customStarting, setCustomStarting] = useState('20000');
  const [customSavings, setCustomSavings] = useState('5000');
  const [showCustomConfig, setShowCustomConfig] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or load default scenario on mount
  useEffect(() => {
    handleStartWorkflow(false);
  }, []);

  const handleStartWorkflow = async (forceInfeasible: boolean) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const startingAmt = parseFloat(customStarting) || 20000;
      const savingsAmt = forceInfeasible ? 15000 : (parseFloat(customSavings) || 5000);

      const res = await safeFetchJson<{ workflow: AutonomousWorkflowState }>('/api/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          startingAvailableAmount: startingAmt,
          targetSavingsAmount: savingsAmt,
          forceInfeasible,
          scenarioName: forceInfeasible
            ? `Stress Test: ${currency}${startingAmt.toLocaleString()} Remaining · Save ${currency}${savingsAmt.toLocaleString()} (Infeasible Demo)`
            : `Demo Scenario: ${currency}${startingAmt.toLocaleString()} Remaining · Save ${currency}${savingsAmt.toLocaleString()} (Feasible Plan)`,
        }),
      });

      if (!res.ok || !res.data) throw new Error(res.error || 'Failed to plan workflow');
      setWorkflow(res.data.workflow);
      await onRefreshState();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error starting workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!workflow) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const res = await safeFetchJson<{ workflow: AutonomousWorkflowState }>(`/api/workflow/${workflow.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Failed to execute workflow');
      }
      setWorkflow(res.data.workflow);
      await onRefreshState();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Execution error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!workflow) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const res = await safeFetchJson<{ workflow: AutonomousWorkflowState }>(`/api/workflow/${workflow.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Failed to rollback');
      }
      setWorkflow(res.data.workflow);
      await onRefreshState();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Rollback error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/70 via-[#0F1424] to-purple-950/50 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Autonomous Loop Architecture
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Plan → Act → Verify → Recover
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Self-directed financial orchestration: Audits ledger truth, verifies mathematical constraints, requests explicit authorization, executes approved mutations, and asserts post-commit integrity with full rollback support.
            </p>
          </div>

          {/* Quick Scenario Launchers */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleStartWorkflow(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Launch ৳20,000 → Save ৳5,000</span>
            </button>

            <button
              onClick={() => handleStartWorkflow(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Stress-Test Recovery Plan</span>
            </button>
          </div>
        </div>

        {/* Phase Progress Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            {[
              { id: 'plan', label: '1. PLAN', sub: 'Audit & Stress-Test', active: workflow?.phase === 'plan' || workflow?.phase === 'act' || workflow?.phase === 'completed' },
              { id: 'act', label: '2. ACT', sub: 'Approve & Execute', active: workflow?.phase === 'act' || workflow?.phase === 'completed' },
              { id: 'verify', label: '3. VERIFY', sub: 'Assert Ledger Proof', active: workflow?.phase === 'completed' },
              { id: 'recover', label: '4. RECOVER', sub: 'Contingency & Undo', active: workflow?.phase === 'recover' || workflow?.phase === 'rolled_back' || workflow?.canUndo },
            ].map((p) => (
              <div
                key={p.id}
                className={`rounded-xl p-2.5 border transition-all ${
                  p.active
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-white shadow-xs'
                    : 'border-slate-800/80 bg-slate-900/40 text-slate-500'
                }`}
              >
                <span className={`block font-extrabold text-[11px] ${p.active ? 'text-indigo-300' : 'text-slate-400'}`}>
                  {p.label}
                </span>
                <span className="text-[10px] text-slate-400">{p.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Undo Banner if active */}
      {workflow?.canUndo && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Execution Verified in Live Ledger. </span>
              <span className="text-slate-300">
                All category limits and the {currency}{workflow.targetSavingsAmount.toLocaleString()} savings sweep are committed. A pristine rollback snapshot is cached.
              </span>
            </div>
          </div>

          <button
            onClick={handleRollback}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-900/40 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs shrink-0 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{actionLoading ? 'Reverting...' : 'Undo Workflow (Restore Snapshot)'}</span>
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white text-xs underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {workflow?.phase === 'rolled_back' && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300 flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-indigo-400" />
          <span>Workflow changes successfully rolled back. Pre-workflow budgets and balances restored with 100% fidelity.</span>
        </div>
      )}

      {/* Main Execution Split: Real-time Timeline (Left 2 cols) vs Rationales & Approval (Right 1 col) */}
      {workflow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Activity Timeline (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    <span>Real-Time Autonomous Activity Timeline</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live execution stream with explicit tool calls, deterministic arithmetic, and verified proofs
                  </p>
                </div>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded">
                  {workflow.steps.filter((s) => s.status === 'completed').length} / {workflow.steps.length} Steps Completed
                </span>
              </div>

              {/* Step Items List */}
              <div className="mt-4 space-y-3.5">
                {workflow.steps.map((step) => {
                  const isExpanded = expandedStepId === step.id;
                  const isCompleted = step.status === 'completed';
                  const isFailed = step.status === 'failed';
                  const isInProgress = step.status === 'in_progress';

                  return (
                    <div
                      key={step.id}
                      className={`rounded-xl border transition-all ${
                        isCompleted
                          ? 'border-slate-800 bg-slate-900/50'
                          : isFailed
                          ? 'border-red-900/50 bg-red-950/20'
                          : isInProgress
                          ? 'border-indigo-500/50 bg-indigo-950/20 ring-1 ring-indigo-500/30'
                          : 'border-slate-800/60 bg-slate-900/20 opacity-60'
                      } p-4 space-y-2.5`}
                    >
                      {/* Step Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isFailed
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isInProgress
                                ? 'bg-indigo-500 text-white animate-pulse'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.stepNumber}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-white">{step.title}</h3>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                                Phase: {step.phase}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">{step.description}</p>
                          </div>
                        </div>

                        {/* Tool badge */}
                        {step.toolCalled && (
                          <span className="font-mono text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                            {step.toolCalled}
                          </span>
                        )}
                      </div>

                      {/* Action Rationale Callout */}
                      {step.actionRationale && (
                        <div className="rounded-lg bg-indigo-950/30 border border-indigo-500/20 p-2.5 text-[11px] text-slate-300 flex items-start gap-2">
                          <HelpCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-indigo-300">Why Selected: </span>
                            <span>{step.actionRationale}</span>
                          </div>
                        </div>
                      )}

                      {/* Verification Evidence Proof if present */}
                      {step.verificationEvidence && (
                        <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-2.5 text-[11px] text-emerald-300 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <FileCheck2 className="h-3.5 w-3.5" />
                            <span>Post-Execution Assertion Proof</span>
                          </div>
                          <p className="text-slate-300 font-mono text-[10px]">
                            Expected: {step.verificationEvidence.expected}
                          </p>
                          <p className="text-emerald-400 font-mono text-[10px]">
                            Actual: {step.verificationEvidence.actual}
                          </p>
                        </div>
                      )}

                      {/* Expandable Inputs & Calculations */}
                      {(step.inputs || step.calculationResult) && (
                        <div className="pt-1">
                          <button
                            onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-indigo-300"
                          >
                            <Code2 className="h-3 w-3" />
                            <span>{isExpanded ? 'Hide Technical Payloads' : 'Inspect Tool Inputs & Deterministic Calculation'}</span>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 rounded-lg bg-slate-950 p-2.5 text-[10px] font-mono border border-slate-800 space-y-2">
                              {step.inputs && (
                                <div>
                                  <span className="text-slate-500 block mb-0.5">// Inputs:</span>
                                  <pre className="text-indigo-300 overflow-x-auto">{JSON.stringify(step.inputs, null, 2)}</pre>
                                </div>
                              )}
                              {step.calculationResult && (
                                <div>
                                  <span className="text-slate-500 block mb-0.5">// Deterministic Output:</span>
                                  <pre className="text-emerald-400 overflow-x-auto">{JSON.stringify(step.calculationResult, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Authorization Card & Action Rationales */}
          <div className="space-y-4">
            {/* Interactive Approval Card (Active when in 'act' phase) */}
            {workflow.phase === 'act' && (
              <div className="rounded-xl border border-indigo-500/50 bg-[#0E1424] p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Action Authorization Card
                    </h3>
                  </div>
                  <span className="text-[10px] rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-mono">
                    Awaiting Approval
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Summary of Plan */}
                  <div className="rounded-lg bg-slate-900/80 p-3 space-y-2 border border-slate-800">
                    <div className="flex justify-between text-slate-300">
                      <span>Available Funds</span>
                      <span className="font-mono font-bold text-white">
                        {currency}{workflow.startingAvailableAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span>Essential Bills Ring-Fenced</span>
                      <span className="font-mono font-bold">
                        -{currency}{workflow.essentialBillsTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
                      <span>Target Savings Sweep</span>
                      <span className="font-mono">
                        +{currency}{workflow.targetSavingsAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-indigo-300 font-bold">
                      <span>Discretionary Buffer</span>
                      <span className="font-mono">
                        +{currency}{workflow.discretionaryBuffer.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Proposed Category Limits */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Proposed Budget Caps:
                    </span>
                    <div className="space-y-1.5">
                      {workflow.proposedChanges.budgetAdjustments.map((b) => (
                        <div key={b.category} className="flex justify-between text-[11px] rounded bg-slate-900 p-2 border border-slate-800/80">
                          <span className="text-slate-300">{b.category}</span>
                          <span className="font-mono text-white font-semibold">
                            {currency}{b.proposedLimit.toLocaleString()}/mo
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>{actionLoading ? 'Executing & Verifying...' : 'Authorize & Execute Plan'}</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-2">
                      Changes execute deterministically in ledger with 1-click rollback cached.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Infeasible Recovery Card (Active when in 'recover' phase) */}
            {workflow.phase === 'recover' && workflow.recoveryPlan && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-5 shadow-lg space-y-3.5">
                <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>Infeasibility Detected & Auto-Recovered</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {workflow.recoveryPlan.explanation}
                </p>

                <div className="rounded-lg bg-slate-900/90 p-3 border border-red-900/40 space-y-2 text-xs">
                  <span className="font-bold text-amber-300 block">Autonomous Recovery Plan:</span>
                  {workflow.recoveryPlan.suggestedAdjustments.map((adj, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="font-semibold text-white">• {adj.action}</p>
                      <p className="text-[11px] text-slate-400 pl-3">{adj.impact}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setCustomSavings(workflow.recoveryPlan!.revisedSavingsTarget.toString());
                    handleStartWorkflow(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Adopt Safe Plan ({currency}{workflow.recoveryPlan.revisedSavingsTarget.toLocaleString()} Savings)</span>
                </button>
              </div>
            )}

            {/* Explanation of Why the Agent Selected Each Action */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                <span>Decision Rationale & Alternatives</span>
              </h3>

              <div className="space-y-3 text-xs">
                {workflow.rationales.map((r, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-3 space-y-1.5">
                    <span className="font-bold text-indigo-300 block text-xs">{r.target}</span>
                    <p className="text-white text-[11px] font-medium">{r.chosenAction}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      <span className="text-slate-500 font-semibold">Rationale: </span>
                      {r.whySelected}
                    </p>
                    <p className="text-slate-500 text-[10px] border-t border-slate-800 pt-1 mt-1">
                      <span className="text-slate-400">Rejected Alternative: </span>
                      {r.alternativeConsidered}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
