import React from 'react';
import {
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  X,
  FileCheck2,
  ArrowRight,
  Calculator,
  Lock,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { NavTab } from './Sidebar.js';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: NavTab) => void;
  onResetData: () => void;
  currency: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onResetData,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-indigo-500/30 bg-[#0D1220] shadow-2xl overflow-hidden my-8">
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-indigo-900/80 via-[#131B32] to-purple-900/80 p-6 border-b border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white tracking-tight">FinPilot AI</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    FinTech 2026 Demo Guide
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Autonomous Financial Agent · Plan → Act → Verify → Recover
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-300 text-sm">
          {/* Quick Summary Pill */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1.5">
              <BookOpen className="h-4 w-4" />
              <span>Executive Brief</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional personal finance apps only categorize expenses in hindsight. <strong>FinPilot AI</strong> is an autonomous copilot that orchestrates proactive budgeting and goal accumulation while guaranteeing that essential obligations are never compromised.
            </p>
          </div>

          {/* Core Feature Flow */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Autonomous Loop: 4-Stage Operational Model
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Calculator className="h-4 w-4" />
                  <span>1. PLAN (Deterministic Ledger Audit)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Queries actual ledger balances and upcoming bills. Performs strict deterministic arithmetic—never relying on LLM guesses for money calculations.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Lock className="h-4 w-4" />
                  <span>2. ACT (Human-in-the-Loop Gate)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Consequential mutations (budget reallocations, automated savings sweeps) generate a structured proposal requiring explicit user approval before commit.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <FileCheck2 className="h-4 w-4" />
                  <span>3. VERIFY (Independent Proof)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Re-queries the persistent storage to mathematically confirm the post-action balances and goal targets match the forecasted model.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <RotateCcw className="h-4 w-4" />
                  <span>4. RECOVER (Undo & Feasibility Guard)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Maintains an immutable pre-execution snapshot. Infeasible plans are rejected early with safe counter-proposals, and approved plans can be reverted in one click.
                </p>
              </div>
            </div>
          </div>

          {/* Sample Hackathon User Scenario */}
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-b from-[#11172A] to-[#0D1220] p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-400" />
                <span>Featured Hackathon Scenario</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                Persona: Alex Vance
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px]">
                <p><span className="text-slate-400">Context:</span> {currency}20,000 remaining liquidity for the current month.</p>
                <p><span className="text-slate-400">Target Goal:</span> Save {currency}5,000 for emergency accelerator.</p>
                <p><span className="text-slate-400">Essential Bills:</span> {currency}7,550 committed (Electricity, Rent, Internet).</p>
                <p><span className="text-slate-400">Discretionary Net:</span> {currency}7,450 remaining buffer for Dining & Shopping.</p>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Watch the autonomous engine execute 6 distinct steps, explain why Dining and Shopping were dialed back by 15%, hold the human-in-the-loop authorization gate, and prove post-commit ledger truth.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('workflow');
                }}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Open Autonomous Workflow</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('agent');
                }}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Test 7 Tools in Agent Chat</span>
              </button>

              <button
                onClick={() => {
                  onResetData();
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all ml-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Demo State</span>
              </button>
            </div>
          </div>

          {/* Safety & Compliance Notice */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 flex items-start gap-3 text-xs text-amber-200/90">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">
                FinTech 2026 Safety & Simulation Notice
              </p>
              <p className="text-[11px] text-amber-200/70 leading-relaxed">
                All accounts, balances, credit limits, transactions, and bills shown within FinPilot AI are simulated fictional demo entities. No real banking credentials or production funds are ever moved. All operations are sandboxed with 100% reversible snapshots.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#0A0E1A] px-6 py-4">
          <div className="text-[11px] text-slate-500">
            FinPilot AI v2.4 · Deterministic Function-Calling Engine
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-sm"
          >
            Got It, Let&apos;s Explore!
          </button>
        </div>
      </div>
    </div>
  );
};
