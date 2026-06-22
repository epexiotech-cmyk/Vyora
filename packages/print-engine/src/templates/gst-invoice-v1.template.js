export const gstInvoiceTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tax Invoice</title>
    <style>
      {{{css}}}
    </style>
</head>
<body>
    <div class="container">
        <div class="header-title">TAX INVOICE</div>
        
        <div class="row">
            <div class="col-50">
                <div class="strong" style="font-size: 14px;">{{company.legalName}}</div>
                <div>{{company.address}}</div>
                <div><span class="strong">GSTIN/UIN:</span> {{company.gstin}}</div>
                <div><span class="strong">State Name:</span> {{company.stateName}}, <span class="strong">Code:</span> {{company.stateCode}}</div>
                <div><span class="strong">PAN:</span> {{company.pan}}</div>
                {{#if company.email}}<div><span class="strong">Email:</span> {{company.email}}</div>{{/if}}
                {{#if company.mobile}}<div><span class="strong">Mobile:</span> {{company.mobile}}</div>{{/if}}
            </div>
            <div class="col-50 col-right">
                <div><span class="strong">Invoice No:</span> {{invoiceNumber}}</div>
                <div><span class="strong">Invoice Date:</span> {{formatDate invoiceDate}}</div>
                <div><span class="strong">Place of Supply:</span> {{customer.state}}</div>
                <div><span class="strong">Reverse Charge:</span> {{#if isReverseCharge}}Y{{else}}N{{/if}}</div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-50">
                <div class="strong">Billed To:</div>
                <div>{{customer.name}}</div>
                <div>{{customer.address}}</div>
                {{#if customer.city}}<div>{{customer.city}}{{#if customer.pincode}} - {{customer.pincode}}{{/if}}</div>{{/if}}
                <div><span class="strong">GSTIN/UIN:</span> {{#if customer.gstin}}{{customer.gstin}}{{else}}Unregistered{{/if}}</div>
                <div><span class="strong">State Code:</span> {{customer.state}}</div>
            </div>
            <div class="col-50 col-right">
                <div class="strong">Shipped To:</div>
                <div>{{customer.name}}</div>
                <div>{{customer.address}}</div>
                {{#if customer.city}}<div>{{customer.city}}{{#if customer.pincode}} - {{customer.pincode}}{{/if}}</div>{{/if}}
                <div><span class="strong">GSTIN/UIN:</span> {{#if customer.gstin}}{{customer.gstin}}{{else}}Unregistered{{/if}}</div>
                <div><span class="strong">State Code:</span> {{customer.state}}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Sr.</th>
                    <th>Description of Goods</th>
                    <th>HSN/SAC</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Discount</th>
                    <th>Taxable Value</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                {{#each items}}
                <tr>
                    <td class="text-center">{{math @index "+" 1}}</td>
                    <td>{{productName}}</td>
                    <td class="text-center">{{hsnCode}}</td>
                    <td class="text-right">{{quantity}}</td>
                    <td class="text-center">{{unitCode}}</td>
                    <td class="text-right">{{formatCurrency rate}}</td>
                    <td class="text-right">{{formatCurrency discountAmount}}</td>
                    <td class="text-right">{{formatCurrency taxableAmount}}</td>
                    <td class="text-right">
                      {{#if cgstAmount}}
                        {{formatCurrency cgstAmount}} <br/><small>({{cgstRate}}%)</small>
                      {{else}}
                        -
                      {{/if}}
                    </td>
                    <td class="text-right">
                      {{#if sgstAmount}}
                        {{formatCurrency sgstAmount}} <br/><small>({{sgstRate}}%)</small>
                      {{else}}
                        -
                      {{/if}}
                    </td>
                    <td class="text-right">
                      {{#if igstAmount}}
                        {{formatCurrency igstAmount}} <br/><small>({{igstRate}}%)</small>
                      {{else}}
                        -
                      {{/if}}
                    </td>
                    <td class="text-right">{{formatCurrency lineTotal}}</td>
                </tr>
                {{/each}}
                <tr>
                  <td colspan="7" class="text-right strong">Total</td>
                  <td class="text-right strong">{{formatCurrency subtotal}}</td>
                  <td colspan="3"></td>
                  <td class="text-right strong">{{formatCurrency grandTotal}}</td>
                </tr>
            </tbody>
        </table>

        <div class="row">
            <div class="col-50 no-border-bottom" style="padding-right: 20px;">
              <div class="strong">Tax Summary</div>
              <table class="summary-table">
                  <thead>
                    <tr>
                      <th class="text-center">Rate</th>
                      <th class="text-right">Taxable</th>
                      <th class="text-right">CGST</th>
                      <th class="text-right">SGST</th>
                      <th class="text-right">IGST</th>
                      <th class="text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {{#each taxSummary}}
                    <tr>
                      <td class="text-center">{{taxRate}}%</td>
                      <td class="text-right">{{formatCurrency taxableAmount}}</td>
                      <td class="text-right">{{formatCurrency cgstAmount}}</td>
                      <td class="text-right">{{formatCurrency sgstAmount}}</td>
                      <td class="text-right">{{formatCurrency igstAmount}}</td>
                      <td class="text-right">{{formatCurrency totalTaxAmount}}</td>
                    </tr>
                    {{/each}}
                  </tbody>
              </table>
            </div>
            <div class="col-50 col-right no-border-bottom">
                <table class="summary-table">
                    <tr>
                      <td class="strong">Subtotal</td>
                      <td class="text-right strong">{{formatCurrency subtotal}}</td>
                    </tr>
                    <tr>
                      <td>Discount</td>
                      <td class="text-right">{{formatCurrency discountAmount}}</td>
                    </tr>
                    <tr>
                      <td>Total Tax Amount</td>
                      <td class="text-right">{{formatCurrency taxAmount}}</td>
                    </tr>
                    <tr>
                      <td>Round Off</td>
                      <td class="text-right">{{formatCurrency roundOffAmount}}</td>
                    </tr>
                    <tr>
                      <td class="strong">Grand Total</td>
                      <td class="text-right strong">{{formatCurrency grandTotal}}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="amount-words">
            Amount in words: Rupees {{amountInWords}} Only
        </div>

        <div class="footer-row">
            <div class="declaration">
                <div class="strong">Declaration:</div>
                <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            </div>
            <div class="signature">
                <div class="strong">For {{company.legalName}}</div>
                <div style="margin-top: 50px;">Authorized Signatory</div>
            </div>
        </div>
    </div>
</body>
</html>
`;
