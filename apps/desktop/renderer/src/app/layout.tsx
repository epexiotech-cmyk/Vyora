import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AppLayout>{children}</AppLayout>
          <Toaster />
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  );
}
