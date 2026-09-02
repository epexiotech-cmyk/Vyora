import { ExportFormat } from '@vyora/types';
import {
  Download,
  Loader2,
  FileSpreadsheet,
  FileJson,
  FileText,
  File as FilePdf,
} from 'lucide-react';
import React from 'react';

import { AppDropdownMenu, AppDropdownItem } from '@/components/shared/menu/AppDropdownMenu';
import { AppButton } from '@/components/ui/AppButton';

export interface AppExportDropdownProps {
  onExport: (format: ExportFormat) => void;
  isExporting?: boolean;
  disabled?: boolean;
  className?: string;
  align?: 'start' | 'end';
}

export function AppExportDropdown({
  onExport,
  isExporting,
  disabled,
  className,
  align = 'end',
}: AppExportDropdownProps) {
  const isDisabled = isExporting || disabled;

  const items: AppDropdownItem[] = [
    {
      key: 'csv',
      label: 'Export CSV',
      icon: <FileText className="mr-2 h-4 w-4" />,
      onClick: () => onExport(ExportFormat.CSV),
      disabled: isDisabled,
    },
    {
      key: 'json',
      label: 'Export JSON',
      icon: <FileJson className="mr-2 h-4 w-4" />,
      onClick: () => onExport(ExportFormat.JSON),
      disabled: isDisabled,
    },
    {
      key: 'xlsx',
      label: 'Export Excel',
      icon: <FileSpreadsheet className="mr-2 h-4 w-4" />,
      onClick: () => onExport(ExportFormat.XLSX),
      disabled: isDisabled,
    },
    {
      key: 'pdf',
      label: 'Export PDF',
      icon: <FilePdf className="mr-2 h-4 w-4" />,
      onClick: () => onExport(ExportFormat.PDF),
      disabled: isDisabled,
    },
  ];

  return (
    <AppDropdownMenu
      align={align}
      trigger={
        <AppButton variant="outline" size="sm" disabled={isDisabled} className={className}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? 'Exporting...' : 'Export'}
        </AppButton>
      }
      items={items}
    />
  );
}
