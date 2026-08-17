'use client';

import { FundTransferDto } from '@vyora/types';
import React, { useState } from 'react';

import { FundTransferDialog } from './_components/FundTransferDialog';
import { FundTransferList } from './_components/FundTransferList';

export default function FundTransfersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<FundTransferDto | null>(null);

  const handleNew = () => {
    setEditingTransfer(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (transfer: FundTransferDto) => {
    setEditingTransfer(transfer);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTransfer(null);
  };

  return (
    <div className="container mx-auto p-6">
      <FundTransferList onNew={handleNew} onEdit={handleEdit} />

      {isDialogOpen && (
        <FundTransferDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          transferToEdit={editingTransfer}
        />
      )}
    </div>
  );
}
