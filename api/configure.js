module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.json({
    type: 'configure',
    name: "Nav's UFC AllDebrid",
    description: 'No configuration is required. The addon uses the AllDebrid API key stored securely in Vercel.',
    logo: 'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png',
    background: 'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg',
    types: ['movie'],
    settings: []
  });
};
