import React, { createContext, useContext, useState, ReactNode } from 'react';

import { DeveloperWorkspaceTab } from '../types';

export interface DeveloperExplorerState {
  tables: { name: string; rowCount: number }[];
  selectedTable: string | null;
  selectedRow: Record<string, unknown> | null;
  activeTab: DeveloperWorkspaceTab;
  page: number;
  pageSize: number;
  totalRows: number;
  setSelectedTable: (table: string | null) => void;
  setSelectedRow: (row: Record<string, unknown> | null) => void;
  setActiveTab: (tab: DeveloperWorkspaceTab) => void;
  setPage: (page: number) => void;
  setTotalRows: (total: number) => void;
}

const DeveloperExplorerContext = createContext<DeveloperExplorerState | undefined>(undefined);

export function DeveloperExplorerProvider({
  children,
  initialTables,
}: {
  children: ReactNode;
  initialTables: { name: string; rowCount: number }[];
}) {
  const [tables] = useState(initialTables);
  const [selectedTable, setSelectedTable] = useState<string | null>(
    initialTables.length > 0 ? initialTables[0].name : null,
  );
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState<DeveloperWorkspaceTab>(DeveloperWorkspaceTab.DATA);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);

  const handleSetSelectedTable = (table: string | null) => {
    setSelectedTable(table);
    setSelectedRow(null);
    setPage(1);
  };

  const value = {
    tables,
    selectedTable,
    selectedRow,
    activeTab,
    page,
    pageSize,
    totalRows,
    setSelectedTable: handleSetSelectedTable,
    setSelectedRow,
    setActiveTab,
    setPage,
    setTotalRows,
  };

  return (
    <DeveloperExplorerContext.Provider value={value}>{children}</DeveloperExplorerContext.Provider>
  );
}

export function useDeveloperExplorer() {
  const context = useContext(DeveloperExplorerContext);
  if (context === undefined) {
    throw new Error('useDeveloperExplorer must be used within a DeveloperExplorerProvider');
  }
  return context;
}
