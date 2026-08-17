import React, { useState, useEffect } from 'react';

import { useDeveloperExplorer } from '../context/DeveloperExplorerContext';

import { StatusBadge as Badge } from '@/components/ui/StatusBadge';

export function RelationInspector() {
  const { selectedTable, selectedRow } = useDeveloperExplorer();

  const [relations, setRelations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedTable || !selectedRow) return;

    const loadRelations = async () => {
      setLoading(true);
      try {
        const data = await window.vyora.developerDatabase.getRelations(selectedTable, selectedRow);
        setRelations(data);
      } catch (err) {
        console.error('Error loading relations', err);
      } finally {
        setLoading(false);
      }
    };
    loadRelations();
  }, [selectedTable, selectedRow]);

  if (loading) {
    return (
      <div className="text-muted-foreground animate-pulse p-6 text-center text-sm">
        Loading relations...
      </div>
    );
  }

  if (!relations || relations.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col gap-4 p-6 text-center text-sm">
        <p>No related records found.</p>
        <span className="bg-muted/30 rounded-md p-4 text-xs italic">
          (Note: Business inspectors need to be registered in the InspectorRegistry to populate this
          panel.)
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 p-4">
      {relations.map((rel, i) => (
        <div key={i} className="border-border bg-background overflow-hidden rounded-md border">
          <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2">
            <span className="text-foreground text-sm font-semibold">{String(rel.type)}</span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {String(rel.label)}
            </Badge>
          </div>
          <div className="flex flex-col gap-2 p-4 text-sm">
            <div className="border-border/50 mb-1 flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">ID</span>
              <span className="text-foreground bg-muted/50 rounded px-1.5 py-0.5 font-mono text-xs">
                {String(rel.id)}
              </span>
            </div>
            {rel.metadata
              ? Object.entries(rel.metadata as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground flex-shrink-0 capitalize">{k}</span>
                    <span
                      className="text-foreground truncate text-right font-medium"
                      title={String(v)}
                    >
                      {String(v)}
                    </span>
                  </div>
                ))
              : null}
          </div>
        </div>
      ))}
    </div>
  );
}
