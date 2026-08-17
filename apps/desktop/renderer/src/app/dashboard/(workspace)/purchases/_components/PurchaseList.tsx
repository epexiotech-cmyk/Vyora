'use client';

import { PurchaseListDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppButton } from '@/components/ui/AppButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';

export function PurchaseList() {
  const router = useRouter();
  const { context } = useCompanyContext();

  const [data, setData] = React.useState<PurchaseListDto>({ data: [], total: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [filterStatus, setFilterStatus] = React.useState<
    'ALL' | 'DRAFT' | 'SUBMITTED' | 'CANCELLED'
  >('ALL');
  const [page, setPage] = React.useState(0);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const limit = 20;

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete purchase "${code}"?`)) {
      try {
        const res = await window.vyora.db.purchases.delete(id);
        if (res.success) {
          alert('Purchase deleted successfully.');
          setRefreshTrigger((prev) => prev + 1);
        } else {
          alert(res.error || 'Failed to delete purchase.');
        }
      } catch {
        alert('An unexpected error occurred while deleting.');
      }
    }
  };

  React.useEffect(() => {
    let statusValue: 'DRAFT' | 'SUBMITTED' | 'CANCELLED' | undefined = undefined;
    if (filterStatus !== 'ALL') statusValue = filterStatus;

    const fetchPurchases = async () => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.purchases.search({
          query: debouncedSearch,
          status: statusValue,
          limit,
          offset: page * limit,
        });
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch purchases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, [debouncedSearch, filterStatus, page, refreshTrigger]);

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="bg-bg-secondary border-border/50 flex flex-col items-start justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center">
        <div className="flex w-full flex-1 items-center gap-4 md:w-auto">
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search purchases by code, bill no..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="border-border bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border py-2 pr-4 pl-9 text-sm transition-all outline-none focus:ring-2"
            />
          </div>

          {/* Status Filter */}
          <div className="relative hidden items-center sm:flex">
            <Filter className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as 'ALL' | 'DRAFT' | 'SUBMITTED' | 'CANCELLED');
                setPage(0);
              }}
              className="border-border bg-background focus:border-primary focus:ring-primary/20 appearance-none rounded-md border py-2 pr-8 pl-9 text-sm transition-all outline-none focus:ring-2"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full items-center gap-2 md:w-auto">
          <AppButton
            data-testid="create-purchase-btn"
            onClick={() => router.push('/dashboard/purchases/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Purchase
          </AppButton>
        </div>
      </div>

      {/* List / Table */}
      <div className="border-border/50 bg-bg-secondary w-full overflow-hidden rounded-lg border">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-border/50 text-muted-foreground border-b uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Code / Date</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Supplier Bill No</th>
                <th className="px-4 py-3 text-right font-medium">Grand Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"></div>
                      <span className="text-muted-foreground text-sm">Loading purchases...</span>
                    </div>
                  </td>
                </tr>
              ) : data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground py-8 text-center">
                    {searchQuery
                      ? 'No purchases found matching your search.'
                      : 'No purchases found. Create one to get started.'}
                  </td>
                </tr>
              ) : (
                data.data.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-border/50 hover:bg-muted/30 group border-b transition-colors last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{purchase.purchaseNumber}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground font-medium">{purchase.supplierName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-muted-foreground">
                        {purchase.supplierInvoiceNumber || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(purchase.grandTotal, context?.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={
                          purchase.status === 'SUBMITTED'
                            ? 'success'
                            : purchase.status === 'DRAFT'
                              ? 'warning'
                              : 'destructive'
                        }
                      >
                        {purchase.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {purchase.status !== 'DRAFT' && (
                          <button
                            onClick={() =>
                              router.push(`/dashboard/purchases/view?id=${purchase.id}`)
                            }
                            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                            title="View Details"
                          >
                            <Search className="h-4 w-4" />
                          </button>
                        )}
                        {purchase.status === 'DRAFT' && (
                          <button
                            onClick={() =>
                              router.push(`/dashboard/purchases/edit?id=${purchase.id}`)
                            }
                            className="text-muted-foreground hover:text-primary p-1 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {purchase.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDelete(purchase.id, purchase.purchaseNumber)}
                            className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="border-border/50 flex items-center justify-between border-t px-4 py-3 text-sm">
            <div className="text-muted-foreground">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of{' '}
              {data.total}
            </div>
            <div className="flex gap-1">
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </AppButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
