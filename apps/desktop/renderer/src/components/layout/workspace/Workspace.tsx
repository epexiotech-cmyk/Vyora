import * as React from 'react';

import { cn } from '@/lib/utils';

interface WorkspaceProps {
  children: React.ReactNode;
  className?: string;
}

export function Workspace({ children, className }: WorkspaceProps) {
  return (
    <main className={cn('bg-background flex-1 overflow-x-hidden overflow-y-auto p-6', className)}>
      <div className="mx-auto h-full max-w-7xl">{children}</div>
    </main>
  );
}
