import { FinancialYearList } from './_components/FinancialYearList';

export default function FinancialYearsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-semibold tracking-tight">Financial Years</h3>
        <p className="text-muted-foreground text-sm">
          Manage multiple financial years for the active company.
        </p>
      </div>

      <FinancialYearList />
    </div>
  );
}
