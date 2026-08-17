import React, { useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { DeveloperWorkspaceConfig } from '../config/DeveloperWorkspaceConfig';
import { useDeveloperExplorer } from '../context/DeveloperExplorerContext';
import { DeveloperWorkspaceTab } from '../types';

import { DataGrid } from './DataGrid';
import { ExplorerSidebar } from './ExplorerSidebar';
import { ExplorerToolbar } from './ExplorerToolbar';
import { RelationInspector } from './RelationInspector';
import { SchemaViewer } from './SchemaViewer';
import { SqlConsole } from './SqlConsole';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge as Badge } from '@/components/ui/StatusBadge';

export function DeveloperExplorerLayout() {
  const { activeTab, setActiveTab, selectedTable, selectedRow } = useDeveloperExplorer();

  const [sidebarSize] = useState(() => {
    return (
      Number(localStorage.getItem('developer-sidebar-size')) ||
      DeveloperWorkspaceConfig.LAYOUT.SIDEBAR.defaultSize
    );
  });

  const [inspectorSize] = useState(() => {
    return (
      Number(localStorage.getItem('developer-inspector-size')) ||
      DeveloperWorkspaceConfig.LAYOUT.INSPECTOR.defaultSize
    );
  });

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-background z-10 flex-shrink-0 border-b px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <SectionHeader
            title="Developer Workspace"
            description="Inspect database structures, run SQL, and debug relations."
          />
          <div className="flex gap-2">
            <Badge variant="outline">vyora.vyr</Badge>
            <Badge variant="outline">SQLCipher</Badge>
            <Badge variant="warning">Read Only</Badge>
          </div>
        </div>

        <ExplorerToolbar />

        {/* Fixed Tabs */}
        <div className="mt-4 flex border-b">
          {Object.values(DeveloperWorkspaceTab).map((tabVal) => {
            const tab = tabVal as DeveloperWorkspaceTab;
            return (
              <button
                key={tab}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:border-border border-transparent'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {String(tab).charAt(0).toUpperCase() + String(tab).slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Area (Resizable Panels) */}
      <div className="bg-background min-h-0 w-full flex-1 overflow-hidden">
        <PanelGroup orientation="horizontal">
          {/* Sidebar */}
          <Panel
            defaultSize={sidebarSize}
            minSize={DeveloperWorkspaceConfig.LAYOUT.SIDEBAR.minSize}
            maxSize={DeveloperWorkspaceConfig.LAYOUT.SIDEBAR.maxSize}
            className="bg-muted/20 flex h-full min-w-0 flex-col border-r"
            onResize={(size) => {
              const width =
                typeof size === 'number' ? size : ((size as { inPixels?: number }).inPixels ?? 0);
              localStorage.setItem('developer-sidebar-size', width.toString());
            }}
          >
            <ExplorerSidebar />
          </Panel>

          <PanelResizeHandle className="bg-border hover:bg-primary/50 w-1 cursor-col-resize transition-colors" />

          {/* Main Content Area */}
          <Panel className="bg-background flex min-w-0 flex-col">
            <div className="h-full min-h-0 w-full max-w-full min-w-0 flex-1 overflow-auto">
              {activeTab === DeveloperWorkspaceTab.DATA && selectedTable && <DataGrid />}
              {activeTab === DeveloperWorkspaceTab.SCHEMA && selectedTable && (
                <SchemaViewer tableName={selectedTable} type="schema" />
              )}
              {activeTab === DeveloperWorkspaceTab.INDEXES && selectedTable && (
                <SchemaViewer tableName={selectedTable} type="indexes" />
              )}
              {activeTab === DeveloperWorkspaceTab.SQL && <SqlConsole />}
            </div>
          </Panel>

          {/* Relation Inspector (Only visible when DATA tab and row selected) */}
          {activeTab === DeveloperWorkspaceTab.DATA && selectedRow && (
            <>
              <PanelResizeHandle className="bg-border hover:bg-primary/50 w-1 cursor-col-resize transition-colors" />
              <Panel
                defaultSize={inspectorSize}
                minSize={DeveloperWorkspaceConfig.LAYOUT.INSPECTOR.minSize}
                maxSize={DeveloperWorkspaceConfig.LAYOUT.INSPECTOR.maxSize}
                className="bg-muted/10 flex h-full min-w-0 flex-col border-l shadow-lg"
                onResize={(size) => {
                  const width =
                    typeof size === 'number'
                      ? size
                      : ((size as { inPixels?: number }).inPixels ?? 0);
                  localStorage.setItem('developer-inspector-size', width.toString());
                }}
              >
                <div className="bg-muted/20 sticky top-0 z-10 flex items-center justify-between border-b p-4">
                  <h3 className="text-sm font-semibold">Relation Inspector</h3>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-4">
                  <RelationInspector />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <div className="bg-muted/40 text-muted-foreground flex h-8 shrink-0 items-center gap-6 border-t px-4 font-mono text-[11px]">
        <div className="flex items-center gap-1">
          <span className="font-semibold">Engine:</span> SQLCipher
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">Database:</span> vyora.vyr
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">Status:</span> Read Only
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">Zoom:</span> 100%
        </div>
      </div>
    </div>
  );
}
