// pages/status.js
export default function StatusPage() {
  return (
    <html lang="id">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>System Status</title>
        <style>{/* ... (copy style dari HTML status sebelumnya) ... */}</style>
      </head>
      <body>
        {/* ... (copy body dari HTML status sebelumnya) ... */}
        <script dangerouslySetInnerHTML={{ __html: `
          // ... (copy script dari HTML status sebelumnya) ...
        `}} />
      </body>
    </html>
  );
}