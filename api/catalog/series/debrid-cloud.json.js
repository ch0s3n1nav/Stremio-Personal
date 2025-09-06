const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // For series, we'll return an empty array since Real-Debrid doesn't 
    // differentiate between movie and series in their API
    // You might need to implement your own logic to detect series
    
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
