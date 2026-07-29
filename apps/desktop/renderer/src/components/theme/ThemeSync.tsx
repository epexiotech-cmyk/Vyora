'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

export function ThemeSync() {
  const { theme, setTheme } = useTheme();
  const initialized = useRef(false);
  const lastPersistedTheme = useRef<string | null>(null);

  // Initial load from SettingsService
  useEffect(() => {
    async function loadInitialTheme() {
      if (typeof window !== 'undefined' && window.vyora?.settings?.app) {
        try {
          const res = await window.vyora.settings.app.getAppearance();
          if (res.success && res.data?.theme) {
            lastPersistedTheme.current = res.data.theme;
            // Only set theme if it differs, to prevent unnecessary re-renders
            if (res.data.theme !== theme) {
              setTheme(res.data.theme);
            }
          }
        } catch (error) {
          console.error('Failed to load initial appearance', error);
        } finally {
          initialized.current = true;
        }
      } else {
        initialized.current = true;
      }
    }
    loadInitialTheme();
  }, [setTheme, theme]);

  // Sync to SettingsService on change
  useEffect(() => {
    if (!initialized.current) return;
    if (typeof window !== 'undefined' && window.vyora?.settings?.app && theme) {
      if (theme === 'light' || theme === 'dark' || theme === 'system') {
        if (theme !== lastPersistedTheme.current) {
          lastPersistedTheme.current = theme;
          window.vyora.settings.app.setAppearance({ theme }).catch((error: unknown) => {
            console.error('Failed to save appearance', error);
          });
        }
      }
    }
  }, [theme]);

  return null;
}
