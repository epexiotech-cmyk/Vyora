'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { FinancialYearList } from './_components/FinancialYearList';

import { AppButton } from '@/components/ui/AppButton';

export default function FinancialYearsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <AppButton variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </AppButton>
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-semibold tracking-tight">Financial Years</h3>
          <p className="text-muted-foreground text-sm">
            Manage multiple financial years for the active company.
          </p>
        </div>
      </div>

      <FinancialYearList />
    </div>
  );
}
