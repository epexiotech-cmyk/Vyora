'use client';

import * as React from 'react';

import { InvoiceForm } from '../components/InvoiceForm';

export default function NewSalesInvoicePage() {
  return (
    <div className="h-full w-full">
      <InvoiceForm mode="create" />
    </div>
  );
}
