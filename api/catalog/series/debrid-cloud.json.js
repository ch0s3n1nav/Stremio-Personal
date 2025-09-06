const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // For series, we'll return an empty array since Real-Debrid doesn't 
    // differentiate between movie and series in their API
    res.json({ metas: [] });
  } catch (error) {
    console.error('Error in series catalog:', error);
    res.json({ metas: [] });
  }
};
