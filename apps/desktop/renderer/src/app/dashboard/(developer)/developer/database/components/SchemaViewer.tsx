import React, { useState, useEffect } from 'react';

interface SchemaViewerProps {
  tableName: string;
  type: 'schema' | 'indexes';
}

export function SchemaViewer({ tableName, type }: SchemaViewerProps) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (type === 'schema') {
          const schema = await window.vyora.developerDatabase.getTableSchema(tableName);
          setData(schema);
        } else {
          const indexes = await window.vyora.developerDatabase.getIndexes(tableName);
          setData(indexes);
        }
      } catch (err) {
        console.error('Error loading schema/indexes', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tableName, type]);

  if (loading && !data.length) return <div className="p-4">Loading...</div>;
  if (!data.length) return <div className="p-4">No data</div>;

  const columns = Object.keys(data[0] || {});

  return (
    <div className="h-full flex-1 overflow-auto p-4">
      <table className="min-w-full divide-y divide-gray-200 rounded border text-sm shadow-sm">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-700 uppercase"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 whitespace-nowrap text-gray-600">
                  {String(row[col] ?? 'NULL')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
