'use client';

import * as React from 'react';

import { JournalForm } from '../_components/JournalForm';

import { SectionHeader } from '@/components/ui/SectionHeader';

export default function NewJournalEntryPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="New Journal Entry" description="Create a manual journal entry" />

      <JournalForm />
    </div>
  );
}
