'use client';

import { CompanyDto } from '@vyora/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function CompanySwitcherDropdown({ currentCompanyName }: { currentCompanyName: string }) {
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const activeRes = await window.vyora.company.getActive();
      if (activeRes.success && activeRes.data !== undefined) {
        setActiveCompanyId(activeRes.data);
      }

      const listRes = await window.vyora.company.list();
      if (listRes.success && listRes.data) {
        setCompanies(listRes.data);
      }
    } catch (error) {
      console.error('Failed to load companies for switcher', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
    };
    void init();

    const handleSwitchEvent = () => {
      void init();
    };
    window.addEventListener('company-switched', handleSwitchEvent);
    return () => window.removeEventListener('company-switched', handleSwitchEvent);
  }, []);

  const handleSwitch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (!newId) return;

    try {
      const res = await window.vyora.company.setActive(newId);
      if (res.success) {
        toast.success('Switched active company');
        setActiveCompanyId(newId);
        // Dispatch custom event to tell Topbar and other components to reload context
        window.dispatchEvent(new Event('company-switched'));
      } else {
        toast.error(res.error || 'Failed to switch company');
      }
    } catch (err) {
      toast.error((err as Error).message || 'An error occurred while switching company');
    }
  };

  if (companies.length === 0) {
    return (
      <div className="bg-secondary border-border/50 hidden rounded-sm border px-2 py-1 text-xs font-medium sm:flex">
        {currentCompanyName}
      </div>
    );
  }

  return (
    <select
      value={activeCompanyId || ''}
      onChange={handleSwitch}
      className="bg-secondary border-border/50 hover:bg-secondary/80 focus:ring-ring hidden cursor-pointer rounded-sm border px-2 py-1 text-xs font-medium transition-colors focus:ring-1 focus:outline-none sm:flex"
    >
      <option value="" disabled>
        Select a company
      </option>
      {companies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.tradeName || c.legalName}
        </option>
      ))}
    </select>
  );
}
