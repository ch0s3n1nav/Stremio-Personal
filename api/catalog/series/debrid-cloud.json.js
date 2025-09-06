const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    if (!REAL_DEBRID_API_KEY) {
      throw new Error('Real-Debrid API key is not configured');
    }

    // For series, return empty for now
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ metas: [] });
  } catch (error) {
    console.error('Error in series catalog:', error);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Failed to fetch series content',
      details: error.message 
    });
  }
};
