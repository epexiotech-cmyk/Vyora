'use client';

import * as React from 'react';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { SalesCustomerSelector } from '@/components/forms/SalesCustomerSelector';

export function InvoiceHeader({ isReadOnly }: { isReadOnly?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Customer Selection */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <label className="mb-1 block text-sm font-medium">Customer *</label>
        <SalesCustomerSelector name="customerId" disabled={isReadOnly} />
      </div>

      <AppField name="invoiceNumber" label="Invoice Number *">
        <FormInput name="invoiceNumber" placeholder="INV-0001" disabled={isReadOnly} />
      </AppField>

      <AppField name="invoiceDate" label="Invoice Date *">
        <FormInput name="invoiceDate" type="date" disabled={isReadOnly} />
      </AppField>

      <AppField name="dueDate" label="Due Date">
        <FormInput name="dueDate" type="date" disabled={isReadOnly} />
      </AppField>

      <AppField name="referenceNumber" label="Reference Number">
        <FormInput name="referenceNumber" placeholder="PO-12345" disabled={isReadOnly} />
      </AppField>

      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <AppField name="remarks" label="Remarks">
          <FormTextarea
            name="remarks"
            placeholder="Enter any notes or remarks..."
            disabled={isReadOnly}
          />
        </AppField>
      </div>
    </div>
  );
}
