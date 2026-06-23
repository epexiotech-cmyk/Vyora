'use client';

import { ProductListDto, TaxDto, UnitDto, ProductDto } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DataTable, ColumnDef, AppSelect } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';

export function ItemList() {
  const router = useRouter();

  const [data, setData] = React.useState<ProductListDto>({ data: [], total: 0 });
  const [units, setUnits] = React.useState<Record<string, UnitDto>>({});
  const [taxes, setTaxes] = React.useState<Record<string, TaxDto>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [filterActive, setFilterActive] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = React.useState(1);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const limit = 20;

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const res = await window.vyora.db.products.delete(id);
        if (res.success) {
          alert('Item deleted successfully.');
          setRefreshTrigger((prev) => prev + 1);
        } else {
          alert(res.error || 'Failed to delete item.');
        }
      } catch {
        alert('An unexpected error occurred while deleting.');
      }
    }
  };

  // Fetch Lookups
  React.useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [unitRes, taxRes] = await Promise.all([
          window.vyora.db.units.getAll(),
          window.vyora.db.taxes.getAll(),
        ]);

        if (unitRes.success && unitRes.data) {
          const unitMap: Record<string, UnitDto> = {};
          unitRes.data.forEach((u: UnitDto) => {
            unitMap[u.id] = u;
          });
          setUnits(unitMap);
        }

        if (taxRes.success && taxRes.data) {
          const taxMap: Record<string, TaxDto> = {};
          taxRes.data.forEach((t: TaxDto) => {
            taxMap[t.id] = t;
          });
          setTaxes(taxMap);
        }
      } catch (e) {
        console.error('Failed to load lookups', e);
      }
    };
    fetchLookups();
  }, []);

  React.useEffect(() => {
    let isActiveValue: boolean | undefined = undefined;
    if (filterActive === 'ACTIVE') isActiveValue = true;
    if (filterActive === 'INACTIVE') isActiveValue = false;

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.products.search({
          query: debouncedSearch,
          isActive: isActiveValue,
          limit,
          offset: (page - 1) * limit,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [debouncedSearch, filterActive, page, refreshTrigger]);

  const columns: ColumnDef<ProductDto>[] = [
    {
      key: 'itemDetails',
      header: 'Item Details',
      cell: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-muted-foreground text-xs">{item.sku || '-'}</div>
        </div>
      ),
    },
    {
      key: 'typeAndHsn',
      header: 'Type & HSN',
      cell: (item) => (
        <div>
          <div>{item.itemType.replace(/_/g, ' ')}</div>
          <div className="text-muted-foreground text-xs">HSN: {item.hsnCode || '-'}</div>
        </div>
      ),
    },
    {
      key: 'unitAndTax',
      header: 'Unit & Tax',
      cell: (item) => (
        <div>
          <div>{item.unitId && units[item.unitId] ? units[item.unitId].shortName : '-'}</div>
          <div className="text-muted-foreground text-xs">
            {item.taxId && taxes[item.taxId] ? taxes[item.taxId].name : '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'pricing',
      header: 'Pricing',
      className: 'text-right',
      cell: (item) => (
        <div>
          <div className="font-medium">{formatCurrency(item.salePrice)}</div>
          <div className="text-muted-foreground text-xs">
            Pur: {formatCurrency(item.purchasePrice)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <StatusBadge variant={item.isActive ? 'success' : 'secondary'}>
          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/items/${item.id}`)}
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </AppButton>
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id, item.name)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden px-6 py-6">
      <div className="mb-6 flex items-start justify-between">
        <SectionHeader
          title="Items"
          description="Manage your inventory, non-inventory, and service items."
        />
      </div>

      <div className="flex-1 overflow-auto">
        <DataTable
          data={data.data}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No items found."
          toolbar={{
            searchQuery,
            onSearchChange: (val) => {
              setSearchQuery(val);
              setPage(1);
            },
            placeholder: 'Search by Name, SKU, or HSN',
            actions: (
              <AppButton onClick={() => router.push('/dashboard/items/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </AppButton>
            ),
            filters: (
              <AppSelect
                value={filterActive}
                onChange={(e) => {
                  setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                  setPage(1);
                }}
                options={[
                  { label: 'All Items', value: 'ALL' },
                  { label: 'Active Items', value: 'ACTIVE' },
                  { label: 'Inactive Items', value: 'INACTIVE' },
                ]}
                className="w-48"
              />
            ),
          }}
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
