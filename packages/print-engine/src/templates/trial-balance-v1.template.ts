export const trialBalanceTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Trial Balance</title>
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
    .error-banner {
      color: #721c24;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 10px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <!-- Replace with dynamic company name when passed in payload -->
    <div class="company-name">Vyora ERP</div>
    <div class="report-title">Trial Balance</div>
    <div class="meta">
      <p>Generated on: {{formatDate ''}}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ledger Name</th>
        <th class="text-right">Debit Balance</th>
        <th class="text-right">Credit Balance</th>
      </tr>
    </thead>
    <tbody>
      {{#if data.rows.length}}
        {{#each data.rows}}
        <tr>
          <td>{{this.ledgerName}}</td>
          <td class="text-right">{{formatCurrency this.debitTotal}}</td>
          <td class="text-right">{{formatCurrency this.creditTotal}}</td>
        </tr>
        {{/each}}
      {{else}}
        <tr>
          <td colspan="3" class="text-center">No balances to display.</td>
        </tr>
      {{/if}}
    </tbody>
    {{#if data.rows.length}}
    <tfoot>
      <tr class="totals">
        <td class="text-right">Grand Total</td>
        <td class="text-right">{{formatCurrency data.totalDebit}}</td>
        <td class="text-right">{{formatCurrency data.totalCredit}}</td>
      </tr>
    </tfoot>
    {{/if}}
  </table>

  {{#unless data.isBalanced}}
  <div class="error-banner">
    Warning: Trial Balance is not balanced! There is a difference between Total Debit and Total Credit.
  </div>
  {{/unless}}
</body>
</html>
`;
