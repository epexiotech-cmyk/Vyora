import { Metadata } from 'next';

import { AttendanceRegisterDashboard } from './_components/AttendanceRegisterDashboard';

export const metadata: Metadata = {
  title: 'Attendance Register | Vyora',
  description: 'View the global attendance register for an employee.',
};

export default function AttendanceRegisterPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AttendanceRegisterDashboard />
    </div>
  );
}
