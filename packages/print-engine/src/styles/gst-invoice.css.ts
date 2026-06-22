export const gstInvoiceCss = `
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11px;
    line-height: 1.4;
    color: #333;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .container {
    width: 100%;
    border: 1px solid #000;
  }

  .header-title {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    border-bottom: 1px solid #000;
    padding: 5px;
    background-color: #f9f9f9;
  }

  .row {
    display: flex;
    border-bottom: 1px solid #000;
    page-break-inside: avoid;
  }

  .col-50 {
    width: 50%;
    padding: 10px;
  }

  .col-right {
    border-left: 1px solid #000;
  }

  .strong { 
    font-weight: bold; 
  }
  
  .text-right { 
    text-align: right; 
  }
  
  .text-center { 
    text-align: center; 
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  th, td {
    border: 1px solid #000;
    padding: 6px;
  }

  th {
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: center;
  }

  .no-border-top { border-top: none; }
  .no-border-bottom { border-bottom: none; }

  .summary-table {
    width: 100%;
    margin-top: 10px;
  }

  .summary-table th, .summary-table td {
    border: none;
    padding: 4px;
  }

  .footer-row {
    display: flex;
    min-height: 100px;
    page-break-inside: avoid;
  }

  .declaration {
    width: 60%;
    padding: 10px;
    font-size: 10px;
  }

  .signature {
    width: 40%;
    border-left: 1px solid #000;
    padding: 10px;
    text-align: right;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .amount-words {
    padding: 10px;
    border-bottom: 1px solid #000;
    font-weight: bold;
  }
`;
