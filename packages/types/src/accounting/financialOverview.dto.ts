export interface FinancialOverviewChartRequestDto {
  timeRange: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'annually' | 'ytd';
}

export interface FinancialOverviewChartResponseDto {
  date: Date;
  income: number;
  expense: number;
  netProfit: number;
  label?: string; // e.g. "Week 1", "Q1", "2024", etc.
}
