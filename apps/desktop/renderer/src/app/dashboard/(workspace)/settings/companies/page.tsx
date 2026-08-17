'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { CompanyList } from './_components/CompanyList';

import { Button } from '@/components/ui/button';

export default function CompaniesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-semibold tracking-tight">Companies</h3>
          <p className="text-muted-foreground text-sm">
            Manage multiple companies and their profiles.
          </p>
        </div>
      </div>

      <CompanyList />
    </div>
  );
}
