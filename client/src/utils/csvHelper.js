// CSV Import & Export Utilities

export const exportToCSV = (param1, param2) => {
  let rows = [];
  let filename = "export.csv";

  if (Array.isArray(param1)) {
    rows = param1;
    filename = param2 || "export.csv";
  } else if (Array.isArray(param2)) {
    rows = param2;
    filename = param1 || "export.csv";
  }

  if (!rows || !rows.length) return;

  const separator = ",";
  const keys = Object.keys(rows[0]);

  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const printShippingLabel = (order) => {
  if (!order) return;

  const labelWindow = window.open("", "_blank");
  if (!labelWindow) return;

  const addr = order.shippingAddress || {};

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ShippingLabel_${order.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .label-box { width: 380px; margin: auto; padding: 20px; border: 2px solid #000; border-radius: 8px; font-size: 12px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; text-align: center; }
          .barcode { font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 4px; border: 1px text-align: center; margin: 15px 0; background: #eee; padding: 10px; text-align: center;}
          .address { margin: 15px 0; line-height: 1.5; }
          .footer { border-top: 1px solid #ccc; pt: 10px; font-size: 10px; display: flex; justify-content: space-between; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="header">
            <h2 style="margin:0; font-size: 18px;">EXPRESS SHIPPING LABEL</h2>
            <div>FASHION STORE</div>
          </div>

          <div class="barcode">||| | |||| ||| ||||| ${order.orderId}</div>

          <div class="address">
            <strong>DELIVER TO:</strong><br/>
            <span style="font-size: 14px; font-weight: bold;">${addr.name || "Customer"}</span><br/>
            ${addr.houseNo ? `${addr.houseNo}, ` : ""}${addr.street || ""}<br/>
            ${addr.landmark ? `Landmark: ${addr.landmark}<br/>` : ""}
            ${addr.city || ""}, ${addr.state || ""} - <strong>${addr.pincode || ""}</strong><br/>
            <strong>Phone:</strong> ${addr.phone || "N/A"}
          </div>

          <div style="border-top: 1px dashed #000; padding-top: 10px;">
            <strong>SHIPMENT DETAILS:</strong><br/>
            Order ID: <strong>${order.orderId}</strong><br/>
            Payment Method: <strong>${order.paymentMethod} (${order.paymentStatus})</strong><br/>
            Tracking ID: <strong>${order.trackingId || "TRK-EXP-9921"}</strong>
          </div>

          <div class="footer">
            <span>Carrier: Express Logistics</span>
            <span>Weight: 0.8 kg</span>
          </div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;

  labelWindow.document.write(content);
  labelWindow.document.close();
};

export const generateShippingLabel = printShippingLabel;
