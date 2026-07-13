export const ledgerStatementTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Ledger Statement</title>
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
    .ledger-section {
      margin-bottom: 30px;
    }
    .ledger-header {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
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
    .totals {
      font-weight: bold;
      background-color: #f8f9fa;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Vyora ERP</div>
    <div class="report-title">Ledger Statement</div>
    <div class="meta">
      <p>Financial Year: {{data.financialYearId}} | Generated on: {{formatDate ''}}</p>
    </div>
  </div>

  <div class="ledger-section">
    <div class="ledger-header">
      {{data.ledgerId}}
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Voucher Type</th>
          <th>Voucher No</th>
          <th>Narration</th>
          <th class="text-right">Debit</th>
          <th class="text-right">Credit</th>
          <th class="text-right">Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr class="totals">
          <td colspan="4" class="text-right">Opening Balance</td>
          <td class="text-right"></td>
          <td class="text-right"></td>
          <td class="text-right">{{formatCurrency data.openingBalance.amount}} {{data.openingBalance.type}}</td>
        </tr>
        {{#each data.entries}}
        <tr>
          <td>{{formatDate this.voucherDate}}</td>
          <td>{{this.voucherType}}</td>
          <td>{{this.voucherNumber}}</td>
          <td>{{this.narration}}</td>
          <td class="text-right">{{#if this.debitAmount}}{{formatCurrency this.debitAmount}}{{/if}}</td>
          <td class="text-right">{{#if this.creditAmount}}{{formatCurrency this.creditAmount}}{{/if}}</td>
          <td class="text-right">{{#if this.runningBalance}}{{formatCurrency this.runningBalance.amount}} {{this.runningBalance.type}}{{/if}}</td>
        </tr>
        {{/each}}
      </tbody>
      <tfoot>
        <tr class="totals">
          <td colspan="4" class="text-right">Closing Balance</td>
          <td class="text-right"></td>
          <td class="text-right"></td>
          <td class="text-right">{{formatCurrency data.closingBalance.amount}} {{data.closingBalance.type}}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</body>
</html>
`;
