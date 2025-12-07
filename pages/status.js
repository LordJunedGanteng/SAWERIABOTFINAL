// pages/api/status.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const hasRoblox = !!(process.env.ROBLOX_API_KEY && process.env.UNIVERSE_ID);

  res.status(200).json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'N/A',
      ROBLOX_API_KEY: process.env.ROBLOX_API_KEY ? '✅ Set' : '❌ Missing',
      UNIVERSE_ID: process.env.UNIVERSE_ID ? '✅ Set' : '❌ Missing',
      MESSAGING_TOPIC: process.env.MESSAGING_TOPIC || 'Donations'
    },
    webhookActive: hasRoblox,
    configured: hasRoblox
  });
}
