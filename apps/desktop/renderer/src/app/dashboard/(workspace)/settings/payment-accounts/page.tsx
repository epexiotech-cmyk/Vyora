import { Metadata } from 'next';
import * as React from 'react';

import PaymentAccountsClientPage from './client';

export const metadata: Metadata = {
  title: 'Payment Accounts - Settings | Vyora',
  description: 'Manage your payment accounts, banks, and UPI configurations.',
};

export default function PaymentAccountsPage() {
  return (
    <React.Suspense fallback={<div className="p-6">Loading payment accounts...</div>}>
      <PaymentAccountsClientPage />
    </React.Suspense>
  );
}
