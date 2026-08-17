import React, { useEffect, useState } from 'react';

import { DeveloperExplorerProvider } from '../context/DeveloperExplorerContext';

import { DeveloperExplorerLayout } from './DeveloperExplorerLayout';

export function DeveloperWorkspaceShell() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<{ name: string; rowCount: number }[]>([]);

  useEffect(() => {
    const initWorkspace = async () => {
      try {
        const isEnabled = await window.vyora.developer.isEnabled();
        if (!isEnabled) {
          setError('Developer features are not enabled.');
          return;
        }

        const data = await window.vyora.developerDatabase.listTables();
        setTables(data);
      } catch (err) {
        console.error('Failed to initialize Developer Workspace:', err);
        setError('Failed to load database metadata.');
      } finally {
        setLoading(false);
      }
    };

    initWorkspace();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-gray-500">
        Initializing Developer Workspace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-red-500">
        <h2 className="mb-2 text-lg font-bold">Workspace Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <DeveloperExplorerProvider initialTables={tables}>
      <DeveloperExplorerLayout />
    </DeveloperExplorerProvider>
  );
}
