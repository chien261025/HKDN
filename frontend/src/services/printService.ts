/**
 * Utility Service in ấn chuyên dụng chuẩn Enterprise WMS
 * Sử dụng isolated iframe để chỉ in duy nhất mẫu chứng từ A4 (GIN / Pick List / Pick Route),
 * triệt tiêu hoàn toàn hiện tượng in đè cả giao diện dashboard/sidebar nền của ứng dụng web.
 */

export const printHtmlDocument = (title: string, bodyHtml: string) => {
  const existingFrame = document.getElementById('smart-wms-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'smart-wms-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 14mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 11.5px;
          line-height: 1.45;
        }
        .header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header-sub {
          font-size: 10px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
        }
        .header-title {
          font-size: 19px;
          font-weight: 900;
          text-transform: uppercase;
          margin: 4px 0 2px 0;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .header-date {
          font-size: 10.5px;
          color: #64748b;
        }
        .header-code-box {
          text-align: right;
        }
        .header-code-label {
          font-size: 10px;
          font-family: monospace;
          font-weight: 700;
          color: #64748b;
        }
        .header-code-val {
          font-size: 18px;
          font-family: monospace;
          font-weight: 900;
          color: #4338ca;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 14px;
          font-size: 11px;
        }
        .meta-item {
          margin-bottom: 3px;
        }
        .meta-label {
          color: #64748b;
          font-weight: 600;
        }
        .meta-value {
          color: #0f172a;
          font-weight: 700;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #1e293b;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
          display: flex;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          font-size: 10px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
        .font-bold { font-weight: 700; }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 10px;
          background: #e0e7ff;
          color: #3730a3;
          border: 1px solid #c7d2fe;
        }
        .notice-box {
          background: #f8fafc;
          border: 1px dashed #94a3b8;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 10px;
          color: #475569;
          margin-bottom: 20px;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          text-align: center;
          margin-top: 24px;
          page-break-inside: avoid;
        }
        .sign-title {
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .sign-sub {
          font-size: 9.5px;
          color: #64748b;
          font-style: italic;
        }
        .sign-space {
          height: 55px;
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
    }, 1500);
  }, 300);
};

