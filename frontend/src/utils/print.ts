export function printDocument(title: string, body: string) {
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;

  popup.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 28px; color: #1f2933; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          h2 { font-size: 16px; margin: 20px 0 8px; border-bottom: 1px solid #d0d5dd; padding-bottom: 6px; }
          .muted { color: #667085; font-size: 12px; }
          .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #344054; padding-bottom: 14px; margin-bottom: 18px; }
          .box { border: 1px solid #d0d5dd; border-radius: 8px; padding: 12px; margin: 10px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #d0d5dd; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f2f4f7; }
          @media print { button { display: none; } body { margin: 18mm; } }
        </style>
      </head>
      <body>
        ${body}
        <script>
          window.onload = function () { window.print(); setTimeout(function () { window.close(); }, 400); };
        </script>
      </body>
    </html>
  `);
  popup.document.close();
}

export function escapeHtml(value: unknown) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
