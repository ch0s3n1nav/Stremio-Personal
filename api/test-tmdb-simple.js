const { TMDB_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!TMDB_API_KEY) {
      return res.json({ 
        error: 'TMDB_API_KEY is not configured in environment variables',
        keyExists: false
      });
    }

    // Test a simple TMDB API call
    const testUrl = `https://api.themoviedb.org/3/movie/550?api_key=${TMDB_API_KEY}`;
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      return res.json({
        error: `TMDB API error: ${response.status} ${response.statusText}`,
        keyExists: true,
        status: response.status
      });
    }

    const data = await response.json();
    
    res.json({
      success: true,
      keyExists: true,
      movieTitle: data.title,
      apiKey: TMDB_API_KEY.substring(0, 10) + '...' // Show first 10 chars for security
    });

  } catch (error) {
    res.json({ 
      error: error.message,
      keyExists: TMDB_API_KEY ? true : false
    });
  }
};
