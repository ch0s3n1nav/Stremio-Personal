module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.json({
    ALLDEBRID_API_KEY: process.env.ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
    TMDB_API_KEY: process.env.TMDB_API_KEY ? 'SET' : 'NOT SET',
    timestamp: new Date().toISOString()
  });
};
