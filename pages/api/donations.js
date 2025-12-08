// api/donations.js
// Endpoint tunggal untuk webhook Saweria & fetch donations

let donations = [];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ═══════════════════════════════════════════════════════════
  // POST: Webhook dari Saweria
  // ═══════════════════════════════════════════════════════════
  if (req.method === 'POST') {
    try {
      const data = req.body;
      
      if (!data || typeof data !== 'object') {
        console.warn('⚠️ Invalid webhook payload');
        return res.status(400).json({ error: 'Invalid payload' });
      }

      // Format donation data
      const donation = {
        id: data.id || `don_${Date.now()}`,
        donor: data.donator_name || data.donor_name || data.donor || 'Anonymous',
        amount: data.amount_raw || data.amount || 0,
        message: data.message || data.note || '',
        created_at: data.created_at || new Date().toISOString(),
        source: req.headers['x-source'] || 'saweria'
      };

      // Validasi amount
      if (donation.amount <= 0) {
        console.warn('⚠️ Invalid amount:', donation.amount);
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Simpan ke memory (max 50 donasi)
      donations.unshift(donation);
      if (donations.length > 50) {
        donations = donations.slice(0, 50);
      }

      console.log('═══════════════════════════════════════════');
      console.log('💰 DONASI BARU!');
      console.log('Donor:', donation.donor);
      console.log('Amount:', 'Rp' + donation.amount.toLocaleString('id-ID'));
      console.log('Message:', donation.message || '-');
      console.log('═══════════════════════════════════════════');

      // ─────────────────────────────────────────────────────────
      // Kirim ke Roblox MessagingService
      // ─────────────────────────────────────────────────────────
      const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
      const UNIVERSE_ID = process.env.UNIVERSE_ID;
      const MESSAGING_TOPIC = process.env.MESSAGING_TOPIC || 'Donations';

      if (ROBLOX_API_KEY && UNIVERSE_ID) {
        try {
          console.log('📤 Mengirim ke Roblox...');
          
          const robloxResponse = await fetch(
            `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/${MESSAGING_TOPIC}`,
            {
              method: 'POST',
              headers: {
                'x-api-key': ROBLOX_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: JSON.stringify({
                  donor: donation.donor,
                  amount: donation.amount,
                  message: donation.message,
                  timestamp: donation.created_at,
                  id: donation.id
                })
              })
            }
          );

          if (!robloxResponse.ok) {
            const errorText = await robloxResponse.text();
            console.error('❌ Roblox API Error:', robloxResponse.status);
            console.error('Details:', errorText);
            
            // Masih return success ke Saweria agar webhook tidak retry
            // Tapi log error untuk debugging
          } else {
            console.log('✅ Berhasil dikirim ke Roblox!');
          }
        } catch (robloxError) {
          console.error('❌ Roblox send error:', robloxError.message);
        }
      } else {
        console.warn('⚠️ Roblox credentials belum di-set');
      }

      // ─────────────────────────────────────────────────────────
      // (Opsional) Forward ke Discord
      // ─────────────────────────────────────────────────────────
      const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
      
      if (DISCORD_WEBHOOK_URL) {
        try {
          await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: "💎 Donasi Baru!",
                color: 0x9333ea,
                fields: [
                  { name: "Donor", value: donation.donor, inline: true },
                  { name: "Amount", value: `Rp ${donation.amount.toLocaleString('id-ID')}`, inline: true },
                  { name: "Message", value: donation.message || "_No message_", inline: false }
                ],
                timestamp: donation.created_at,
                footer: { text: "Saweria Webhook" }
              }]
            })
          });
          console.log('✅ Forwarded to Discord');
        } catch (discordError) {
          console.error('⚠️ Discord forward failed:', discordError.message);
        }
      }

      // Return success
      return res.status(200).json({ 
        success: true,
        message: 'Donation received',
        id: donation.id
      });

    } catch (error) {
      console.error('💥 Webhook error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // GET: Untuk frontend landing page
  // ═══════════════════════════════════════════════════════════
  if (req.method === 'GET') {
    try {
      const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      
      return res.status(200).json({
        success: true,
        count: donations.length,
        total: totalAmount,
        donations: donations,
        cached_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('💥 GET error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch donations',
        message: error.message 
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Method lain: reject
  // ═══════════════════════════════════════════════════════════
  return res.status(405).json({ error: 'Method not allowed' });
}
