const { TMDB_API_KEY } = process.env;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

module.exports = async (req, res) => {
  try {
    const testTitle = "The Penguin";
    
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!TMDB_API_KEY) {
      return res.json({ error: 'TMDB_API_KEY not configured', key: TMDB_API_KEY });
    }

    // Test TMDB search
    const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(testTitle)}`;
    console.log('TMDB Search URL:', searchUrl);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      return res.json({ 
        error: `TMDB API error: ${response.status} ${response.statusText}`,
        status: response.status
      });
    }

    const data = await response.json();
    
    let posterUrl = null;
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      if (firstResult.poster_path) {
        posterUrl = TMDB_IMAGE_BASE + firstResult.poster_path;
      }
    }

    res.json({
      testTitle: testTitle,
      tmdbApiKey: TMDB_API_KEY ? 'Configured' : 'Missing',
      posterUrl: posterUrl,
      tmdbResults: data.results ? data.results.length : 0,
      firstResult: data.results ? data.results[0] : null
    });

  } catch (error) {
    res.json({ error: error.message });
  }
};
