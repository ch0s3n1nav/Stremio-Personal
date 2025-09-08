module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Get all environment variables (we'll mask sensitive ones)
    const envVars = {
      REAL_DEBRID_API_KEY: process.env.REAL_DEBRID_API_KEY ? 'SET' : 'NOT SET',
      TMDB_API_KEY: process.env.TMDB_API_KEY ? 'SET' : 'NOT SET',
      TMDB_API_KEY_LENGTH: process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.length : 0,
      TMDB_API_KEY_PREFIX: process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.substring(0, 6) + '...' : 'N/A',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    };

    res.json(envVars);

  } catch (error) {
    res.json({ error: error.message });
  }
};
