import Handlebars from 'handlebars';

export const receiptTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt Voucher</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .company-details {
      flex: 1;
    }
    .company-name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .voucher-title {
      font-size: 20pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #333;
      text-align: right;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .meta-box {
      border: 1px solid #ccc;
      padding: 10px;
      border-radius: 4px;
    }
    .meta-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .meta-value {
      font-weight: bold;
      font-size: 10pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    tfoot {
      display: table-footer-group;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
      text-align: left;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .totals-box {
      float: right;
      width: 300px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 10px;
      border-bottom: 1px solid #eee;
    }
    .totals-row:last-child {
      border-bottom: none;
      background-color: #f8f9fa;
      font-weight: bold;
    }
    .clearfix::after {
      content: "";
      clear: both;
      display: table;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-details">
      <div class="company-name">Vyora ERP</div>
      <div>Receipt Voucher</div>
    </div>
    <div class="voucher-title">RECEIPT</div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">Received From</div>
      <div class="meta-value">{{data.partyName}}</div>
      <div style="margin-top: 10px;">
        <span class="meta-label">Payment Account:</span> <span>{{data.paymentAccountName}}</span>
      </div>
    </div>
    <div class="meta-box">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <div>
          <div class="meta-label">Receipt No.</div>
          <div class="meta-value">{{data.settlementNumber}}</div>
        </div>
        <div>
          <div class="meta-label">Date</div>
          <div class="meta-value">{{formatDate data.settlementDate}}</div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <div>
          <div class="meta-label">Reference No.</div>
          <div class="meta-value">{{#if data.referenceNumber}}{{data.referenceNumber}}{{else}}-{{/if}}</div>
        </div>
        <div>
          <div class="meta-label">Reference Date</div>
          <div class="meta-value">{{#if data.referenceDate}}{{formatDate data.referenceDate}}{{else}}-{{/if}}</div>
        </div>
      </div>
    </div>
  </div>

  {{#if data.notes}}
  <div style="margin-bottom: 20px;">
    <strong>Notes:</strong> {{data.notes}}
  </div>
  {{/if}}

  {{#if data.allocations}}
  <table>
    <thead>
      <tr>
        <th>Document No</th>
        <th>Date</th>
        <th class="text-right">Invoice Total</th>
        <th class="text-right">Balance</th>
        <th class="text-right">Allocated</th>
      </tr>
    </thead>
    <tbody>
      {{#each data.allocations}}
      <tr>
        <td>{{this.documentNumber}}</td>
        <td>{{#if this.documentDate}}{{formatDate this.documentDate}}{{else}}-{{/if}}</td>
        <td class="text-right">{{#if this.documentTotal}}{{formatMoney this.documentTotal}}{{else}}-{{/if}}</td>
        <td class="text-right">{{#if this.documentBalance}}{{formatMoney this.documentBalance}}{{else}}-{{/if}}</td>
        <td class="text-right">{{formatMoney this.allocatedAmount}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{/if}}

  <div class="clearfix">
    <div class="totals-box">
      <div class="totals-row">
        <span>Total Allocated</span>
        <span>{{formatMoney data.allocatedAmount}}</span>
      </div>
      <div class="totals-row">
        <span>Unallocated</span>
        <span>{{formatMoney data.unallocatedAmount}}</span>
      </div>
      <div class="totals-row">
        <span>Total Receipt</span>
        <span>{{formatMoney data.amount}}</span>
      </div>
    </div>
  </div>

</body>
</html>
`;

export const template = Handlebars.compile(receiptTemplate);
