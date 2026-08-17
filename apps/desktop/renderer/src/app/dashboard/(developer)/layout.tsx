import React from 'react';

import { Workspace } from '@/components/layout/workspace/Workspace';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <Workspace mode="fullBleed" scrollOwner="child">
      {children}
    </Workspace>
  );
}
