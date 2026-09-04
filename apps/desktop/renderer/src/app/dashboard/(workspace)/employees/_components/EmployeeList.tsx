'use client';

import { EmployeeDto, EmployeeListDto } from '@vyora/types';
import { Edit, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { DataTable, ColumnDef } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';

export function EmployeeList() {
  const router = useRouter();

  const [data, setData] = React.useState<EmployeeListDto>({ data: [], total: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [filterActive, setFilterActive] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const [departments, setDepartments] = React.useState<Map<string, string>>(new Map());
  const [designations, setDesignations] = React.useState<Map<string, string>>(new Map());
  const [employeeTypes, setEmployeeTypes] = React.useState<Map<string, string>>(new Map());
  const [workLocations, setWorkLocations] = React.useState<Map<string, string>>(new Map());

  React.useEffect(() => {
    const fetchMasters = async () => {
      try {
        if (window.vyora?.db) {
          const [deptRes, desigRes, typeRes, locRes] = await Promise.all([
            window.vyora.db.departments.getAll(),
            window.vyora.db.designations.getAll(),
            window.vyora.db.employeeTypes.getAll(),
            window.vyora.db.workLocations.getAll(),
          ]);
          if (deptRes?.data)
            setDepartments(
              new Map(
                deptRes.data.map((d: import('@vyora/types').DepartmentDto) => [d.id, d.name]),
              ),
            );
          if (desigRes?.data)
            setDesignations(
              new Map(
                desigRes.data.map((d: import('@vyora/types').DesignationDto) => [d.id, d.name]),
              ),
            );
          if (typeRes?.data)
            setEmployeeTypes(
              new Map(
                typeRes.data.map((d: import('@vyora/types').EmployeeTypeDto) => [d.id, d.name]),
              ),
            );
          if (locRes?.data)
            setWorkLocations(
              new Map(
                locRes.data.map((d: import('@vyora/types').WorkLocationDto) => [d.id, d.name]),
              ),
            );
        }
      } catch (err) {
        console.error('Failed to load masters:', err);
      }
    };
    fetchMasters();
  }, []);

  React.useEffect(() => {
    let isActiveValue: boolean | undefined = undefined;
    if (filterActive === 'ACTIVE') isActiveValue = true;
    if (filterActive === 'INACTIVE') isActiveValue = false;

    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const res = await (window.vyora.db as any).employees.search({
          query: debouncedSearch,
          isActive: isActiveValue,
          limit,
          offset: (page - 1) * limit,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to update employee status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [debouncedSearch, filterActive, page]);

  const columns: ColumnDef<EmployeeDto>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (e) => (
        <div>
          <div className="font-medium">
            {e.firstName} {e.lastName}
          </div>
          <div className="text-muted-foreground text-xs">{e.employeeCode}</div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {e.employeeTypeId && employeeTypes.get(e.employeeTypeId) ? (
              <span className="rounded bg-gray-100 px-1 py-0.5">
                {employeeTypes.get(e.employeeTypeId)}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role & Location',
      cell: (e) => (
        <div>
          <div className="text-sm">{e.designationId ? designations.get(e.designationId) : '-'}</div>
          <div className="text-muted-foreground text-xs">
            {e.departmentId ? departments.get(e.departmentId) : '-'}
          </div>
          {e.workLocationId && workLocations.has(e.workLocationId) && (
            <div className="text-muted-foreground mt-0.5 text-xs">
              📍 {workLocations.get(e.workLocationId)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (e) => (
        <div>
          {e.mobile ? <div>{e.mobile}</div> : null}
          {e.email ? <div className="text-muted-foreground text-xs">{e.email}</div> : null}
          {!e.mobile && !e.email && <span className="text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (e) => {
        let variant: 'success' | 'warning' | 'destructive' | 'default' = 'default';
        if (e.status === 'Active') variant = 'success';
        if (e.status === 'On Leave') variant = 'warning';
        if (e.status === 'Resigned' || e.status === 'Terminated') variant = 'destructive';

        return <StatusBadge variant={variant}>{e.status}</StatusBadge>;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px] text-right',
      cell: (e) => (
        <div className="flex items-center justify-end gap-2">
          <AppButton
            variant="ghost"
            size="icon"
            onClick={(ev) => {
              ev.stopPropagation();
              router.push(`/dashboard/employees/${e.id}/edit`);
            }}
          >
            <Edit className="h-4 w-4" />
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <SectionHeader title="Employee Database">
        <AppButton onClick={() => router.push('/dashboard/employees/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </AppButton>
      </SectionHeader>

      <div className="flex-1 overflow-auto p-6 pt-0">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                setPage(1);
              }}
              className="border-input focus-visible:ring-ring flex h-10 w-[180px] rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              <option value="ALL">All Employees</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="relative">
            <input
              type="text"
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-[300px] rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data.data}
          keyExtractor={(e) => e.id}
          isLoading={isLoading}
          onRowClick={(e: EmployeeDto) => router.push(`/dashboard/employees/${e.id}`)}
          pagination={{
            page,
            pageSize: limit,
            totalRecords: data.total,
            onPageChange: setPage,
          }}
        />
      </div>
    </div>
  );
}
