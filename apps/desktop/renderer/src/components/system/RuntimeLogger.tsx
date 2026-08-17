'use client';

import { useEffect } from 'react';

export function RuntimeLogger() {
  useEffect(() => {
    console.log('[RENDERER] RuntimeLogger mounted');

    // Use a safer type assertion to satisfy strict ESLint rules
    const win = window as unknown as Record<string, unknown>;

    console.log('[RENDERER] typeof window.electron:', typeof win.electron);
    console.log('[RENDERER] typeof window.vyora:', typeof win.vyora);

    if (typeof window !== 'undefined' && win.vyora) {
      const vyoraObj = win.vyora as Record<string, unknown>;
      console.log('[RENDERER] Object.keys(window.vyora):', Object.keys(vyoraObj));

      const systemObj = vyoraObj.system as Record<string, unknown> | undefined;

      if (systemObj && typeof systemObj.test === 'function') {
        console.log('[RENDERER] Invoking system:test...');
        (systemObj.test as () => Promise<unknown>)()
          .then((res: unknown) => console.log('[RENDERER] system:test returned:', res))
          .catch((err: unknown) => console.error('[RENDERER] system:test error:', err));
      } else {
        console.log('[RENDERER] window.vyora.system.test is not defined');
      }
    } else {
      console.log('[RENDERER] window.vyora is undefined');
    }
  }, []);

  return null;
}
