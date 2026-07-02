'use client';

import {
  InventoryStockDto,
  ProductDto,
  StockMovementDto,
  ProductStockStatusDto,
} from '@vyora/types';
import { ArrowLeft, History, Loader2, Package, Tag, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { InventoryLedgerTable } from './InventoryLedgerTable';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard, AppCardContent, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount / 100);

interface InventoryDetailPageProps {
  productId: string;
}

export function InventoryDetailPage({ productId }: InventoryDetailPageProps) {
  const router = useRouter();

  const [product, setProduct] = React.useState<ProductDto | null>(null);
  const [stockSummary, setStockSummary] = React.useState<ProductStockStatusDto | null>(null);
  const [currentStock, setCurrentStock] = React.useState<InventoryStockDto | null>(null);
  const [ledger, setLedger] = React.useState<StockMovementDto[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        // Fetch product details
        const prodRes = await window.vyora.db.products.getById(productId);
        if (!prodRes.success || !prodRes.data) {
          if (mounted) setErrorMsg('Product not found.');
          return;
        }
        if (mounted) setProduct(prodRes.data);

        // Fetch Inventory Data Concurrently
        const [summaryRes, stockRes, ledgerRes] = await Promise.all([
          window.vyora.inventory.getStockSummary(productId),
          window.vyora.inventory.getStock(productId),
          window.vyora.inventory.getLedger(productId),
        ]);

        if (mounted) {
          if (summaryRes.success && summaryRes.data) setStockSummary(summaryRes.data);
          if (stockRes.success && stockRes.data) setCurrentStock(stockRes.data);
          if (ledgerRes.success && ledgerRes.data) setLedger(ledgerRes.data);
        }
      } catch (err: unknown) {
        if (mounted)
          setErrorMsg(
            'Failed to load inventory data: ' + ((err as Error).message || 'Unknown error'),
          );
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <p className="text-destructive font-medium">{errorMsg || 'Product not found.'}</p>
        <AppButton variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </AppButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <AppButton variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </AppButton>
        <SectionHeader
          title={`Inventory: ${product.name}`}
          description={`SKU: ${product.sku || 'N/A'}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AppCard>
          <AppCardContent className="flex flex-col gap-2 p-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Current Stock</span>
              <Package className="text-primary h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{currentStock ? currentStock.stock : 0}</div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardContent className="flex flex-col gap-2 p-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Inventory Value</span>
              <Wallet className="text-primary h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">
              {stockSummary ? formatCurrency(stockSummary.totalValue) : formatCurrency(0)}
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardContent className="flex flex-col gap-2 p-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">
                Weighted Avg Cost (WAC)
              </span>
              <Tag className="text-primary h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">
              {stockSummary ? formatCurrency(stockSummary.wac) : formatCurrency(0)}
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardContent className="flex flex-col gap-2 p-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Total Movements</span>
              <History className="text-primary h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{ledger.length}</div>
          </AppCardContent>
        </AppCard>
      </div>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>Item Ledger</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <InventoryLedgerTable ledger={ledger} isLoading={isLoading} />
        </AppCardContent>
      </AppCard>
    </div>
  );
}
