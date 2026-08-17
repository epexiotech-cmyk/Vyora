import React from 'react';

import { useDeveloperExplorer } from '../context/DeveloperExplorerContext';

import { StatusBadge as Badge } from '@/components/ui/StatusBadge';

export function ExplorerSidebar() {
  const { tables, selectedTable, setSelectedTable } = useDeveloperExplorer();

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="bg-muted/40 sticky top-0 border-b p-3 font-medium">Tables</div>
      <ul className="flex-1 overflow-auto py-2">
        {tables.map((t: { name: string; rowCount: number }) => (
          <li key={t.name}>
            <button
              onClick={() => setSelectedTable(t.name)}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                selectedTable === t.name
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="mr-2 truncate">{t.name}</span>
              <Badge variant="secondary" className="h-5 flex-shrink-0 px-1.5 font-mono text-[10px]">
                {t.rowCount}
              </Badge>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
