const { REAL_DEBRID_API_KEY, TMDB_API_KEY } = process.env;

module.exports = async (req, res) => {
  // CORS headers and routing logic
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  if (pathname === '/manifest.json') {
    return handleManifest(req, res);
  } else if (pathname === '/configure') {
    return handleConfigure(req, res);
  }
  // ... other routes
  else if (pathname === '/test-tmdb-simple') {
    return handleTestTmdbSimple(req, res);
  } else if (pathname === '/test-tmdb-direct') {
    return handleTestTmdbDirect(req, res);
  }
  // ... more routes
};

function handleManifest(req, res) {
  // manifest code
}

function handleConfigure(req, res) {
  // configure code
}

// ... other handler functions

async function handleTestTmdbSimple(req, res) {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: "TMDB_API_KEY not configured" });
    }

    // Test with a known movie ID (Fight Club)
    const response = await fetch(`https://api.themoviedb.org/3/movie/550?api_key=${TMDB_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`TMDB API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      keyExists: true,
      movieTitle: data.title || "Unknown",
      apiKey: `${TMDB_API_KEY.substring(0, 6)}...`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      apiKey: TMDB_API_KEY ? `${TMDB_API_KEY.substring(0, 6)}...` : "NOT SET"
    });
  }
}

async function handleTestTmdbDirect(req, res) {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: "TMDB_API_KEY not configured" });
    }

    // Test search functionality
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=Inception`);
    
    if (!response.ok) {
      throw new Error(`TMDB API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      movieTitle: data.results && data.results.length > 0 ? data.results[0].title : "No results",
      resultsCount: data.results ? data.results.length : 0,
      apiKey: `${TMDB_API_KEY.substring(0, 6)}...`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      apiKey: TMDB_API_KEY ? `${TMDB_API_KEY.substring(0, 6)}...` : "NOT SET"
    });
  }
}
