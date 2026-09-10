import { Metadata } from 'next';

import { GlobalLeaveRequests } from './_components/GlobalLeaveRequests';

export const metadata: Metadata = {
  title: 'Leave Requests | Vyora',
  description: 'Manage employee leave requests globally.',
};

export default function LeaveRequestsPage() {
  return (
    <main className="p-8">
      <GlobalLeaveRequests />
    </main>
  );
}
