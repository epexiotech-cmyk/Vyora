'use client';

import { UnitDto } from '@vyora/types';
import { Plus, Edit2 } from 'lucide-react';
import * as React from 'react';

import { DataTable, ColumnDef, AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function UnitList() {
  const [data, setData] = React.useState<UnitDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<UnitDto | null>(null);

  React.useEffect(() => {
    const fetchUnits = async () => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.units.getAll();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch units:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const handleCreateOrEdit = (unit?: UnitDto) => {
    setEditingUnit(unit || null);
    setIsModalOpen(true);
  };

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(
      (u) =>
        u.name.toLowerCase().includes(lowerQuery) || u.shortName.toLowerCase().includes(lowerQuery),
    );
  }, [data, searchQuery]);

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredData.slice(start, start + limit);
  }, [filteredData, page, limit]);

  const columns: ColumnDef<UnitDto>[] = [
    {
      key: 'name',
      header: 'Unit Name',
      cell: (u) => <div className="font-medium">{u.name}</div>,
    },
    {
      key: 'shortName',
      header: 'Short Name',
      cell: (u) => <div>{u.shortName}</div>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <AppButton variant="ghost" size="sm" onClick={() => handleCreateOrEdit(u)} title="Edit">
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden px-6 py-6">
      <div className="mb-6 flex items-start justify-between">
        <SectionHeader title="Units" description="Manage units of measurement." />
      </div>

      <div className="flex-1 overflow-auto">
        <DataTable
          data={paginatedData}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No units found."
          toolbar={{
            searchQuery,
            onSearchChange: (val) => {
              setSearchQuery(val);
              setPage(1);
            },
            placeholder: 'Search units...',
            actions: (
              <AppButton onClick={() => handleCreateOrEdit()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </AppButton>
            ),
          }}
          pagination={{
            page,
            pageSize: limit,
            totalRecords: filteredData.length,
            onPageChange: setPage,
          }}
        />
      </div>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? 'Edit Unit' : 'Add Unit'}
        description="Placeholder workflow for creating or editing a unit."
        onConfirm={() => setIsModalOpen(false)}
        confirmLabel="Save Unit"
      >
        <div className="text-muted-foreground py-4 text-center text-sm">
          <p>Unit form placeholder.</p>
          <p>Implementation pending backend form wiring.</p>
        </div>
      </AppModal>
    </div>
  );
}
