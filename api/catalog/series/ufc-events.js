const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    if (!REAL_DEBRID_API_KEY) {
      throw new Error('Real-Debrid API key is not configured');
    }

    // For UFC series, we'll return an empty array
    // You might need to implement your own logic to detect UFC series content
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ metas: [] });
  } catch (error) {
    console.error('Error in UFC series catalog:', error);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Failed to fetch UFC series content',
      details: error.message 
    });
  }
};
