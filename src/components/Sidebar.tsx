import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Target,
  Sparkles,
  CalendarClock,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  X,
  Layers,
  BookOpen
} from 'lucide-react';

export type NavTab = 'overview' | 'transactions' | 'budgets' | 'savings' | 'bills' | 'agent' | 'workflow';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onResetData: () => void;
  onOpenOnboarding: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalBalance: number;
  savingsRate: number;
  currency?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onResetData,
  onOpenOnboarding,
  isOpenMobile,
  onCloseMobile,
  totalBalance,
  savingsRate,
  currency = '৳',
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'workflow', label: 'Plan → Act → Recover', icon: Layers },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'budgets', label: 'Budgets & Limits', icon: PieChart },
    { id: 'savings', label: 'Savings Goals', icon: Target },
    { id: 'bills', label: 'Upcoming Bills', icon: CalendarClock },
    { id: 'agent', label: 'Autonomous Agent', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-[#0E1322] px-4 py-5 transition-transform duration-200 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white font-sans">
                  FinPilot AI
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  MVP
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Finance</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 space-y-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wider uppercase text-slate-500 mb-2">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.id === 'agent' && (
                  <span className="ml-auto flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Account Health Quick Card */}
        <div className="my-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Portfolio Liquidity</span>
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>+{savingsRate}% save</span>
            </div>
          </div>
          <div className="mt-1 text-lg font-bold tracking-tight text-white font-mono tabular-nums">
            {currency}{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Guardrails Active</span>
          </div>
        </div>

        {/* Demo Guide & Reset Demo Data */}
        <div className="pt-3 border-t border-slate-800/60 space-y-2">
          <button
            onClick={() => {
              onOpenOnboarding();
              onCloseMobile();
            }}
            title="Open FinTech 2026 Walkthrough Guide and Scenario"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20"
          >
            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
            <span>Demo Guide & Scenario</span>
          </button>

          <button
            onClick={onResetData}
            title="Reset to default mock data"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <div className="mt-2 text-center text-[10px] text-slate-600">
            FinPilot AI · Fintech Hackathon Edition
          </div>
        </div>
      </aside>
    </>
  );
};
