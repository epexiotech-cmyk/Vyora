import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { CompanyContextProvider } from '@/components/providers/CompanyContextProvider';
import { CommandPalette } from '@/components/system/CommandPalette';
import { Toaster } from '@/components/system/notifications/Toaster';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Vyora Desktop ERP',
  description: 'Vyora Business Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} bg-[image:var(--color-mesh-light)] font-sans antialiased dark:bg-[image:var(--color-mesh-dark)]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CompanyContextProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
            <CommandPalette />
          </CompanyContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
