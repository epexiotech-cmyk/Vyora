import { SalesInvoiceDto, SalesInvoiceLineDto } from '@vyora/types';

import { PrintPayload, TemplateDefinition } from '../types';
import { formatCurrencyINR } from '../utils/formatCurrency';
import { numberToWordsINR } from '../utils/numberToWords';

export const GstInvoiceV1: TemplateDefinition<SalesInvoiceDto> = {
  metadata: {
    id: 'gst-invoice-v1',
    name: 'Standard GST Invoice',
    version: '1.0.0',
    description: 'Production-ready GST compliant tax invoice template',
    supportedDocumentTypes: ['TAX_INVOICE'],
  },
  render: async (payload: PrintPayload<SalesInvoiceDto>): Promise<string> => {
    const data = payload.data;

    const formatDate = (dateString?: string | Date) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const items = data.items || [];

    const fmt = (amount: number | null | undefined) =>
      formatCurrencyINR(amount, payload.currencyMeta);

    // Calculate Tax Summary
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const itemsHtml = items
      .map((item: SalesInvoiceLineDto, index: number) => {
        totalCgst += item.cgstAmount || 0;
        totalSgst += item.sgstAmount || 0;
        totalIgst += item.igstAmount || 0;

        return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${item.description || ''}</td>
          <td class="text-center">${item.hsnCode || ''}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${fmt(item.rate)}</td>
          <td class="text-right">${fmt(item.taxableAmount)}</td>
          <td class="text-right">${fmt(item.cgstAmount || 0)} <br/><small>(${item.cgstRateSnapshot || 0}%)</small></td>
          <td class="text-right">${fmt(item.sgstAmount || 0)} <br/><small>(${item.sgstRateSnapshot || 0}%)</small></td>
          <td class="text-right">${fmt(item.igstAmount || 0)} <br/><small>(${item.igstRateSnapshot || 0}%)</small></td>
          <td class="text-right">${fmt(item.lineTotal)}</td>
        </tr>
      `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Tax Invoice</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              font-size: 11px; 
              line-height: 1.4; 
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              width: 100%;
              border: 1px solid #000;
              box-sizing: border-box;
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
            }
            .col-50 {
              width: 50%;
              padding: 10px;
              box-sizing: border-box;
            }
            .col-right {
              border-left: 1px solid #000;
            }
            .strong { font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            table {
              width: 100%;
              border-collapse: collapse;
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
            }
            .declaration {
              width: 60%;
              padding: 10px;
              box-sizing: border-box;
              font-size: 10px;
            }
            .signature {
              width: 40%;
              border-left: 1px solid #000;
              padding: 10px;
              box-sizing: border-box;
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
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header-title">TAX INVOICE</div>
              
              <div class="row">
                  <div class="col-50">
                      <div class="strong" style="font-size: 14px;">${data.companyNameSnapshot || ''}</div>
                      <div>${data.companyAddressSnapshot || ''}</div>
                      <div><span class="strong">GSTIN/UIN:</span> ${data.companyGstinSnapshot || ''}</div>
                      <div><span class="strong">State Name:</span> ${data.companyStateNameSnapshot || ''}, <span class="strong">Code:</span> ${data.companyStateCodeSnapshot || ''}</div>
                      <div><span class="strong">PAN:</span> ${data.companyPanSnapshot || ''}</div>
                  </div>
                  <div class="col-50 col-right">
                      <div><span class="strong">Invoice No:</span> ${data.invoiceNumber || ''}</div>
                      <div><span class="strong">Invoice Date:</span> ${formatDate(data.invoiceDate)}</div>
                      <div><span class="strong">Place of Supply:</span> ${data.placeOfSupplyCode || ''}</div>
                      <div><span class="strong">Reverse Charge:</span> ${data.isReverseCharge ? 'Y' : 'N'}</div>
                  </div>
              </div>
              
              <div class="row">
                  <div class="col-50">
                      <div class="strong">Billed To:</div>
                      <div>${data.billingName || ''}</div>
                      <div>${data.billingAddress || ''}</div>
                      <div>${data.billingCity || ''}${data.billingDistrict ? `, ${data.billingDistrict}` : ''} - ${data.billingPincode || ''}</div>
                      <div><span class="strong">GSTIN/UIN:</span> ${data.billingGstin || ''}</div>
                      <div><span class="strong">State Code:</span> ${data.billingStateCode || ''}</div>
                  </div>
                  <div class="col-50 col-right">
                      <div class="strong">Shipped To:</div>
                      <div>${data.shippingName || data.billingName || ''}</div>
                      <div>${data.shippingAddress || data.billingAddress || ''}</div>
                      <div>${data.shippingCity || data.billingCity || ''}${data.shippingDistrict ? `, ${data.shippingDistrict}` : data.billingDistrict ? `, ${data.billingDistrict}` : ''} - ${data.shippingPincode || data.billingPincode || ''}</div>
                      <div><span class="strong">GSTIN/UIN:</span> ${data.shippingGstin || data.billingGstin || ''}</div>
                      <div><span class="strong">State Code:</span> ${data.shippingStateCode || data.billingStateCode || ''}</div>
                  </div>
              </div>

              <table>
                  <thead>
                      <tr>
                          <th>Sr.</th>
                          <th>Description of Goods</th>
                          <th>HSN/SAC</th>
                          <th>Qty</th>
                          <th>Rate</th>
                          <th>Taxable Value</th>
                          <th>CGST</th>
                          <th>SGST</th>
                          <th>IGST</th>
                          <th>Total</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${itemsHtml}
                      <tr>
                        <td colspan="5" class="text-right strong">Total</td>
                        <td class="text-right strong">${fmt(data.subtotal || 0)}</td>
                        <td class="text-right strong">${fmt(totalCgst)}</td>
                        <td class="text-right strong">${fmt(totalSgst)}</td>
                        <td class="text-right strong">${fmt(totalIgst)}</td>
                        <td class="text-right strong">${fmt(data.grandTotal || 0)}</td>
                      </tr>
                  </tbody>
              </table>

              <div class="row">
                  <div class="col-50 no-border-bottom" style="padding-right: 20px;">
                    <div class="strong">Tax Summary</div>
                    <table class="summary-table">
                        <tr><td>Total Taxable Value</td><td class="text-right">${fmt(data.subtotal || 0)}</td></tr>
                        <tr><td>Total CGST</td><td class="text-right">${fmt(totalCgst)}</td></tr>
                        <tr><td>Total SGST</td><td class="text-right">${fmt(totalSgst)}</td></tr>
                        <tr><td>Total IGST</td><td class="text-right">${fmt(totalIgst)}</td></tr>
                    </table>
                  </div>
                  <div class="col-50 col-right no-border-bottom">
                      <table class="summary-table">
                          <tr>
                            <td class="strong">Subtotal</td>
                            <td class="text-right strong">${fmt(data.subtotal || 0)}</td>
                          </tr>
                          <tr>
                            <td>Total Tax Amount</td>
                            <td class="text-right">${fmt(data.taxAmount || 0)}</td>
                          </tr>
                          <tr>
                            <td>Round Off</td>
                            <td class="text-right">${fmt(data.roundOffAmount || 0)}</td>
                          </tr>
                          <tr>
                            <td class="strong">Grand Total</td>
                            <td class="text-right strong">${fmt(data.grandTotal || 0)}</td>
                          </tr>
                      </table>
                  </div>
              </div>

              <div class="amount-words">
                  Amount in words: Rupees ${numberToWordsINR(data.grandTotal || 0)} Only
              </div>

              <div class="footer-row">
                  <div class="declaration">
                      <div class="strong">Declaration:</div>
                      <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                  </div>
                  <div class="signature">
                      <div class="strong">For ${data.companyNameSnapshot || 'Company'}</div>
                      <div style="margin-top: 50px;">Authorized Signatory</div>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
  },
};
