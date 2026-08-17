import React from 'react';

import { Workspace } from '@/components/layout/workspace/Workspace';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Workspace mode="default">{children}</Workspace>;
}
