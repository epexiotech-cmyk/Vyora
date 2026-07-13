export const outstandingTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Outstanding Report</title>
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
    .totals {
      font-weight: bold;
      background-color: #f8f9fa;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Vyora ERP</div>
    <div class="report-title">{{#if (eq data.reportType 'CUSTOMER')}}Customer Outstanding{{else}}Supplier Outstanding{{/if}}</div>
    <div class="meta">
      <p>Financial Year: {{data.financialYearId}} | Generated on: {{formatDate ''}}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ledger Name</th>
        {{#if data.rows.[0].current}}
        <th class="text-right">Current</th>
        <th class="text-right">30 Days</th>
        <th class="text-right">60 Days</th>
        <th class="text-right">90 Days</th>
        <th class="text-right">90+ Days</th>
        {{/if}}
        <th class="text-right">Total Balance</th>
      </tr>
    </thead>
    <tbody>
      {{#if data.rows.length}}
        {{#each data.rows}}
        <tr>
          <td>{{this.ledgerName}}</td>
          {{#if this.current}}
          <td class="text-right">{{formatCurrency this.current.amount}} {{this.current.type}}</td>
          <td class="text-right">{{formatCurrency this.days30.amount}} {{this.days30.type}}</td>
          <td class="text-right">{{formatCurrency this.days60.amount}} {{this.days60.type}}</td>
          <td class="text-right">{{formatCurrency this.days90.amount}} {{this.days90.type}}</td>
          <td class="text-right">{{formatCurrency this.days90Plus.amount}} {{this.days90Plus.type}}</td>
          {{/if}}
          <td class="text-right">{{formatCurrency this.closingBalance.amount}} {{this.closingBalance.type}}</td>
        </tr>
        {{/each}}
      {{else}}
        <tr>
          <td colspan="7" class="text-center">No outstanding balances to display.</td>
        </tr>
      {{/if}}
    </tbody>
    {{#if data.rows.length}}
    <tfoot>
      <tr class="totals">
        <td class="text-right" {{#if data.rows.[0].current}}colspan="6"{{/if}}>Grand Total</td>
        <td class="text-right">{{formatCurrency data.totalBalance.amount}} {{data.totalBalance.type}}</td>
      </tr>
    </tfoot>
    {{/if}}
  </table>
</body>
</html>
`;
