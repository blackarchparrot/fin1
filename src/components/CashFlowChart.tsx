import React, { useState } from 'react';
import { MonthlyCashFlowPoint } from '../types/finance.js';

interface CashFlowChartProps {
  data: MonthlyCashFlowPoint[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'bars' | 'cashflow'>('bars');

  if (!data || data.length === 0) return null;

  // Sizing and coordinates
  const height = 200;
  const paddingX = 40;
  const paddingY = 24;

  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expenses))) * 1.15;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Cash Flow & Savings Trajectory</h3>
          <p className="text-xs text-slate-400">Monthly inflows vs outflows over the past 6 billing cycles</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/80 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('bars')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'bars'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Income vs Outflow
          </button>
          <button
            onClick={() => setViewMode('cashflow')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'cashflow'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Net Savings Flow
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox="0 0 600 200"
          className="w-full h-48 overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Subtle horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={600 - paddingX}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-500 font-mono"
                >
                  ${(val / 1000).toFixed(1)}k
                </text>
              </g>
            );
          })}

          {/* SVG Elements based on viewMode */}
          {viewMode === 'bars' ? (
            // Grouped Bar View
            data.map((item, index) => {
              const xCenter = paddingX + (index + 0.5) * ((600 - 2 * paddingX) / data.length);
              const barWidth = 14;

              const incomeHeight = (item.income / maxVal) * (height - 2 * paddingY);
              const expenseHeight = (item.expenses / maxVal) * (height - 2 * paddingY);

              const incomeY = height - paddingY - incomeHeight;
              const expenseY = height - paddingY - expenseHeight;

              const isHovered = hoveredIndex === index;

              return (
                <g
                  key={item.month}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-opacity"
                  opacity={hoveredIndex === null || isHovered ? 1 : 0.45}
                >
                  {/* Invisible hit area for easier hover */}
                  <rect
                    x={xCenter - 25}
                    y={paddingY}
                    width={50}
                    height={height - 2 * paddingY}
                    fill="transparent"
                  />

                  {/* Income bar (Emerald/Cyan gradient tone) */}
                  <rect
                    x={xCenter - barWidth - 2}
                    y={incomeY}
                    width={barWidth}
                    height={incomeHeight}
                    rx="3"
                    className="fill-indigo-500 transition-all duration-200"
                  />

                  {/* Expense bar (Violet/Rose tone) */}
                  <rect
                    x={xCenter + 2}
                    y={expenseY}
                    width={barWidth}
                    height={expenseHeight}
                    rx="3"
                    className="fill-violet-400/80 transition-all duration-200"
                  />

                  {/* Month Label */}
                  <text
                    x={xCenter}
                    y={height - 6}
                    textAnchor="middle"
                    className={`text-[10px] font-sans ${
                      isHovered ? 'fill-indigo-300 font-semibold' : 'fill-slate-400'
                    }`}
                  >
                    {item.month.split(' ')[0]}
                  </text>
                </g>
              );
            })
          ) : (
            // Cash Flow Savings Path
            (() => {
              const points = data.map((item, index) => {
                const x = paddingX + (index + 0.5) * ((600 - 2 * paddingX) / data.length);
                const savings = item.income - item.expenses;
                const y = height - paddingY - (savings / (maxVal * 0.6)) * (height - 2 * paddingY);
                return { x, y, savings, month: item.month };
              });

              const pathD = points.reduce((acc, curr, i) => {
                return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
              }, '');

              const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

              return (
                <g>
                  <defs>
                    <linearGradient id="savingsArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path d={areaD} fill="url(#savingsArea)" />
                  <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth="2.5" />

                  {points.map((pt, idx) => (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredIndex === idx ? 6 : 4}
                        fill="#0E1424"
                        stroke="#38BDF8"
                        strokeWidth="2.5"
                      />
                      <text
                        x={pt.x}
                        y={height - 6}
                        textAnchor="middle"
                        className="text-[10px] fill-slate-400"
                      >
                        {pt.month.split(' ')[0]}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="pointer-events-none absolute top-2 right-4 rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-lg backdrop-blur-sm transition-all"
          >
            <p className="font-semibold text-white mb-1">{data[hoveredIndex].month}</p>
            <div className="space-y-0.5 font-mono text-[11px] tabular-nums">
              <div className="flex items-center justify-between gap-4 text-indigo-400">
                <span>Inflows:</span>
                <span>+${data[hoveredIndex].income.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-violet-300">
                <span>Outflows:</span>
                <span>-${data[hoveredIndex].expenses.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sky-400 border-t border-slate-800 pt-0.5 mt-0.5">
                <span>Net Savings:</span>
                <span>+${(data[hoveredIndex].income - data[hoveredIndex].expenses).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-xs bg-indigo-500" />
          <span>Income / Inflows</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-xs bg-violet-400" />
          <span>Expenses / Outflows</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-xs bg-sky-400" />
          <span>Monthly Net Surplus</span>
        </div>
      </div>
    </div>
  );
};
