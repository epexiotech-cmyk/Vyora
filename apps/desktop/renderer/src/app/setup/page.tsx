'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppInput } from '@/components/ui/AppInput';

type Step = 1 | 2 | 3;

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Form State
  const [name, setName] = useState('');
  const [isGstRegistered, setIsGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');

  // Hardcode FY Start to 01-Apr of current year for simplicity as requested
  const currentYear = new Date().getFullYear();
  const financialYearStart = new Date(`${currentYear}-04-01`);
  const currency = 'INR';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNextStep1 = () => {
    if (!name.trim()) {
      setError('Business Name is required');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleCreateCompany = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await window.vyora.bootstrap.createCompany({
        name,
        isGstRegistered,
        gstin: isGstRegistered ? gstin : null,
        financialYearStart,
        currency,
      });

      if (res.success) {
        setStep(3);
      } else {
        setError(res.error || 'Failed to create company');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    router.replace('/dashboard');
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <AppCard className="w-full max-w-lg space-y-6 p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Create Your Business</h1>
            <p className="text-muted-foreground text-sm">
              Let's start by setting up your business profile.
            </p>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Business Name *</label>
                <AppInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter business name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="gst-registered"
                  checked={isGstRegistered}
                  onChange={(e) => setIsGstRegistered(e.target.checked)}
                  className="border-input rounded"
                />
                <label htmlFor="gst-registered" className="text-sm font-medium">
                  GST Registered?
                </label>
              </div>

              {isGstRegistered && (
                <div>
                  <label className="text-sm font-medium">GSTIN</label>
                  <AppInput
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="Enter GSTIN"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <AppButton onClick={handleNextStep1}>Continue</AppButton>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Financial Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure your default financial preferences.
            </p>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Financial Year Start
                </label>
                <div className="bg-muted/50 mt-1 rounded-md border p-2">01-Apr Current FY</div>
              </div>

              <div>
                <label className="text-muted-foreground text-sm font-medium">Currency</label>
                <div className="bg-muted/50 mt-1 rounded-md border p-2">INR</div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <AppButton variant="secondary" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </AppButton>
              <AppButton onClick={handleCreateCompany} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Company'}
              </AppButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">Setup Complete</h1>
              <p className="text-muted-foreground mt-2">Welcome to Vyora</p>
            </div>

            <div className="pt-6">
              <AppButton onClick={handleFinish} className="w-full">
                Go To Dashboard
              </AppButton>
            </div>
          </div>
        )}
      </AppCard>
    </div>
  );
}
