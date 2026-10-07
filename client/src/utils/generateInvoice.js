// Printable PDF Invoice Generator Utility

export const generateInvoice = (order) => {
  if (!order) return;

  const invoiceWindow = window.open("", "_blank");
  if (!invoiceWindow) {
    alert("Please allow popups to download the PDF invoice.");
    return;
  }

  const itemsHtml = (order.items || [])
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${idx + 1}</td>
        <td style="padding: 10px;">
          <strong>${item.title}</strong>
          ${item.color ? `<br/><span style="font-size: 11px; color: #666;">Color: ${item.color} | Size: ${item.size}</span>` : ""}
          ${item.sku ? `<br/><span style="font-size: 10px; color: #999;">SKU: ${item.sku}</span>` : ""}
        </td>
        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">₹${item.price}</td>
        <td style="padding: 10px; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  const addr = order.shippingAddress || {};

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice_${order.invoiceNumber || order.orderId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 30px; color: #333; }
          .invoice-box { max-w: 800px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
          .logo { font-size: 26px; font-weight: 800; color: #4F46E5; letter-spacing: -1px; }
          .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
          .info-grid { display: flex; justify-content: space-between; margin: 25px 0; font-size: 13px; }
          .info-col { width: 48%; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          .table th { background: #F3F4F6; padding: 10px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 11px; }
          .totals { margin-left: auto; width: 300px; font-size: 13px; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand-total { font-weight: 800; font-size: 16px; border-top: 2px solid #333; padding-top: 8px; margin-top: 6px; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: #E0E7FF; color: #3730A3; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #4F46E5; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
            🖨 Print / Save as PDF
          </button>
        </div>

        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo">FASHION STORE</div>
              <div class="subtitle">Official Tax Invoice</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 16px;">INVOICE</div>
              <div style="font-size: 12px; color: #666;">#${order.invoiceNumber || order.orderId}</div>
              <div style="font-size: 12px; color: #666;">Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-col">
              <strong>Billed To:</strong><br/>
              ${addr.name || "Customer"}<br/>
              ${addr.houseNo ? `${addr.houseNo}, ${addr.street}` : addr.address || ""}<br/>
              ${addr.landmark ? `Landmark: ${addr.landmark}<br/>` : ""}
              ${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}<br/>
              Phone: ${addr.phone || "N/A"}
            </div>
            <div class="info-col" style="text-align: right;">
              <strong>Order Details:</strong><br/>
              Order ID: <strong>${order.orderId}</strong><br/>
              Payment Method: ${order.paymentMethod || "COD"}<br/>
              Payment Status: <span class="badge">${order.paymentStatus || "Pending"}</span><br/>
              ${order.trackingId ? `Tracking ID: ${order.trackingId}<br/>` : ""}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div><span>Subtotal:</span> <span>₹${(order.subtotal || order.totalAmount).toFixed(2)}</span></div>
            ${order.discountAmount ? `<div><span>Discount:</span> <span style="color: #DC2626;">-₹${order.discountAmount.toFixed(2)}</span></div>` : ""}
            ${order.gstAmount ? `<div><span>GST (18%):</span> <span>₹${order.gstAmount.toFixed(2)}</span></div>` : ""}
            <div><span>Shipping Fee:</span> <span>${order.shippingAmount === 0 ? "FREE" : `₹${order.shippingAmount}`}</span></div>
            ${order.platformFee ? `<div><span>Platform Fee:</span> <span>₹${order.platformFee}</span></div>` : ""}
            <div class="grand-total"><span>Grand Total:</span> <span>₹${(order.totalAmount || 0).toFixed(2)}</span></div>
          </div>

          <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 11px; color: #888;">
            Thank you for shopping with Fashion Store! For support, contact support@fashionstore.com
          </div>
        </div>
      </body>
    </html>
  `;

  invoiceWindow.document.write(htmlContent);
  invoiceWindow.document.close();
};
