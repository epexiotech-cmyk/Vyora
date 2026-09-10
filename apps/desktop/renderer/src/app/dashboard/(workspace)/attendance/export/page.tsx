import { Metadata } from 'next';

import { PayrollExportDashboard } from './_components/PayrollExportDashboard';

export const metadata: Metadata = {
  title: 'Payroll Attendance Export | Vyora',
  description: 'Export attendance and leave details for payroll processing.',
};

export default function PayrollExportPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PayrollExportDashboard />
    </div>
  );
}
