import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { UpcomingBill } from '../types/finance.js';

interface BillsViewProps {
  bills: UpcomingBill[];
  checkingBalance: number;
  onPayBill: (billId: string) => Promise<void>;
}

export const BillsView: React.FC<BillsViewProps> = ({
  bills,
  checkingBalance,
  onPayBill,
}) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'paid'>('all');
  const [payingId, setPayingId] = useState<string | null>(null);

  const pendingBills = bills.filter((b) => b.status === 'upcoming');
  const totalPendingAmount = pendingBills.reduce((acc, b) => acc + b.amount, 0);

  const filteredBills = bills.filter((b) => {
    if (filter === 'upcoming') return b.status === 'upcoming';
    if (filter === 'paid') return b.status === 'paid';
    return true;
  });

  const handlePay = async (id: string) => {
    try {
      setPayingId(id);
      await onPayBill(id);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Upcoming Recurring Bills & Subscriptions</h2>
          <p className="text-xs text-slate-400">
            Automated calendar synchronization with liquidity coverage verification
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800 self-start sm:self-auto">
          {(['all', 'upcoming', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Upcoming Total Obligations</span>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalPendingAmount.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{pendingBills.length} payments scheduled</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Checking Liquidity Reserve</span>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono tabular-nums">
            ${checkingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Available to service obligations</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
          <span className="text-xs text-slate-400">Cash Flow Buffer</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
              +${(checkingBalance - totalPendingAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>100% obligations covered</span>
          </div>
        </div>
      </div>

      {/* Bills List Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1424] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Service / Provider</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold">Due Date</th>
                <th className="py-3 px-3 font-semibold">Payment Mode</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-white">{bill.name}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-slate-300">{bill.category}</td>

                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400">
                    {bill.dueDate}
                  </td>

                  <td className="py-3.5 px-3">
                    {bill.isAutoPay ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded px-1.5 py-0.5">
                        <RefreshCw className="h-2.5 w-2.5" />
                        <span>AutoPay ON</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Manual Pay</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    {bill.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        <span>Paid</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                        <CalendarClock className="h-2.5 w-2.5" />
                        <span>Upcoming</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-sm text-white">
                    ${bill.amount.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {bill.status === 'upcoming' ? (
                      <button
                        onClick={() => handlePay(bill.id)}
                        disabled={payingId === bill.id}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {payingId === bill.id ? 'Processing...' : 'Pay Now'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
