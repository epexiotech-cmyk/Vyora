'use client';

import type { CurrencyDto } from '@vyora/types';
import { validateGstinPartial } from '@vyora/utils';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppInput } from '@/components/ui/AppInput';

type Step = 1 | 2 | 3 | 4;

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // User State
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [pinArray, setPinArray] = useState<string[]>(Array(4).fill(''));
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const adminPin = pinArray.join('');

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pinArray];
    newPin[index] = value.slice(-1);
    setPinArray(newPin);

    if (value && index < pinLength - 1) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinLengthChange = (length: 4 | 6) => {
    setPinLength(length);
    setPinArray(Array(length).fill(''));
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return '';
    let strength = 0;
    if (/(?=.*[a-z])(?=.*[0-9])/i.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*[^a-zA-Z0-9])/.test(password)) strength++;
    if (password.length >= 8) strength++;

    if (strength <= 2) return 'Weak';
    if (strength === 3) return 'Medium';
    return 'Strong';
  };

  // Company State
  const [name, setName] = useState('');
  const [isGstRegistered, setIsGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');

  // Financial State
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
        }
      } catch (err) {
        console.error('Failed to load currencies', err);
      } finally {
        setIsLoadingCurrencies(false);
      }
    }
    loadCurrencies();
  }, []);

  const handleNextStep1 = async () => {
    if (!adminFullName.trim() || !adminUsername.trim() || !adminPassword.trim()) {
      setError('Name, Username, and Password are required');
      return;
    }
    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const hasAlphaNum = /(?=.*[a-z])(?=.*[0-9])/i.test(adminPassword);
    const hasCaps = /(?=.*[A-Z])/.test(adminPassword);
    const hasSpecial = /(?=.*[^a-zA-Z0-9])/.test(adminPassword);
    if (!hasAlphaNum || !hasCaps || !hasSpecial) {
      setError(
        'Password must be alphanumeric with at least 1 uppercase letter and 1 special character',
      );
      return;
    }
    if (adminPin.length !== pinLength) {
      setError(`PIN must be ${pinLength} digits`);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!name.trim()) {
      setError('Business Name is required');
      return;
    }
    if (isGstRegistered) {
      if (!gstin) {
        setError('GSTIN is required');
        return;
      }
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstin.length !== 15 || !gstinRegex.test(gstin)) {
        setError('Invalid GSTIN format (e.g. 24AAAAA0000A1Z5)');
        return;
      }
    }
    setError(null);
    setStep(3);
  };

  const handleCreateAccount = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create Admin
      const adminRes = await window.vyora.auth.createAdmin({
        fullName: adminFullName,
        username: adminUsername,
        password: adminPassword,
        pin: adminPin || undefined,
      });

      if (!adminRes.success) {
        setError(adminRes.error || 'Failed to create administrator');
        setIsSubmitting(false);
        return;
      }

      // 2. Login as the newly created admin
      const loginRes = await window.vyora.auth.login({
        username: adminUsername,
        password: adminPassword,
        rememberMe: true,
      });

      if (!loginRes.success) {
        setError('Failed to login with new administrator');
        setIsSubmitting(false);
        return;
      }

      // 3. Create Company
      const companyRes = await window.vyora.bootstrap.createCompany({
        legalName: name,
        isGstRegistered,
        gstin: isGstRegistered ? gstin : null,
        financialYearStart,
        currency,
      });

      if (companyRes.success) {
        setStep(4);
      } else {
        setError(companyRes.error || 'Failed to create company');
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
    <div className="relative flex h-screen w-full items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeSelector />
      </div>
      <AppCard className="w-full max-w-lg space-y-6 p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Create Administrator</h1>
            <p className="text-muted-foreground text-sm">
              Set up the primary administrative account for Vyora.
            </p>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <AppInput
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Username *</label>
                <AppInput
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password *</label>
                <div className="relative mt-1">
                  <AppInput
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Strong password"
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    {adminPassword === confirmPassword && adminPassword !== '' && (
                      <svg
                        className="h-4 w-4 text-green-500"
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
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {adminPassword && (
                  <div className="mt-1 text-xs font-medium">
                    Strength:{' '}
                    <span
                      className={
                        getPasswordStrength(adminPassword) === 'Strong'
                          ? 'text-green-500'
                          : getPasswordStrength(adminPassword) === 'Medium'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                      }
                    >
                      {getPasswordStrength(adminPassword)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Confirm Password *</label>
                <div className="relative mt-1">
                  <AppInput
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    {adminPassword === confirmPassword && adminPassword !== '' && (
                      <svg
                        className="h-4 w-4 text-green-500"
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
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {confirmPassword !== '' && adminPassword !== confirmPassword && (
                  <div className="mt-1 text-xs font-medium text-red-500">Passwords must match</div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">PIN (For Daily Login) *</label>
                  <div className="flex space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handlePinLengthChange(4)}
                      className={`rounded px-2 py-1 ${pinLength === 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      4 Digits
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinLengthChange(6)}
                      className={`rounded px-2 py-1 ${pinLength === 6 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      6 Digits
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex justify-start space-x-2">
                  {pinArray.map((digit, index) => (
                    <AppInput
                      key={index}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      ref={(el) => {
                        pinRefs.current[index] = el;
                      }}
                      className="h-12 w-12 text-center text-lg"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <AppButton onClick={handleNextStep1}>Continue</AppButton>
            </div>
          </div>
        )}

        {step === 2 && (
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
                      const val = e.target.value.toUpperCase();
                      setGstin(val);
                      if (val) {
                        const res = validateGstinPartial(val);
                        if (!res.valid) {
                          setError(res.error || 'Invalid format');
                        } else {
                          if (error?.includes('GSTIN') || error?.includes('format')) setError(null);
                        }
                      } else {
                        if (error?.includes('GSTIN') || error?.includes('format')) setError(null);
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const res = validateGstinPartial(val);
                        if (res.valid && !res.isComplete) {
                          setError('15 characters are needed in GSTIN format');
                        }
                      }
                    }}
                    placeholder="Enter GSTIN"
                    maxLength={15}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <AppButton variant="secondary" onClick={() => setStep(1)}>
                Back
              </AppButton>
              <AppButton onClick={handleNextStep2}>Continue</AppButton>
            </div>
          </div>
        )}

        {step === 3 && (
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
                    <option value="04">April</option>
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
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="border-input bg-background/50 focus-visible:ring-ring mt-1 flex h-8 w-full rounded-sm border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  disabled={isLoadingCurrencies || currencies.length === 0}
                >
                  {currencies.map((c) => (
                    <option key={c.currencyCode} value={c.currencyCode}>
                      {c.currencyName} ({c.currencyCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <AppButton variant="secondary" onClick={() => setStep(2)} disabled={isSubmitting}>
                Back
              </AppButton>
              <AppButton
                onClick={handleCreateAccount}
                disabled={
                  isSubmitting || isLoadingCurrencies || currencies.length === 0 || !currency
                }
              >
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </AppButton>
            </div>
          </div>
        )}

        {step === 4 && (
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
