import { useState, useEffect } from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function DevToolsUI() {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <SectionHeader
        title="Developer Tools"
        description="These tools are strictly for development environments."
      />

      <div className="flex space-x-4 border-b border-gray-200">
        <TabButton id="inventory" label="Inventory" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton
          id="documentNumbering"
          label="Document Numbering"
          activeTab={activeTab}
          onClick={setActiveTab}
        />
        <TabButton
          id="diagnostics"
          label="Diagnostics"
          activeTab={activeTab}
          onClick={setActiveTab}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'documentNumbering' && <DocumentNumberingTab />}
        {activeTab === 'diagnostics' && <DiagnosticsTab />}
      </div>
    </div>
  );
}

function TabButton({
  id,
  label,
  activeTab,
  onClick,
}: {
  id: string;
  label: string;
  activeTab: string;
  onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`border-b-2 px-1 pb-2 text-sm font-medium ${
        activeTab === id
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function InventoryTab() {
  const [mismatches, setMismatches] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [message, setMessage] = useState('');

  const checkIntegrity = async () => {
    setLoading(true);
    const res = await (
      window as unknown as {
        vyora: {
          dev: { inventory: { check: () => Promise<{ success: boolean; data: unknown }> } };
        };
      }
    ).vyora.dev.inventory.check();
    setLoading(false);
    if (res.success) {
      setMismatches(res.data as Record<string, unknown>[]);
    }
  };

  const rebuild = async () => {
    setRebuildLoading(true);
    const res = await (
      window as unknown as {
        vyora: {
          dev: { inventory: { rebuild: () => Promise<{ success: boolean; data: unknown }> } };
        };
      }
    ).vyora.dev.inventory.rebuild();
    setRebuildLoading(false);
    if (res.success) {
      setMessage('Inventory rebuilt successfully');
      checkIntegrity(); // Recheck
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex space-x-4">
        <AppButton onClick={checkIntegrity} disabled={loading}>
          {loading ? 'Checking...' : 'Check Integrity'}
        </AppButton>
        <AppButton onClick={rebuild} disabled={rebuildLoading} variant="outline">
          {rebuildLoading ? 'Rebuilding...' : 'Rebuild Inventory Balances'}
        </AppButton>
      </div>

      {message && <p className="font-medium text-green-600">{message}</p>}

      {mismatches !== null && (
        <AppCard title="Integrity Check Results">
          {mismatches.length === 0 ? (
            <p className="text-green-600">
              ✅ All inventory balances are perfectly synced with stock movements.
            </p>
          ) : (
            <div>
              <p className="mb-4 text-red-600">Found {mismatches.length} mismatch(es):</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Product ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Expected Qty
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actual Qty
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Diff
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mismatches.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {m.productId as React.ReactNode}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {m.expectedQty as React.ReactNode}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {m.actualQty as React.ReactNode}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-red-600">
                          {(m.expectedQty as number) - (m.actualQty as number)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </AppCard>
      )}
    </div>
  );
}

function DocumentNumberingTab() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetSeq = async () => {
    setLoading(true);
    const res = await (
      window as unknown as {
        vyora: {
          dev: { documentNumbering: { reset: () => Promise<{ success: boolean; data: unknown }> } };
        };
      }
    ).vyora.dev.documentNumbering.reset();
    setLoading(false);
    if (res.success) {
      setMessage('Document Numbering Sequences reset successfully.');
    }
  };

  return (
    <div className="max-w-2xl">
      <AppCard title="Document Numbering Reset">
        <p className="mb-4 text-sm text-gray-600">
          Deletes all active numbering sequence counters so the next invoice starts from the
          beginning again.
        </p>
        <AppButton onClick={resetSeq} disabled={loading} variant="destructive">
          {loading ? 'Resetting...' : 'Reset Sequences'}
        </AppButton>
        {message && <p className="mt-4 font-medium text-green-600">{message}</p>}
      </AppCard>
    </div>
  );
}

function DiagnosticsTab() {
  const [diag, setDiag] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (
      window as unknown as {
        vyora: {
          dev: {
            getDiagnostics: () => Promise<{ success: boolean; data: Record<string, unknown> }>;
          };
        };
      }
    ).vyora.dev
      .getDiagnostics()
      .then((res) => {
        if (res.success) setDiag(res.data);
      });
  }, []);

  if (!diag) return <p>Loading diagnostics...</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <AppCard title="System Diagnostics">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">App Version:</span>{' '}
            {diag.appVersion as React.ReactNode}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Platform:</span>{' '}
            {diag.platform as React.ReactNode}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Electron Version:</span>{' '}
            {diag.electronVersion as React.ReactNode}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Node Version:</span>{' '}
            {diag.nodeVersion as React.ReactNode}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Active Company ID:</span>{' '}
            {(diag.activeCompanyId as React.ReactNode) || 'None'}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Active FY ID:</span>{' '}
            {(diag.activeFinancialYearId as React.ReactNode) || 'None'}
          </div>
        </div>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="mb-2 text-sm">
            <span className="font-semibold text-gray-700">Database Path:</span>{' '}
            {diag.databasePath as React.ReactNode}
          </div>
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Database Size:</span>{' '}
            {((diag.databaseSizeBytes as number) / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
      </AppCard>

      <AppCard title="Table Counts">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(diag.tableCounts as Record<string, number>).map(([table, count]) => (
            <div key={table} className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">{table}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </AppCard>
    </div>
  );
}
