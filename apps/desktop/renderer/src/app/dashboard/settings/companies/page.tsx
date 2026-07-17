import { CompanyList } from './_components/CompanyList';

export default function CompaniesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-semibold tracking-tight">Companies</h3>
        <p className="text-muted-foreground text-sm">
          Manage multiple companies and their profiles.
        </p>
      </div>

      <CompanyList />
    </div>
  );
}
