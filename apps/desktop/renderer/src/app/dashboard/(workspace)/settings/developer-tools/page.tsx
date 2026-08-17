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
    if (typeof window !== 'undefined' && window.vyora?.developer?.isEnabled) {
      window.vyora.developer
        .isEnabled()
        .then((enabled: boolean) => {
          setIsPackaged(!enabled);
        })
        .catch(() => {
          setIsPackaged(true);
        });
    } else {
      setTimeout(() => setIsPackaged(true), 0);
    }
  }, []);

  if (isPackaged === null) {
    return null; // Loading state
  }

  if (isPackaged) {
    return notFound();
  }

  return <DevToolsUI />;
}
