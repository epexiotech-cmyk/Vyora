import { ProfitLossReport } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import { useTheme } from 'next-themes';
import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ProfitLossChartProps {
  report: ProfitLossReport;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">
          {payload[0].name || payload[0].payload.name}
        </p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload.fill }}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {entry.dataKey || 'Amount'}:
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ProfitLossChart({ report }: ProfitLossChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Bar Chart Data (High Level Comparison)
  const barData = [
    {
      name: 'Financials',
      Income: report.totalIncome.amount,
      Expense: report.totalExpense.amount,
      'Net Profit': Math.max(0, report.netResult.amount * (report.isProfit ? 1 : -1)),
      'Net Loss': Math.max(0, report.netResult.amount * (report.isProfit ? -1 : 1)),
    },
  ];

  // Pie Chart Data (Breakdown)
  // Inner Pie (Income vs Expense)
  const innerPieData = [
    { name: 'Income', value: report.totalIncome.amount, fill: '#10b981' }, // emerald-500
    { name: 'Expense', value: report.totalExpense.amount, fill: '#f43f5e' }, // rose-500
  ].filter((d) => d.value > 0);

  // Outer Pie (Group Breakdown)
  const outerPieData: { name: string; value: number; fill: string }[] = [];

  // Generate shades of green for income
  report.incomeGroups.forEach((g, i) => {
    if (g.totalBalance.amount > 0) {
      outerPieData.push({
        name: g.groupName,
        value: g.totalBalance.amount,
        fill: `hsl(152, ${60 + (i % 3) * 10}%, ${45 + (i % 4) * 10}%)`,
      });
    }
  });

  // Generate shades of red for expense
  report.expenseGroups.forEach((g, i) => {
    if (g.totalBalance.amount > 0) {
      outerPieData.push({
        name: g.groupName,
        value: g.totalBalance.amount,
        fill: `hsl(343, ${70 + (i % 3) * 10}%, ${55 + (i % 4) * 10}%)`,
      });
    }
  });

  return (
    <div className="mb-6 grid h-[300px] grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Bar Chart Overview */}
      <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Income vs Expense
        </h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#1e293b' : '#f1f5f9'}
              />
              <XAxis dataKey="name" hide />
              <YAxis
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="Net Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="Net Loss" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Nested Donut Chart Breakdown */}
      <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Financial Breakdown
        </h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              {/* Inner Ring (Totals) */}
              <Pie
                data={innerPieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius="55%"
                stroke={isDark ? '#0f172a' : '#ffffff'}
                strokeWidth={2}
              >
                {innerPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              {/* Outer Ring (Groups) */}
              <Pie
                data={outerPieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="90%"
                stroke={isDark ? '#0f172a' : '#ffffff'}
                strokeWidth={2}
              >
                {outerPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
