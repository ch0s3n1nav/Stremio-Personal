const { TMDB_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!TMDB_API_KEY) {
      return res.json({ error: 'TMDB_API_KEY not configured' });
    }

    // Test search for "The Penguin" as a TV show
    const testTitle = "The Penguin";
    const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(testTitle)}`;
    
    console.log('Searching TMDB for:', testTitle);
    console.log('Search URL:', searchUrl);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      return res.json({
        error: `TMDB API error: ${response.status} ${response.statusText}`,
        searchUrl: searchUrl
      });
    }

    const data = await response.json();
    
    let posterUrl = null;
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      posterUrl = firstResult.poster_path ? `https://image.tmdb.org/t/p/w500${firstResult.poster_path}` : null;
    }

    res.json({
      searchTitle: testTitle,
      resultsCount: data.results ? data.results.length : 0,
      posterUrl: posterUrl,
      firstResult: data.results ? data.results[0] : null,
      allResults: data.results ? data.results.slice(0, 3) : [] // First 3 results
    });

  } catch (error) {
    res.json({ error: error.message });
  }
};
