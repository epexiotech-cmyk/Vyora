export type InventoryHealthStatus = 'NEGATIVE' | 'ZERO' | 'LOW' | 'IN_STOCK';

export function getInventoryHealthStatus(
  currentQty: number,
  reorderLevel: number,
): InventoryHealthStatus {
  if (currentQty < 0) {
    return 'NEGATIVE';
  }

  if (currentQty === 0) {
    return 'ZERO';
  }

  // Edge case: if reorderLevel is 0, any positive stock is IN_STOCK
  // Otherwise, if it's within the reorderLevel threshold, it's LOW
  if (reorderLevel > 0 && currentQty <= reorderLevel) {
    return 'LOW';
  }

  return 'IN_STOCK';
}
