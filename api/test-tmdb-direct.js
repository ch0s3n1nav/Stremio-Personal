module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Test the API key directly
    const apiKey = '8d6b19dfd39b5efe48ed79708a6850b3';
    const testUrl = `https://api.themoviedb.org/3/movie/550?api_key=${apiKey}`;
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      return res.json({
        error: `Direct TMDB API error: ${response.status} ${response.statusText}`,
        status: response.status,
        apiKey: apiKey.substring(0, 6) + '...'
      });
    }

    const data = await response.json();
    
    res.json({
      success: true,
      movieTitle: data.title,
      apiKey: apiKey.substring(0, 6) + '...'
    });

  } catch (error) {
    res.json({ error: error.message });
  }
};
