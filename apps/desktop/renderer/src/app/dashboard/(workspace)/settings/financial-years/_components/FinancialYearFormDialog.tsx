'use client';

import { CreateFinancialYearInput } from '@vyora/types';
import { useState } from 'react';
import { toast } from 'sonner';

import { AppSelect } from '@/components/shared/form/AppSelect';
import { AppModal } from '@/components/shared/modal/AppModal';
import { Button } from '@/components/ui/button';

interface FinancialYearFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FinancialYearFormDialog({
  isOpen,
  onClose,
  onSuccess,
}: FinancialYearFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFinancialYearInput>({
    startDate: new Date(new Date().getFullYear(), 3, 1),
    endDate: new Date(new Date().getFullYear() + 1, 2, 31),
    activateAfterCreate: false,
  });

  const handleSubmit = async () => {
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('Start date must be strictly before end date.');
      return;
    }

    try {
      setLoading(true);
      const payload: CreateFinancialYearInput = {
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        activateAfterCreate: formData.activateAfterCreate,
      };

      const res = await window.vyora.financialYear.create(payload);
      if (res.success) {
        toast.success('Financial year created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || 'Failed to create financial year');
      }
    } catch (e) {
      toast.error((e as Error).message || 'An error occurred while creating financial year');
    } finally {
      setLoading(false);
    }
  };

  const MONTHS = [
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 26 }, (_, i) => ({
    label: String(currentYear - 20 + i),
    value: String(currentYear - 20 + i),
  }));

  const handleStartChange = (type: 'month' | 'year', val: string) => {
    const curMonth = formData.startDate.getMonth() + 1;
    const curYear = formData.startDate.getFullYear();
    const newMonth = type === 'month' ? Number(val) : curMonth;
    const newYear = type === 'year' ? Number(val) : curYear;

    const start = new Date(newYear, newMonth - 1, 1);
    const end = new Date(newYear + 1, newMonth - 1, 0);
    setFormData({ ...formData, startDate: start, endDate: end });
  };

  const handleEndChange = (type: 'month' | 'year', val: string) => {
    const curMonth = formData.endDate.getMonth() + 1;
    const curYear = formData.endDate.getFullYear();
    const newMonth = type === 'month' ? Number(val) : curMonth;
    const newYear = type === 'year' ? Number(val) : curYear;

    const end = new Date(newYear, newMonth, 0);
    setFormData({ ...formData, endDate: end });
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Financial Year"
      description="Enter the date range for the new financial year."
      hideActions
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Start Month</label>
          <div className="flex gap-2">
            <div className="w-1/2">
              <AppSelect
                options={MONTHS}
                value={String(formData.startDate.getMonth() + 1)}
                onChange={(e) => handleStartChange('month', e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <AppSelect
                options={YEARS}
                value={String(formData.startDate.getFullYear())}
                onChange={(e) => handleStartChange('year', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">End Month</label>
          <div className="flex gap-2">
            <div className="w-1/2">
              <AppSelect
                options={MONTHS}
                value={String(formData.endDate.getMonth() + 1)}
                onChange={(e) => handleEndChange('month', e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <AppSelect
                options={YEARS}
                value={String(formData.endDate.getFullYear())}
                onChange={(e) => handleEndChange('year', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activateAfterCreate"
            checked={formData.activateAfterCreate}
            onChange={(e) => setFormData({ ...formData, activateAfterCreate: e.target.checked })}
          />
          <label htmlFor="activateAfterCreate" className="text-sm">
            Activate after creation
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
