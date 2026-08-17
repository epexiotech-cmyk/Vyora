'use client';

import { FinancialOverviewChartRequestDto, FinancialOverviewChartResponseDto } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function FinancialOverviewChart() {
  const [timeRange, setTimeRange] =
    React.useState<FinancialOverviewChartRequestDto['timeRange']>('monthly');
  const [chartData, setChartData] = React.useState<FinancialOverviewChartResponseDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchChartData() {
      setIsLoading(true);
      try {
        const response = await window.vyora.accounting.getFinancialOverviewChart({ timeRange });
        if (response.success && isMounted) {
          setChartData(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchChartData();

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  const data = chartData.map((item) => {
    return {
      date:
        item.label ||
        new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(
          new Date(item.date),
        ),
      income: item.income,
      expense: item.expense,
      netProfit: item.netProfit,
    };
  });

  return (
    <div className="bg-card relative flex h-full flex-col rounded-xl border p-6 shadow-sm">
      {isLoading && (
        <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center rounded-xl">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Financial Overview
        </h3>
        <select
          className="rounded-md border border-slate-200 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors outline-none hover:border-slate-300 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
          value={timeRange}
          onChange={(e) =>
            setTimeRange(
              e.target.value as
                | 'daily'
                | 'weekly'
                | 'monthly'
                | 'quarterly'
                | 'half-yearly'
                | 'annually'
                | 'ytd',
            )
          }
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="half-yearly">Half Yearly</option>
          <option value="annually">Annually</option>
          <option value="ytd">Year to Date</option>
        </select>
      </div>
      <div className="mt-4 h-[300px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="#94a3b8"
            />
            <YAxis
              tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="#94a3b8"
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend
              iconType="circle"
              verticalAlign="top"
              height={36}
              wrapperStyle={{ paddingBottom: '20px' }}
            />
            <Line
              type="linear"
              dataKey="income"
              name="Income"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="expense"
              name="Expense"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="netProfit"
              name="Net Profit"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
