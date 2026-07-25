'use client';

import { FinancialYearDto } from '@vyora/types';
import { Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FinancialYearFormDialog } from './FinancialYearFormDialog';

import { AppCard, AppCardContent } from '@/components/ui/AppCard';
import { Button } from '@/components/ui/button';

export function FinancialYearList() {
  const [financialYears, setFinancialYears] = useState<FinancialYearDto[]>([]);
  const [activeFyId, setActiveFyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchFinancialYears = async () => {
    try {
      setLoading(true);
      const res = await window.vyora.financialYear.list();
      if (res.success && res.data) {
        setFinancialYears(res.data);
      } else {
        toast.error(res.error || 'Failed to load financial years');
      }

      const activeRes = await window.vyora.financialYear.getActive();
      if (activeRes.success && activeRes.data) {
        setActiveFyId(activeRes.data.id);
      } else {
        setActiveFyId(null);
      }
    } catch (e) {
      toast.error((e as Error).message || 'An error occurred while loading financial years');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchFinancialYears();
    };
    void init();

    const handleSwitchEvent = () => {
      void init();
    };
    window.addEventListener('company-switched', handleSwitchEvent);
    return () => window.removeEventListener('company-switched', handleSwitchEvent);
  }, []);

  const handleActivate = async (id: string) => {
    try {
      const res = await window.vyora.financialYear.setActive(id);
      if (res.success) {
        toast.success('Financial year activated successfully');
        fetchFinancialYears();
        window.dispatchEvent(new Event('financial-year-switched'));
      } else {
        toast.error(res.error || 'Failed to activate financial year');
      }
    } catch (e) {
      toast.error((e as Error).message || 'An error occurred while activating financial year');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsDialogOpen(true)}>Create Financial Year</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading financial years...</p>
      ) : financialYears.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No financial years found for the active company.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {financialYears.map((fy) => {
            const isActive = fy.id === activeFyId;
            return (
              <AppCard key={fy.id} className={isActive ? 'border-primary/50' : ''}>
                <AppCardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <div
                        className="h-4 w-4 shrink-0 rounded-full bg-green-500 shadow-sm"
                        title="Active Financial Year"
                      />
                    ) : (
                      <Circle className="text-muted-foreground h-4 w-4 shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <h3 className="text-base font-semibold">{fy.label}</h3>
                      <p className="text-muted-foreground text-xs">
                        {new Date(fy.startDate).toLocaleDateString()} -{' '}
                        {new Date(fy.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <Button variant="outline" size="sm" onClick={() => handleActivate(fy.id)}>
                        Activate
                      </Button>
                    )}
                  </div>
                </AppCardContent>
              </AppCard>
            );
          })}
        </div>
      )}

      {isDialogOpen && (
        <FinancialYearFormDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => fetchFinancialYears()}
        />
      )}
    </div>
  );
}
