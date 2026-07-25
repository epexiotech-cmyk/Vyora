'use client';

import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

const DevToolsUI = dynamic(() => import('./_components/DevToolsUI').then((mod) => mod.DevToolsUI), {
  ssr: false,
});

export default function DeveloperToolsPage() {
  const [isPackaged, setIsPackaged] = useState<boolean | null>(null);

  useEffect(() => {
    // Only access window.vyora on the client side
    const packaged =
      typeof window !== 'undefined'
        ? ((window as unknown as { vyora?: { system?: { isPackaged?: boolean } } }).vyora?.system
            ?.isPackaged ?? true)
        : true;
    setTimeout(() => setIsPackaged(packaged), 0);
  }, []);

  if (isPackaged === null) {
    return null; // Loading state
  }

  if (isPackaged) {
    return notFound();
  }

  return <DevToolsUI />;
}
