export const balanceSheetTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Balance Sheet</title>
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
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
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
    th, td {
      border: 1px solid #ccc;
      padding: 6px 8px;
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
    .group-row {
      font-weight: bold;
      background-color: #fcfcfc;
    }
    .ledger-row {
      color: #333;
    }
    .balance-status {
      margin-top: 30px;
      padding: 15px;
      border: 2px solid #000;
      text-align: center;
      page-break-inside: avoid;
    }
    .balance-status.balanced {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    .balance-status.unbalanced {
      background-color: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }
    .status-title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .status-amount {
      font-size: 18pt;
      font-weight: bold;
    }
  </style>
</head>
<body>

  {{#*inline "groupPartial"}}
    <tr class="group-row">
      <td style="padding-left: {{math 8 '+' (math depth '*' 15)}}px;">
        {{group.groupName}}
      </td>
      <td class="text-right">{{formatCurrency group.totalBalance.amount}} {{group.totalBalance.type}}</td>
    </tr>
    {{#each group.ledgers}}
    <tr class="ledger-row">
      <td style="padding-left: {{math 24 '+' (math ../depth '*' 15)}}px;">
        {{this.ledgerName}}
      </td>
      <td class="text-right">{{formatCurrency this.balance.amount}} {{this.balance.type}}</td>
    </tr>
    {{/each}}
    {{#each group.subGroups}}
      {{> groupPartial group=this depth=(math ../depth '+' 1)}}
    {{/each}}
  {{/inline}}

  <div class="header">
    <div class="company-name">Vyora ERP</div>
    <div class="report-title">Balance Sheet</div>
    <div class="meta">
      <p>As of {{formatDate data.asOfDate}}</p>
    </div>
  </div>

  <div class="section-title">Assets</div>
  <table>
    <thead>
      <tr>
        <th>Particulars</th>
        <th class="text-right" style="width: 150px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#if data.assetGroups.length}}
        {{#each data.assetGroups}}
          {{> groupPartial group=this depth=0}}
        {{/each}}
      {{else}}
        <tr>
          <td colspan="2" class="text-center">No asset entries.</td>
        </tr>
      {{/if}}
    </tbody>
    <tfoot>
      <tr class="totals">
        <td class="text-right">Total Assets</td>
        <td class="text-right">{{formatCurrency data.totalAssets.amount}} {{data.totalAssets.type}}</td>
      </tr>
    </tfoot>
  </table>

  <div class="section-title">Liabilities</div>
  <table>
    <thead>
      <tr>
        <th>Particulars</th>
        <th class="text-right" style="width: 150px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#if data.liabilityGroups.length}}
        {{#each data.liabilityGroups}}
          {{> groupPartial group=this depth=0}}
        {{/each}}
      {{else}}
        <tr>
          <td colspan="2" class="text-center">No liability entries.</td>
        </tr>
      {{/if}}
    </tbody>
    <tfoot>
      <tr class="totals">
        <td class="text-right">Total Liabilities</td>
        <td class="text-right">{{formatCurrency data.totalLiabilities.amount}} {{data.totalLiabilities.type}}</td>
      </tr>
    </tfoot>
  </table>

  <div class="section-title">Equity</div>
  <table>
    <thead>
      <tr>
        <th>Particulars</th>
        <th class="text-right" style="width: 150px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#if data.equityGroups.length}}
        {{#each data.equityGroups}}
          {{> groupPartial group=this depth=0}}
        {{/each}}
      {{else}}
        <tr>
          <td colspan="2" class="text-center">No equity entries.</td>
        </tr>
      {{/if}}
    </tbody>
    <tfoot>
      <tr class="totals">
        <td class="text-right">Total Equity</td>
        <td class="text-right">{{formatCurrency data.totalEquity.amount}} {{data.totalEquity.type}}</td>
      </tr>
    </tfoot>
  </table>

  <div class="balance-status {{#if data.isBalanced}}balanced{{else}}unbalanced{{/if}}">
    <div class="status-title">
      {{#if data.isBalanced}}
        &#10003; Balance Sheet Balanced
      {{else}}
        &#9888; Warning: Balance Sheet Not Balanced
      {{/if}}
    </div>
    {{#unless data.isBalanced}}
      <div class="status-amount">Difference: {{formatCurrency data.difference.amount}} {{data.difference.type}}</div>
    {{/unless}}
  </div>

</body>
</html>
`;
