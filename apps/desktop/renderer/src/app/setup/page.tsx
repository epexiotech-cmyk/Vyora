'use client';

import type { CurrencyDto } from '@vyora/types';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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

  // Hybrid approach: Selectable Month and Year
  const currentYear = new Date().getFullYear();
  const [fyStartMonth, setFyStartMonth] = useState('04');
  const [fyStartYear, setFyStartYear] = useState(currentYear.toString());
  const financialYearStart = new Date(`${fyStartYear}-${fyStartMonth}-01`);
  const [currency, setCurrency] = useState('');
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrencies() {
      try {
        const activeCurrenciesRes = await window.vyora.directories.currency.getActive();
        if (activeCurrenciesRes.success && activeCurrenciesRes.data) {
          const activeCurrencies = activeCurrenciesRes.data;
          setCurrencies(activeCurrencies);
          if (activeCurrencies.length > 0) {
            const primaryCurrencyRes = await window.vyora.directories.currency.getPrimary();
            if (
              primaryCurrencyRes.success &&
              primaryCurrencyRes.data &&
              activeCurrencies.find((c) => c.currencyCode === primaryCurrencyRes.data!.currencyCode)
            ) {
              setCurrency(primaryCurrencyRes.data.currencyCode);
            } else {
              const inr = activeCurrencies.find((c) => c.currencyCode === 'INR');
              if (inr) {
                setCurrency(inr.currencyCode);
              } else {
                setCurrency(activeCurrencies[0].currencyCode);
              }
            }
          }
        } else {
          setError(activeCurrenciesRes.error || 'Failed to load currencies.');
        }
      } catch {
        setError('Failed to load currencies. IPC failure.');
      } finally {
        setIsLoadingCurrencies(false);
      }
    }
    loadCurrencies();
  }, []);

  const isValidPartialGstin = (val: string) => {
    for (let i = 0; i < val.length; i++) {
      const char = val[i];
      if (i < 2 && !/[0-9]/.test(char)) return false;
      if (i >= 2 && i < 7 && !/[A-Z]/.test(char)) return false;
      if (i >= 7 && i < 11 && !/[0-9]/.test(char)) return false;
      if (i === 11 && !/[A-Z]/.test(char)) return false;
      if (i === 12 && !/[1-9A-Z]/.test(char)) return false;
      if (i === 13 && char !== 'Z') return false;
      if (i === 14 && !/[0-9A-Z]/.test(char)) return false;
    }
    return true;
  };

  const isGstinInvalid =
    isGstRegistered &&
    ((gstin.length > 0 && !isValidPartialGstin(gstin)) || error?.includes('GSTIN'));

  const handleNextStep1 = () => {
    if (!name.trim()) {
      setError('Business Name is required');
      return;
    }

    if (isGstRegistered) {
      if (!gstin) {
        setError('GSTIN is required');
        return;
      }
      if (isGstinInvalid) {
        setError('Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)');
        return;
      }
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstin.length !== 15 || !gstinRegex.test(gstin)) {
        setError('Invalid GSTIN format (e.g. 24AAAAA0000A1Z5)');
        return;
      }
    }

    setError(null);
    setStep(2);
  };

  const handleCreateCompany = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await window.vyora.bootstrap.createCompany({
        legalName: name,
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
              Let&apos;s start by setting up your business profile.
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
                    onChange={(e) => {
                      setGstin(e.target.value.toUpperCase());
                      if (error?.includes('GSTIN')) setError(null);
                    }}
                    placeholder="Enter GSTIN"
                    maxLength={15}
                    className={isGstinInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {isGstinInvalid && (
                    <p className="mt-1 text-xs text-red-500">
                      Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)
                    </p>
                  )}
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
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="text-muted-foreground text-sm font-medium">Start Month</label>
                  <select
                    value={fyStartMonth}
                    onChange={(e) => setFyStartMonth(e.target.value)}
                    className="border-input bg-background/50 focus-visible:ring-ring mt-1 flex h-8 w-full rounded-sm border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  >
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-muted-foreground text-sm font-medium">Start Year</label>
                  <select
                    value={fyStartYear}
                    onChange={(e) => setFyStartYear(e.target.value)}
                    className="border-input bg-background/50 focus-visible:ring-ring mt-1 flex h-8 w-full rounded-sm border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground text-sm font-medium">Currency</label>
                {isLoadingCurrencies ? (
                  <select
                    disabled
                    className="border-input bg-background/50 focus-visible:ring-ring mt-1 flex h-8 w-full cursor-not-allowed rounded-sm border px-3 py-1 text-sm opacity-50 shadow-sm transition-colors"
                  >
                    <option>Loading currencies...</option>
                  </select>
                ) : currencies.length === 0 ? (
                  <select
                    disabled
                    className="border-input bg-background/50 focus-visible:ring-ring mt-1 flex h-8 w-full cursor-not-allowed rounded-sm border px-3 py-1 text-sm opacity-50 shadow-sm transition-colors"
                  >
                    <option>No active currencies available.</option>
                  </select>
                ) : (
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="border-input bg-background/50 focus-visible:ring-ring mt-1 flex h-8 w-full rounded-sm border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  >
                    {currencies.map((c) => (
                      <option key={c.currencyCode} value={c.currencyCode}>
                        {c.currencyName} ({c.currencyCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <AppButton variant="secondary" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </AppButton>
              <AppButton
                onClick={handleCreateCompany}
                disabled={
                  isSubmitting || isLoadingCurrencies || currencies.length === 0 || !currency
                }
              >
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
