// api/donations.js
// Endpoint tunggal untuk:
// - Terima webhook Saweria (POST)
// - Sajikan data ke frontend (GET)

let donations = [];

export default async function handler(req, res) {
  // CORS & preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ─── POST: Webhook dari Saweria ─────────────────────────────
  if (req.method === 'POST') {
    try {
      const d = req.body;
      if (!d || typeof d !== 'object') {
        console.warn('⚠️ Invalid payload received');
        return res.status(400).json({ error: 'Invalid payload' });
      }

      // Format donasi
      const donation = {
        id: d.id || Date.now().toString(),
        donor: d.donator_name || 'Anonymous',
        amount: d.amount_raw || d.amount || 0,
        message: d.message || '',
        created_at: d.created_at || new Date().toISOString()
      };

      // Simpan ke cache (max 20 donasi)
      donations.unshift(donation);
      if (donations.length > 20) donations.pop();

      console.log('✅ Donasi diterima:', donation.donor, 'Rp' + donation.amount);

      // ─── Kirim ke Roblox MessagingService ─────────────────────
      const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
      const UNIVERSE_ID = process.env.UNIVERSE_ID;
      const MESSAGING_TOPIC = process.env.MESSAGING_TOPIC || 'Donations';

      if (ROBLOX_API_KEY && UNIVERSE_ID) {
        try {
          const robloxRes = await fetch(
            `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/${MESSAGING_TOPIC}`,
            {
              method: 'POST',
              headers: {
                'x-api-key': ROBLOX_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: JSON.stringify(donation)
              })
            }
          );

          if (!robloxRes.ok) {
            const errText = await robloxRes.text();
            console.error('❌ Roblox API Error:', robloxRes.status, errText);
          } else {
            console.log('📤 Sukses kirim ke Roblox');
          }
        } catch (e) {
          console.error('❌ Gagal kirim ke Roblox:', e.message);
        }
      } else {
        console.warn('⚠️ Roblox env vars belum diset');
      }

      // ─── (Opsional) Kirim ke Discord Webhook ───────────────────
      const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
      if (DISCORD_WEBHOOK_URL) {
        try {
          await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: null,
              embeds: [{
                title: "🎉 Donasi Baru!",
                description: `**Dari:** ${donation.donor}\n**Jumlah:** Rp${donation.amount.toLocaleString('id-ID')}\n**Pesan:** ${donation.message || "–"}`,
                color: 10090622,
                footer: { text: "Saweria → Roblox" },
                timestamp: donation.created_at
              }]
            })
          });
        } catch (e) {
          console.error('❌ Gagal kirim ke Discord:', e.message);
        }
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('💥 Webhook handler error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ─── GET: Untuk frontend (tracker web) ──────────────────────
  if (req.method === 'GET') {
    const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    return res.status(200).json({
      success: true,
      count: donations.length,
      total: total,
      donations: donations
    });
  }

  // ─── Method lain: tolak ─────────────────────────────────────
  return res.status(405).json({ error: 'Method not allowed' });
}
