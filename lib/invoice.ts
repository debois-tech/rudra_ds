// Invoice PDF generator for MotoAdmin
// Uses browser print to generate PDF (no external library needed)

import type { ServiceOverview } from './types';
import { format } from 'date-fns';

export function generateInvoice(service: ServiceOverview, organizationName = 'Driving School') {
  const invoiceWindow = window.open('', '_blank');
  if (!invoiceWindow) {
    throw new Error('Please allow popups to download invoices');
  }

  const invoiceNumber = `INV-${service.s_id.substring(0, 8).toUpperCase()}`;
  const isVehicle = service.category === 'vehicle';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #059669; }
    .brand h1 { font-size: 24px; color: #059669; font-weight: 800; }
    .brand p { font-size: 12px; color: #64748b; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 28px; color: #334155; letter-spacing: 2px; }
    .invoice-meta p { font-size: 13px; color: #64748b; margin-top: 4px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { max-width: 45%; }
    .party-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 600; color: #1e293b; }
    .party-detail { font-size: 13px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; }
    tbody td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .total-row { background: #f0fdf4; }
    .total-row td { font-weight: 700; font-size: 16px; color: #059669; border: none; padding: 16px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
    .footer p { font-size: 12px; color: #94a3b8; }
    .category-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .cat-vehicle { background: #dbeafe; color: #2563eb; }
    .cat-licence { background: #f3e8ff; color: #7c3aed; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>${organizationName}</h1>
      <p>Service Invoice</p>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <p>${invoiceNumber}</p>
      <p>Date: ${format(new Date(), 'dd MMM yyyy')}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Bill To</div>
      <div class="party-name">${service.customer_name}</div>
      <div class="party-detail">${service.customer_mobile}</div>
    </div>
    <div class="party" style="text-align: right;">
      <div class="party-label">Service Date</div>
      <div class="party-detail">${format(new Date(service.issue_date), 'dd MMM yyyy')}</div>
      ${service.expiry_date ? `<div class="party-label" style="margin-top: 12px;">Expiry Date</div>
      <div class="party-detail">${format(new Date(service.expiry_date), 'dd MMM yyyy')}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Details</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${service.service_name}</strong>
          <br>
          <span class="category-badge ${isVehicle ? 'cat-vehicle' : 'cat-licence'}">${isVehicle ? 'Vehicle Service' : 'Licence Service'}</span>
        </td>
        <td>
          ${isVehicle ? `
            Vehicle Type: ${service.vehicle_type || '—'}<br>
            Vehicle No: ${service.vehicle_number || '—'}
          ` : `
            Vehicle Class: ${service.vehicle_class || '—'}<br>
            Type: ${service.vehicle_type_licence || '—'}<br>
            ${service.mdl_number ? `MDL: ${service.mdl_number}<br>` : ''}
            ${service.renewal_date ? `Renewal: ${format(new Date(service.renewal_date), 'dd MMM yyyy')}` : ''}
          `}
        </td>
        <td style="text-align: right;">₹${Number(service.total_cost).toLocaleString('en-IN')}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2" style="text-align: right;">Total Amount</td>
        <td style="text-align: right;">₹${Number(service.total_cost).toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  ${service.notes ? `<p style="font-size: 13px; color: #64748b;"><strong>Notes:</strong> ${service.notes}</p>` : ''}

  <div class="footer">
    <p>Generated by MotoAdmin</p>
    <p>Status: ${service.status.toUpperCase()}</p>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  invoiceWindow.document.write(html);
  invoiceWindow.document.close();
}
