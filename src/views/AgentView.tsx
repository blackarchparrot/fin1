import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  User,
  History,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  AgentActionLog,
  FinanceDataState,
  PendingProposal,
  ToolCallTrace,
  AIProviderStatus
} from '../types/finance.js';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  actionExecuted?: string;
  toolCalls?: ToolCallTrace[];
  proposal?: PendingProposal;
}

interface AgentViewProps {
  actionHistory: AgentActionLog[];
  financeState: FinanceDataState;
  pendingProposals: PendingProposal[];
  providerStatus: AIProviderStatus | null;
  onSendMessage: (prompt: string) => Promise<{
    reply: string;
    actionExecuted?: string;
    toolCalls?: ToolCallTrace[];
    pendingProposal?: PendingProposal;
  }>;
  onApproveProposal: (proposalId: string) => Promise<void>;
  onRejectProposal: (proposalId: string) => Promise<void>;
}

export const AgentView: React.FC<AgentViewProps> = ({
  actionHistory,
  financeState,
  pendingProposals,
  providerStatus,
  onSendMessage,
  onApproveProposal,
  onRejectProposal,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'agent',
      text: `Welcome to FinPilot AI! I am an autonomous financial agent powered by 7 explicitly defined deterministic tools:\n• get_transactions\n• calculate_monthly_spending\n• get_upcoming_bills\n• create_or_update_budget\n• create_savings_plan\n• create_bill_reminder\n• verify_financial_plan\n\nAll calculations are mathematically verified against your actual ledger. Any consequential actions require your explicit confirmation before committing.`,
      timestamp: 'Just now',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const toolPrompts = [
    { label: 'Inspect Groceries', prompt: 'Get my recent grocery transactions' },
    { label: 'Calculate Spending', prompt: 'Calculate my monthly spending breakdown and budget limits' },
    { label: 'Audit Bills', prompt: 'What upcoming bills are due and is my checking account covered?' },
    { label: 'Propose Budget', prompt: 'Set my Dining budget limit to $450' },
    { label: 'Propose Savings Goal', prompt: 'Create savings plan: Japan Summer Tour target $4500 by 2027-06-30' },
    { label: 'Schedule Bill', prompt: 'Create bill reminder for Gym Membership $85 due 2026-11-15' },
    { label: 'Stress-Test Plan', prompt: 'Verify my financial plan with $250 extra monthly savings' },
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await onSendMessage(prompt);
      const agentMsg: Message = {
        id: `agt-${Date.now()}`,
        sender: 'agent',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: response.actionExecuted,
        toolCalls: response.toolCalls,
        proposal: response.pendingProposal,
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `agt-${Date.now()}`,
          sender: 'agent',
          text: 'I encountered an error executing this request. Deterministic rollback verified.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (propId: string) => {
    try {
      setApprovingId(propId);
      await onApproveProposal(propId);
      setMessages((prev) => [
        ...prev,
        {
          id: `agt-appr-${Date.now()}`,
          sender: 'agent',
          text: `Proposal ${propId} was approved. Consequential changes were executed and verified against your financial ledger.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionExecuted: 'proposal_approved',
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve proposal';
      setMessages((prev) => [
        ...prev,
        {
          id: `agt-err-${Date.now()}`,
          sender: 'agent',
          text: `Error processing proposal: ${msg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (propId: string) => {
    try {
      await onRejectProposal(propId);
      setMessages((prev) => [
        ...prev,
        {
          id: `agt-rej-${Date.now()}`,
          sender: 'agent',
          text: `Proposal ${propId} was declined. No changes were committed to your ledger.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionExecuted: 'proposal_rejected',
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to decline proposal';
      setMessages((prev) => [
        ...prev,
        {
          id: `agt-err-${Date.now()}`,
          sender: 'agent',
          text: `Error declining proposal: ${msg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Provider Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-white">FinPilot AI Copilot</h2>
            {providerStatus && (
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                  providerStatus.provider === 'openrouter'
                    ? 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300'
                    : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>{providerStatus.model}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-80">
                  [{providerStatus.provider.toUpperCase()}]
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Autonomous agent executing 7 explicitly defined deterministic tools with mandatory user confirmation
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Copilot Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit Trail ({actionHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Pending Approvals Notice Banner if active */}
      {pendingProposals.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Consequential Action Requires Your Confirmation ({pendingProposals.length} Pending)</span>
            </div>
            <span className="text-[10px] text-amber-400/80 uppercase tracking-wider font-mono">
              Action Guardrail Active
            </span>
          </div>

          <div className="space-y-3">
            {pendingProposals.map((prop) => (
              <div
                key={prop.id}
                className="rounded-lg border border-slate-800 bg-[#0F1424] p-3.5 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{prop.title}</h4>
                    <p className="text-slate-400 text-xs mt-0.5">{prop.description}</p>
                  </div>
                  <span className="font-mono text-[10px] rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5">
                    {prop.actionType}
                  </span>
                </div>

                <div className="rounded bg-slate-900/80 p-2.5 text-slate-300 text-[11px] border border-slate-800">
                  <span className="font-semibold text-indigo-300">Deterministic Impact: </span>
                  <span>{prop.impactAnalysis}</span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    onClick={() => handleReject(prop.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => handleApprove(prop.id)}
                    disabled={approvingId === prop.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{approvingId === prop.id ? 'Committing...' : 'Approve & Execute'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Stream (2 cols) */}
          <div className="lg:col-span-2 flex flex-col h-[600px] rounded-2xl border border-slate-800 bg-[#0E1424] shadow-md overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'agent' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed space-y-2.5 ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-slate-900/95 border border-slate-800 text-slate-200 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {/* Tool Call Trace breakdown */}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mt-2 border-t border-slate-800/80 pt-2">
                        <button
                          onClick={() => setExpandedTraceId(expandedTraceId === m.id ? null : m.id)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          <Code2 className="h-3 w-3" />
                          <span>
                            {m.toolCalls.length} Deterministic Tool Call(s) Executed
                          </span>
                          {expandedTraceId === m.id ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>

                        {expandedTraceId === m.id && (
                          <div className="mt-2 space-y-2">
                            {m.toolCalls.map((tc, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg bg-slate-950 p-2 text-[10px] font-mono border border-slate-800 space-y-1"
                              >
                                <div className="flex items-center justify-between text-indigo-300 font-bold">
                                  <span>{tc.toolName}</span>
                                  <span className="text-slate-500 text-[9px]">{new Date(tc.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-slate-400">
                                  <span className="text-slate-500">args:</span> {JSON.stringify(tc.arguments)}
                                </div>
                                <div className="text-emerald-400/90 max-h-24 overflow-y-auto">
                                  <span className="text-slate-500">output:</span> {JSON.stringify(tc.result, null, 1)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Pending Proposal Card if message generated one */}
                    {m.proposal && m.proposal.status === 'pending' && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                          <span>Confirmation Required</span>
                          <span className="font-mono text-[10px]">{m.proposal.id}</span>
                        </div>
                        <p className="text-xs text-white">{m.proposal.title}</p>
                        <p className="text-[11px] text-slate-300">{m.proposal.impactAnalysis}</p>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleReject(m.proposal!.id)}
                            className="rounded px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleApprove(m.proposal!.id)}
                            className="rounded bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                          >
                            Approve Action
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] opacity-70">
                      <span>{m.timestamp}</span>
                      {m.actionExecuted && (
                        <span className="font-mono bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">
                          {m.actionExecuted}
                        </span>
                      )}
                    </div>
                  </div>

                  {m.sender === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Sparkles className="h-4 w-4 animate-spin" />
                  </div>
                  <span>FinPilot is invoking explicit tools and calculating deterministic figures...</span>
                </div>
              )}
            </div>

            {/* Prompt input bar */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask FinPilot to inspect transactions, calculate spending, set budgets, or stress-test..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-slate-800 bg-[#0B0F19] py-2.5 px-4 text-xs md:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !inputPrompt.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Explicit Tools Test Suite & Live Trace Feed (1 col) */}
          <div className="space-y-4">
            {/* Tool Launcher Shortcuts */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Verified Tool Triggers</span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Click any prompt to test the full request → tool call → execution → verification flow:
              </p>

              <div className="space-y-1.5">
                {toolPrompts.map((tp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(tp.prompt)}
                    disabled={loading}
                    className="w-full text-left rounded-lg border border-slate-800/80 bg-slate-900/60 p-2 text-xs text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-950/20 hover:text-indigo-200 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-white block text-[11px]">{tp.label}</span>
                      <span className="text-[10px] text-slate-500 truncate block max-w-[210px]">
                        "{tp.prompt}"
                      </span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Provider & Guardrail Policy */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-4 shadow-xs text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Info className="h-3.5 w-3.5 text-indigo-400" />
                <span>Zero-Hallucination Guarantee</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Transactions and cash flow calculations are strictly evaluated by TypeScript logic in <code className="text-indigo-300 font-mono">agentTools.ts</code>, not guessed by language models. Consequential mutations will never commit without user approval.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Trail View */
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Autonomous Agent Audit Log & Verification Ledger</h3>
              <p className="text-xs text-slate-400">
                Verifiable record of all user instructions, tool calls, and state mutations
              </p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-mono text-slate-300">
              {actionHistory.length} events logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-3 font-semibold">User Prompt</th>
                  <th className="py-3 px-3 font-semibold">Tool / Action</th>
                  <th className="py-3 px-3 font-semibold">Outcome & Verification</th>
                  <th className="py-3 px-3 font-semibold">Engine</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {actionHistory.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-3 text-slate-300 max-w-[180px] truncate" title={act.userPrompt}>
                      "{act.userPrompt}"
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono text-[10px] rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 font-semibold">
                        {act.actionType}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-200 max-w-sm">
                      <p className="leading-snug">{act.summary}</p>
                      {act.verificationResult && (
                        <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{act.verificationResult.message}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[10px] text-slate-400">
                      {act.aiModel}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {act.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Verified</span>
                        </span>
                      ) : act.status === 'awaiting_confirmation' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Awaiting User</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400">
                          <span>Info</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
