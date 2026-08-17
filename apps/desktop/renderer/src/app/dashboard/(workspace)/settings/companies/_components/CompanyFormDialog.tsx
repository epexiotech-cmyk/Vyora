'use client';

import { CreateCompanyInput } from '@vyora/types';
import { useState } from 'react';
import { toast } from 'sonner';

import { AppModal } from '@/components/shared/modal/AppModal';
import { AppInput } from '@/components/ui/AppInput';
import { Button } from '@/components/ui/button';

interface CompanyFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CompanyFormDialog({ isOpen, onClose, onSuccess }: CompanyFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyInput>({
    legalName: '',
    gstin: '',
    isGstRegistered: false,
    financialYearStart: new Date(new Date().getFullYear(), 3, 1), // April 1st of current year
    currency: 'INR',
  });

  const handleSubmit = async () => {
    if (!formData.legalName) {
      toast.error('Legal Name is required');
      return;
    }

    try {
      setLoading(true);
      const res = await window.vyora.company.create(formData);
      if (res.success) {
        toast.success('Company created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || 'Failed to create company');
      }
    } catch (e) {
      toast.error((e as Error).message || 'An error occurred while creating company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Company"
      description="Enter the details to create a new company profile."
      hideActions
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Legal Name</label>
          <AppInput
            value={formData.legalName}
            onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
            placeholder="e.g. Acme Corp"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isGstRegistered"
            checked={formData.isGstRegistered}
            onChange={(e) => setFormData({ ...formData, isGstRegistered: e.target.checked })}
          />
          <label htmlFor="isGstRegistered" className="text-sm">
            Is GST Registered?
          </label>
        </div>

        {formData.isGstRegistered && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">GSTIN</label>
            <AppInput
              value={formData.gstin || ''}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              placeholder="e.g. 22AAAAA0000A1Z5"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Currency Code</label>
          <AppInput
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            placeholder="e.g. INR, USD"
            required
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Company'}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
