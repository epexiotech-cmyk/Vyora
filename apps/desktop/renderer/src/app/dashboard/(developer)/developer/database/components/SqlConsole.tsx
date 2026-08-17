import React, { useState } from 'react';

export function SqlConsole() {
  const [sql, setSql] = useState('SELECT * FROM payment_accounts LIMIT 10;');
  const [result, setResult] = useState<Record<string, unknown>[]>([]);
  const [time, setTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const execute = async () => {
    setError(null);
    try {
      const { rows, timeMs } = await window.vyora.developerDatabase.executeQuery(sql);
      setResult(rows);
      setTime(timeMs);

      // Update history, keeping only last 20 unique
      setHistory((prev) => {
        const next = [sql, ...prev.filter((q) => q !== sql)].slice(0, 20);
        return next;
      });
    } catch (err: unknown) {
      setError((err as Error).message || String(err));
      setResult([]);
      setTime(null);
    }
  };

  const loadHistory = (query: string) => {
    setSql(query);
  };

  const columns = result.length > 0 ? Object.keys(result[0]) : [];

  return (
    <div className="flex h-full flex-col space-y-4 p-4">
      <div className="flex h-48 space-x-4">
        <div className="flex flex-1 flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Query (Read Only)</label>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="w-full flex-1 rounded border p-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="SELECT * FROM table..."
          />
          <div className="flex items-center justify-between">
            <button
              onClick={execute}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Execute
            </button>
            {time !== null && (
              <span className="text-sm text-gray-500">Execution time: {time.toFixed(2)}ms</span>
            )}
          </div>
        </div>
        <div className="flex w-64 flex-col rounded border bg-gray-50 shadow-sm">
          <div className="border-b p-2 text-sm font-medium">Query History (Last 20)</div>
          <div className="flex-1 overflow-auto p-2">
            {history.length === 0 && <div className="text-xs text-gray-400 italic">No history</div>}
            {history.map((q, i) => (
              <button
                key={i}
                onClick={() => loadHistory(q)}
                className="mb-1 w-full truncate rounded p-1 text-left text-xs text-gray-700 hover:bg-blue-100"
                title={q}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded border bg-white shadow-sm">
        <div className="border-b bg-gray-100 p-2 text-sm font-medium">Results</div>
        {error && (
          <div className="p-4 font-mono text-sm whitespace-pre-wrap text-red-600">{error}</div>
        )}
        {!error && result.length === 0 && (
          <div className="p-4 text-gray-500">No results to display.</div>
        )}
        {!error && result.length > 0 && (
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-gray-700">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {result.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-1 whitespace-nowrap text-gray-600">
                        {String(row[col] ?? 'NULL')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
