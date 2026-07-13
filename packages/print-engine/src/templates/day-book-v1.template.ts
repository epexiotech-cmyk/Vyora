export const dayBookTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Day Book</title>
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
      text-align: center;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .report-title {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .meta {
      font-size: 9pt;
      color: #444;
      margin-bottom: 20px;
    }
    .voucher-section {
      margin-bottom: 20px;
    }
    .voucher-header {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 5px;
      background-color: #f1f3f5;
      padding: 4px;
      border: 1px solid #ccc;
      border-bottom: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
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
      padding: 6px;
      font-size: 9pt;
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
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Vyora ERP</div>
    <div class="report-title">Day Book</div>
    <div class="meta">
      <p>Financial Year: {{data.financialYearId}} | Generated on: {{formatDate ''}}</p>
    </div>
  </div>

  {{#each data.vouchers}}
  <div class="voucher-section">
    <div class="voucher-header">
      {{this.voucherType}} - {{this.voucherNumber}} | Date: {{formatDate this.voucherDate}}
    </div>
    <table>
      <thead>
        <tr>
          <th>Ledger Name</th>
          <th>Narration</th>
          <th class="text-right">Debit</th>
          <th class="text-right">Credit</th>
        </tr>
      </thead>
      <tbody>
        {{#each this.entries}}
        <tr>
          <td>{{this.ledgerName}}</td>
          <td>{{this.narration}}</td>
          <td class="text-right">{{#if this.debitAmount}}{{formatCurrency this.debitAmount}}{{/if}}</td>
          <td class="text-right">{{#if this.creditAmount}}{{formatCurrency this.creditAmount}}{{/if}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/each}}

  {{#unless data.vouchers.length}}
  <p class="text-center">No day book entries available for this period.</p>
  {{/unless}}
</body>
</html>
`;
