'use client';

import * as React from 'react';

import { PaymentAccountList } from './_components/PaymentAccountList';

export default function PaymentAccountsClientPage() {
  return (
    <div className="p-6">
      <PaymentAccountList />
    </div>
  );
}
