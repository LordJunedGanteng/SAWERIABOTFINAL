// pages/index.js
export default function IndexPage() {
  return (
    <html lang="id">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DONASI TERBARU</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0d0d0d;
            color: #fff;
            min-height: 100vh;
            overflow-x: hidden;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            position: relative;
            z-index: 1;
          }
          .header { text-align: center; margin-bottom: 60px; padding-top: 40px; }
          h1 {
            font-size: 4em;
            font-weight: 700;
            background: linear-gradient(135deg, #fff 0%, #9333ea 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            letter-spacing: -3px;
          }
          .subtitle { color: #888; font-size: 1.2em; font-weight: 300; }
          .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 50px;
          }
          .stat-card {
            background: rgba(20, 20, 20, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(147, 51, 234, 0.2);
            padding: 30px;
            border-radius: 20px;
            text-align: center;
          }
          .stat-value {
            font-size: 2.5em;
            font-weight: 700;
            color: #9333ea;
            margin-bottom: 10px;
          }
          .section-title {
            font-size: 1.8em;
            font-weight: 600;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .donations-grid {
            display: grid;
            gap: 20px;
          }
          .loading {
            text-align: center;
            padding: 100px 20px;
          }
          .spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(147, 51, 234, 0.1);
            border-top-color: #9333ea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 30px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .empty-state {
            text-align: center;
            padding: 100px 20px;
          }
          .empty-state p { color: #666; font-size: 1.2em; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>DONASI TERBARU</h1>
            <p className="subtitle">Real-time donation tracker</p>
          </div>

          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-value" id="totalDonations">0</div>
              <div>Total Donasi</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" id="totalAmount">Rp 0</div>
              <div>Terkumpul</div>
            </div>
          </div>

          <div className="section-title">
            <span>📊</span> Recent Donations
          </div>

          <div id="donationsContainer">
            <div className="loading">
              <div className="spinner"></div>
              <p style={{ color: '#666' }}>Loading donations...</p>
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          function formatRupiah(amount) {
            return new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            }).format(amount);
          }
          function formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);
            if (seconds < 60) return 'Baru saja';
            if (seconds < 3600) return \`\${Math.floor(seconds / 60)} menit lalu\`;
            if (seconds < 86400) return \`\${Math.floor(seconds / 3600)} jam lalu\`;
            return \`\${Math.floor(seconds / 86400)} hari lalu\`;
          }
          function getInitial(name) {
            return name.charAt(0).toUpperCase();
          }
          async function fetchDonations() {
            try {
              const res = await fetch('/api/donations');
              const data = await res.json();
              if (data.success) {
                document.getElementById('totalDonations').textContent = data.count;
                document.getElementById('totalAmount').textContent = formatRupiah(data.total);
                if (data.donations.length === 0) {
                  document.getElementById('donationsContainer').innerHTML = \`
                    <div class="empty-state">
                      <p>Belum ada donasi yang masuk</p>
                    </div>
                  \`;
                } else {
                  const html = data.donations.map(d => \`
                    <div style="background:rgba(20,20,20,0.6);border:1px solid rgba(255,255,255,0.05);border-radius:20px;padding:20px;margin:10px 0;">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <div><strong>\${d.donor}</strong></div>
                        <div style="color:#9333ea;font-weight:bold;">\${formatRupiah(d.amount)}</div>
                      </div>
                      \${d.message ? \`<div style="color:#aaa;margin:10px 0;">"\${d.message}"</div>\` : ''}
                      <div style="color:#666;font-size:0.9em;">\${formatTimeAgo(d.created_at)}</div>
                    </div>
                  \`).join('');
                  document.getElementById('donationsContainer').innerHTML = '<div class="donations-grid">' + html + '</div>';
                }
              }
            } catch (e) {
              document.getElementById('donationsContainer').innerHTML = \`
                <div class="empty-state">
                  <p>Belum ada donasi yang masuk</p>
                </div>
              \`;
            }
          }
          fetchDonations();
          setInterval(fetchDonations, 10000);
        `}} />
      </body>
    </html>
  );
}