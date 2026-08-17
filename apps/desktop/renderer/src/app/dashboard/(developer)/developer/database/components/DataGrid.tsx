import React, { useState, useEffect } from 'react';

import { useDeveloperExplorer } from '../context/DeveloperExplorerContext';

import { Button } from '@/components/ui/button';
import { StatusBadge as Badge } from '@/components/ui/StatusBadge';

export function DataGrid() {
  const { selectedTable, page, pageSize, setTotalRows, setSelectedRow } = useDeveloperExplorer();

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedTable) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const result = await window.vyora.developerDatabase.getRows(selectedTable, page, pageSize);
        setData(result.rows as Record<string, unknown>[]);
        setTotalRows(result.total);
      } catch (err) {
        console.error('Error loading data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedTable, page, pageSize, setTotalRows]);

  const copyRow = (row: Record<string, unknown>, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    alert('Copied row as JSON'); // In a real scenario, use toast
  };

  if (loading && !data.length) {
    return <div className="text-muted-foreground p-8 text-center text-sm">Loading data...</div>;
  }

  if (!data.length) {
    return (
      <div className="text-muted-foreground p-8 text-center text-sm">
        No data available in this table.
      </div>
    );
  }

  const columns = Object.keys(data[0] || {}).filter((k) => k !== '_badges');

  return (
    <table className="divide-border min-w-full divide-y text-sm">
      <thead className="bg-muted/30 sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="text-muted-foreground w-12 px-4 py-2 text-left font-semibold">Act</th>
          <th className="text-muted-foreground px-4 py-2 text-left font-semibold">Badges</th>
          {columns.map((col) => (
            <th
              key={col}
              className="text-muted-foreground px-4 py-2 text-left font-semibold whitespace-nowrap"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-background divide-border divide-y">
        {data.map((row, i) => {
          const isDeleted = row.is_deleted === 1 || row.is_cancelled === 1;
          return (
            <tr
              key={i}
              className={`hover:bg-muted/50 cursor-pointer transition-colors ${isDeleted ? 'bg-destructive/5 opacity-75' : ''}`}
              onClick={() => setSelectedRow(row)}
            >
              <td className="px-4 py-2 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary h-6 px-2 text-[10px] uppercase"
                  onClick={(e: React.MouseEvent) => copyRow(row, e)}
                >
                  Copy
                </Button>
              </td>
              <td className="flex items-center gap-1 px-4 py-2 whitespace-nowrap">
                {Array.isArray(row._badges) &&
                  row._badges.map((badge: string, bIdx: number) => {
                    const [variant, label] = badge.split(':');
                    return (
                      <Badge
                        key={bIdx}
                        variant={
                          (variant as 'default' | 'secondary' | 'destructive' | 'outline') ||
                          'secondary'
                        }
                        className="font-mono text-[10px]"
                      >
                        {label || variant}
                      </Badge>
                    );
                  })}
              </td>
              {columns.map((col) => (
                <td key={col} className="text-muted-foreground px-4 py-2 whitespace-nowrap">
                  {String(row[col] ?? 'NULL')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
