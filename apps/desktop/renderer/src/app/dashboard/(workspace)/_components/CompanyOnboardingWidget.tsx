'use client';

import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { CompanyCompletionService } from '@/features/company/services/CompanyCompletionService';

export function CompanyOnboardingWidget() {
  const router = useRouter();
  const { context } = useCompanyContext();

  // We consider the financial year to be implicitly created if a company exists
  const completion = context?.company
    ? CompanyCompletionService.calculateCompletion(context.company, true)
    : null;

  // If there's no context/company, we don't display the widget
  if (!context?.company || !completion) return null;

  const { percentage, items, nextRecommendedAction } = completion;

  // Disappear at 100%
  if (percentage === 100) return null;

  const isStateA = percentage <= 25;

  const handleNavigate = (route?: string) => {
    if (route) router.push(route);
  };

  const nextActionItem = items.find((i) => i.key === nextRecommendedAction);

  return (
    <AppCard className="p-6">
      <div className="flex flex-col gap-4">
        {/* Header Text */}
        <div>
          {isStateA ? (
            <>
              <h2 className="text-foreground text-lg font-semibold">Welcome to Vyora 👋</h2>
              <p className="text-muted-foreground text-sm">
                Let&apos;s finish setting up your company profile.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-foreground text-lg font-semibold">Company Profile Setup</h2>
              <p className="text-muted-foreground text-sm">
                Your company profile is {percentage}% complete.
              </p>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div className="bg-primary h-full" style={{ width: `${percentage}%` }} />
          </div>
          <span className="text-muted-foreground text-sm font-medium">{percentage}%</span>
        </div>

        {/* Items List */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.key}
              onClick={() => handleNavigate(item.route)}
              className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded p-2 transition-colors"
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="text-muted-foreground h-4 w-4" />
              )}
              <span
                className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {nextActionItem && (
          <div className="mt-2 flex">
            <AppButton onClick={() => handleNavigate(nextActionItem.route)}>
              Complete {nextActionItem.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </AppButton>
          </div>
        )}
      </div>
    </AppCard>
  );
}
