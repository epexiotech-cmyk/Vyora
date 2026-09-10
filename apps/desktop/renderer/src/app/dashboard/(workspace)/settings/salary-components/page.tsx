'use client';

import { SalaryComponentList } from './_components/SalaryComponentList';

export default function SalaryComponentsPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <SalaryComponentList />
    </div>
  );
}
