import React from 'react';

import { cn } from '@/lib/utils';

interface ConstrainedSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function ConstrainedSection({ children, className }: ConstrainedSectionProps) {
  return <div className={cn('mx-auto w-full max-w-[1600px]', className)}>{children}</div>;
}
