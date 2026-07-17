'use client';

import { CompanyDto } from '@vyora/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { CompanyFormDialog } from './CompanyFormDialog';

import { AppCard, AppCardContent } from '@/components/ui/AppCard';
import { Button } from '@/components/ui/button';

export function CompanyList() {
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await window.vyora.company.list();
      if (res.success && res.data) {
        setCompanies(res.data);
      } else {
        toast.error(res.error || 'Failed to load companies');
      }
    } catch (e) {
      toast.error((e as Error).message || 'An error occurred while loading companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      const res = await window.vyora.company.delete(id);
      if (res.success) {
        toast.success('Company deleted successfully');
        fetchCompanies();
      } else {
        toast.error(res.error || 'Failed to delete company');
      }
    } catch (e) {
      toast.error((e as Error).message || 'An error occurred while deleting company');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsDialogOpen(true)}>Create Company</Button>
      </div>

      <CompanyFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={fetchCompanies}
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading companies...</p>
      ) : companies.length === 0 ? (
        <p className="text-muted-foreground text-sm">No companies found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map((company) => (
            <AppCard key={company.id}>
              <AppCardContent className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <h3 className="text-base font-semibold">{company.legalName}</h3>
                  <p className="text-muted-foreground text-xs">GSTIN: {company.gstin || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(company.id)}>
                    Delete
                  </Button>
                </div>
              </AppCardContent>
            </AppCard>
          ))}
        </div>
      )}
    </div>
  );
}
