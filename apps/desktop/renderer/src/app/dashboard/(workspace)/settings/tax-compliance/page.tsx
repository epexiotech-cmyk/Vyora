'use client';

import { TaxDto } from '@vyora/types';
import { ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { TaxFormModal } from './_components/TaxFormModal';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';

export default function TaxCompliancePage() {
  const router = useRouter();
  const [taxes, setTaxes] = React.useState<TaxDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTax, setSelectedTax] = React.useState<TaxDto | undefined>(undefined);

  const fetchTaxes = React.useCallback(async () => {
    try {
      const res = await window.vyora.db.taxes.getAll();
      if (res.success && res.data) {
        setTaxes(res.data);
      } else {
        toast.error('Failed to load GST rates');
      }
    } catch {
      toast.error('An error occurred while loading GST rates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTaxes();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTaxes]);

  const handleEdit = (tax: TaxDto) => {
    setSelectedTax(tax);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedTax(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AppButton variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </AppButton>
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-semibold tracking-tight">Tax & Compliance</h3>
            <p className="text-muted-foreground text-sm">
              Configure GST rates, HSN codes, and e-invoicing.
            </p>
          </div>
        </div>
        <AppButton onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add GST Rate
        </AppButton>
      </div>

      <AppCard className="overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground animate-pulse text-sm">Loading taxes...</p>
          </div>
        ) : taxes.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground text-sm">No GST rates found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Rate (%)</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {taxes.map((tax) => (
                  <tr key={tax.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{tax.name}</td>
                    <td className="px-6 py-4">{tax.taxType}</td>
                    <td className="px-6 py-4">{tax.rate}</td>
                    <td className="px-6 py-4">
                      {tax.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                          Active
                        </span>
                      ) : (
                        <span className="bg-destructive/10 text-destructive inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AppButton variant="ghost" size="sm" onClick={() => handleEdit(tax)}>
                        Edit
                      </AppButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppCard>

      <TaxFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTaxes}
        initialData={selectedTax}
        existingTaxes={taxes}
      />
    </div>
  );
}
