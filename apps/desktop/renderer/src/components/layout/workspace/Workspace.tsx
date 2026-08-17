import * as React from 'react';

import { cn } from '@/lib/utils';

export type WorkspaceMode = 'default' | 'constrained' | 'fullBleed';

interface WorkspaceProps {
  children: React.ReactNode;
  className?: string;
  mode?: WorkspaceMode;
  scrollOwner?: 'workspace' | 'child';
}

export function Workspace({
  children,
  className,
  mode = 'default',
  scrollOwner = 'workspace',
}: WorkspaceProps) {
  const isConstrained = mode === 'constrained';
  const handlesScroll = scrollOwner === 'workspace';

  return (
    <main
      className={cn(
        'bg-background flex min-w-0 flex-1 flex-col',
        handlesScroll ? 'overflow-x-hidden overflow-y-auto p-6' : 'overflow-hidden p-0',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto h-full w-full',
          isConstrained && 'max-w-[1600px]',
          !handlesScroll && 'flex flex-col',
        )}
      >
        {children}
      </div>
    </main>
  );
}
