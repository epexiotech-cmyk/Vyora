'use client';

import { EmployeeDto } from '@vyora/types';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { EmployeeForm } from '../../_components/EmployeeForm';

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const [data, setData] = React.useState<EmployeeDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const fetchEmployee = async () => {
      try {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const res = await (window.vyora.db as any).employees.getById(params.id);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          toast.error('Employee not found');
          router.push('/dashboard/employees');
        }
      } catch (err: unknown) {
        console.error(err);
        toast.error('Failed to load employee');
        router.push('/dashboard/employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id, router]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return null;

  return <EmployeeForm initialData={data} />;
}
