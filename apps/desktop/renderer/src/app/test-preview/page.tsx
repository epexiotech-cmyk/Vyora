'use client';

import React, { useState } from 'react';

import { PrintPreview } from '../../components/print/PrintPreview';

const sampleHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: sans-serif; padding: 40px; color: #333; }
      h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
      .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
      table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; margin-top: 20px; }
      table td, table th { padding: 12px; border: 1px solid #ddd; }
      table th { background: #f9fafb; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="invoice-box">
      <h1>Invoice #12345</h1>
      <p>Date: June 4, 2026</p>
      <table>
        <tr>
          <th>Item</th>
          <th>Price</th>
        </tr>
        <tr>
          <td>Website design</td>
          <td>$300.00</td>
        </tr>
        <tr>
          <td>Hosting (3 months)</td>
          <td>$75.00</td>
        </tr>
      </table>
    </div>
  </body>
  </html>
`;

export default function TestPreviewPage() {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex h-screen w-full flex-col gap-4 bg-neutral-50 p-4">
      <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">Print Preview Test Harness</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Zoom:</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="w-12 text-sm">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border shadow-sm">
        <PrintPreview html={sampleHtml} title="Sample Invoice Test" zoom={zoom} />
      </div>
    </div>
  );
}
