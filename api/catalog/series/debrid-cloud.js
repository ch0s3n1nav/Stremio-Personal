const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    console.log('Series Cloud endpoint called');
    
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

    // For series, return empty array since Real-Debrid doesn't differentiate
    // between movie and series content in their API
    console.log('Returning empty series catalog (not implemented yet)');
    res.json({ metas: [] });
  } catch (error) {
    console.error('Error in series catalog:', error);
    res.json({ metas: [] });
  }
};
