import { EmployeeExpenseTypeList } from './_components/EmployeeExpenseTypeList';

export default function EmployeeExpenseTypesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expense Types</h1>
        <p className="text-muted-foreground mt-2">
          Manage categories for your expenses and define how they map to your chart of accounts.
        </p>
      </div>

      <EmployeeExpenseTypeList />
    </div>
  );
}
