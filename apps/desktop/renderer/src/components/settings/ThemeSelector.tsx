'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { AppButton } from '@/components/ui/AppButton';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-muted/50 flex rounded-md p-1">
        <div className="h-7 w-[84px]" />
      </div>
    );
  }

  return (
    <div className="bg-muted/50 flex items-center rounded-md p-1">
      <AppButton
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${theme === 'light' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => setTheme('light')}
      >
        <Sun className="mr-1.5 h-3.5 w-3.5" />
        Light
      </AppButton>
      <AppButton
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${theme === 'dark' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => setTheme('dark')}
      >
        <Moon className="mr-1.5 h-3.5 w-3.5" />
        Dark
      </AppButton>
      <AppButton
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${theme === 'system' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => setTheme('system')}
      >
        <Monitor className="mr-1.5 h-3.5 w-3.5" />
        System
      </AppButton>
    </div>
  );
}
