const { REAL_DEBRID_API_KEY, TMDB_API_KEY } = process.env;

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// TMDB search function
async function searchTMDB(title, year = null, isMovie = true) {
  try {
    console.log('Searching TMDB for original title:', title, 'Year:', year);
    
    if (!TMDB_API_KEY) {
      console.log('TMDB_API_KEY not available');
      return null;
    }

    // SIMPLIFIED: Just use the title as-is, let TMDB handle the search
    let searchQuery = title;
    
    console.log('Final TMDB search query:', searchQuery);
    
    let searchUrl = `https://api.themoviedb.org/3/search/${isMovie ? 'movie' : 'tv'}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`;
    
    if (year) {
      searchUrl += `&year=${year}`;
    }
    
    console.log('TMDB search URL:', searchUrl);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('TMDB API failed:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      console.log('TMDB found result:', firstResult.title, 'ID:', firstResult.id);
      return firstResult;
    }
    
    console.log('No TMDB results found');
    return null;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('TMDB search timed out after 5 seconds');
    } else {
      console.log('TMDB search error:', error.message);
    }
    return null;
  }
}

// Extract year from filename
function extractYear(title) {
  const yearMatch = title.match(/(19|20)\d{2}/);
  return yearMatch ? yearMatch[0] : null;
}

// Extract clean movie name from filename
function extractMovieName(title) {
  // Extract just the movie name part (before the year)
  const match = title.match(/^([^0-9]+)/);
  return match ? match[0].trim() : title;
}

// UFC images
const ufcLogo = 'https://i.imgur.com/Hz4oI65.png';
const ufcBackground = 'https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000';

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  console.log('Request received:', req.method, pathname);
  
  try {
    // Route requests based on pathname
    if (pathname === '/manifest.json') {
      return handleManifest(req, res);
    } else if (pathname === '/configure') {
      return handleConfigure(req, res);
    } else if (pathname === '/catalog/movie/debrid-cloud.json') {
      return handleCatalog(req, res, 'debrid-cloud');
    } else if (pathname === '/catalog/movie/ufc-events.json') {
      return handleCatalog(req, res, 'ufc-events');
    } else if (pathname.startsWith('/meta/movie/')) {
      return handleMeta(req, res, pathname);
    } else if (pathname.startsWith('/stream/movie/')) {
      return handleStream(req, res, pathname);
    } else if (pathname === '/debug-env') {
      return handleDebugEnv(req, res);
    } else if (pathname === '/test-tmdb-simple') {
      return handleTestTmdbSimple(req, res);
    } else if (pathname === '/test-tmdb-direct') {
      return handleTestTmdbDirect(req, res);
    } else if (pathname === '/test-tmdb-inception') {
      return handleTestTmdbInception(req, res);
    } else if (pathname === '/') {
      return handleRoot(req, res);
    } else {
      return res.status(404).json({ 
        error: 'Endpoint not found',
        path: pathname,
        availableEndpoints: [
          '/manifest.json',
          '/configure',
          '/catalog/movie/debrid-cloud.json',
          '/catalog/movie/ufc-events.json',
          '/meta/movie/{id}.json',
          '/stream/movie/{id}.json',
          '/debug-env',
          '/test-tmdb-simple',
          '/test-tmdb-direct',
          '/test-tmdb-inception'
        ]
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

function handleRoot(req, res) {
  res.json({
    message: 'Stremio Real-Debrid Addon API',
    endpoints: {
      manifest: '/manifest.json',
      configure: '/configure',
      catalog: [
        '/catalog/movie/debrid-cloud.json',
        '/catalog/movie/ufc-events.json'
      ],
      meta: '/meta/movie/{id}.json',
      stream: '/stream/movie/{id}.json',
      debug: '/debug-env',
      tests: [
        '/test-tmdb-simple',
        '/test-tmdb-direct',
        '/test-tmdb-inception'
      ]
    }
  });
}

function handleManifest(req, res) {
  const manifest = {
    id: "com.stremio.rdaddon",
    version: "1.0.0",
    name: "Real-Debrid Cloud Streamer",
    description: "Stream content from your Real-Debrid cloud",
    logo: "https://i.imgur.com/Hz4oI65.png",
    background: "https://img.real-debrid.com/?text=Real-Debrid&width=800&height=450",
    types: ["movie"],
    catalogs: [
      {
        type: "movie",
        id: "debrid-cloud",
        name: "Real-Debrid Cloud"
      },
      {
        type: "movie",
        id: "ufc-events",
        name: "UFC Events"
      }
    ],
    resources: ["catalog", "meta", "stream"],
    idPrefixes: ["rd_"]
  };
  
  res.json(manifest);
}

function handleConfigure(req, res) {
  const configure = {
    type: "configure",
    name: "Real-Debrid Configuration",
    description: "Configure your Real-Debrid addon",
    logo: "https://i.imgur.com/Hz4oI65.png",
    background: "https://img.real-debrid.com/?text=Real-Debrid&width=800&height=450",
    types: ["movie"],
    settings: [
      {
        type: "text",
        key: "realDebridApiKey",
        title: "Real-Debrid API Key",
        required: true
      }
    ]
  };
  
  res.json(configure);
}

function handleCatalog(req, res, catalogType) {
  let metas = [];
  
  if (catalogType === 'debrid-cloud') {
    metas = [
      {
        id: "rd_movie_ABC123_Inception.2010.4K.HDR.DV.2160p.BDRemux Ita Eng x265-NAHOM.mkv",
        type: "movie",
        name: "Inception (2010)",
        poster: "https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg",
        posterShape: "regular",
        background: "https://image.tmdb.org/t/p/w1280/gqby0RhyehP3uRrzmdyUZ0CgPPe.jpg"
      },
      {
        id: "rd_movie_DEF456_The.Dark.Knight.2008.1080p.BluRay.x264.mkv",
        type: "movie",
        name: "The Dark Knight (2008)",
        poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        posterShape: "regular",
        background: "https://image.tmdb.org/t/p/w1280/hqkIcbrOHL86UncnHIsHVcVmzue.jpg"
      },
      {
        id: "rd_movie_GHI789_Avengers.Endgame.2019.2160p.UHD.BluRay.x265.mkv",
        type: "movie",
        name: "Avengers: Endgame (2019)",
        poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
        posterShape: "regular",
        background: "https://image.tmdb.org/t/p/w1280/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg"
      }
    ];
  } else if (catalogType === 'ufc-events') {
    metas = [
      {
        id: "rd_ufc_001_UFC.300.mkv",
        type: "movie",
        name: "UFC 300: Historic Event",
        poster: ufcLogo,
        posterShape: "regular",
        background: ufcBackground
      },
      {
        id: "rd_ufc_002_UFC.299.mkv",
        type: "movie",
        name: "UFC 299: O'Malley vs Vera 2",
        poster: ufcLogo,
        posterShape: "regular",
        background: ufcBackground
      },
      {
        id: "rd_ufc_003_UFC.298.mkv",
        type: "movie",
        name: "UFC 298: Volkanovski vs Topuria",
        poster: ufcLogo,
        posterShape: "regular",
        background: ufcBackground
      }
    ];
  }
  
  res.json({ metas });
}

async function handleMeta(req, res, pathname) {
  console.log('=== META HANDLER STARTED ===');
  
  try {
    // Extract ID from path like /meta/movie/rd_movie_ABC123_TestMovie.mkv.json
    const id = decodeURIComponent(pathname.split('/').pop().replace('.json', ''));
    console.log('Processing meta for ID:', id);
    
    if (!id) {
      console.log('No ID provided');
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // Extract filename from ID
    const parts = id.split('_');
    console.log('ID parts:', parts);
    
    let originalFilename = parts.length >= 4 ? 
      parts.slice(3).join('_') : 
      id.replace(/^rd_(movie|ufc)_/, '');

    const isUfc = id.startsWith('rd_ufc_');
    console.log('Is UFC:', isUfc);
    
    // Create display title (clean up the filename)
    let displayTitle = originalFilename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/%20/g, ' ') // Decode URL-encoded spaces
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Display title:', displayTitle);

    // Extract year for better TMDB matching
    const year = extractYear(displayTitle);
    console.log('Extracted year:', year);

    // Extract clean movie name for TMDB search (just the part before the year)
    const movieName = extractMovieName(displayTitle);
    console.log('Clean movie name for TMDB:', movieName);

    // Get images - try TMDB first, fallback to text images
    let poster, background;
    
    if (isUfc) {
      // UFC content - use UFC images
      poster = ufcLogo;
      background = ufcBackground;
      console.log('Using UFC images');
    } else {
      console.log('Processing movie content, trying TMDB...');
      
      // Try to find movie on TMDB using the clean movie name
      const tmdbResult = await searchTMDB(movieName, year, true);
      
      if (tmdbResult) {
        console.log('TMDB result found:', tmdbResult.title);
        // Use TMDB images if available
        poster = tmdbResult.poster_path ? TMDB_IMAGE_BASE + tmdbResult.poster_path : null;
        background = tmdbResult.backdrop_path ? 
          `https://image.tmdb.org/t/p/w1280${tmdbResult.backdrop_path}` : 
          poster;
        
        // Use TMDB title if we found a good match
        if (tmdbResult.title) {
          displayTitle = tmdbResult.title;
          if (tmdbResult.release_date) {
            displayTitle += ` (${tmdbResult.release_date.substring(0, 4)})`;
          }
          console.log('Using TMDB title:', displayTitle);
        }
      } else {
        console.log('No TMDB result found, using fallback');
      }
      
      // Fallback to text images if TMDB didn't provide good results
      if (!poster) {
        poster = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`;
        console.log('Using fallback poster');
      }
      if (!background) {
        background = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`;
        console.log('Using fallback background');
      }
    }

    const meta = {
      id: id,
      type: "movie",
      name: displayTitle,
      poster: poster,
      posterShape: "regular",
      description: `Content from your Real-Debrid cloud: ${displayTitle}`,
      background: background,
      genres: isUfc ? ['UFC', 'MMA', 'Fighting', 'Sports'] : ['Real-Debrid', 'Cloud'],
      runtime: "120 min",
      year: year || "2023"
    };

    console.log('Returning meta data for:', displayTitle);
    res.json({ meta });
    
  } catch (error) {
    console.error('Error in meta handler:', error);
    res.status(500).json({ 
      error: 'Failed to process meta request',
      message: error.message 
    });
  }
}

function handleStream(req, res, pathname) {
  // Extract ID from path like /stream/movie/rd_movie_ABC123_TestMovie.mkv.json
  const id = pathname.split('/').pop().replace('.json', '');
  
  // Simple stream response
  res.json({
    streams: [
      {
        id: `stream_${id}`,
        title: "Real-Debrid Stream",
        name: "Real-Debrid",
        description: "High-quality stream from your Real-Debrid cloud",
        thumbnail: "https://i.imgur.com/Hz4oI65.png",
        url: `https://example.com/stream/${id}.mp4`,
        behaviorHints: {
          notWebReady: false,
          bingeGroup: `rd_${id}`
        }
      }
    ]
  });
}

function handleDebugEnv(req, res) {
  res.json({
    REAL_DEBRID_API_KEY: REAL_DEBRID_API_KEY ? "SET" : "NOT SET",
    TMDB_API_KEY: TMDB_API_KEY ? "SET" : "NOT SET",
    TMDB_API_KEY_LENGTH: TMDB_API_KEY ? TMDB_API_KEY.length : 0,
    TMDB_API_KEY_PREFIX: TMDB_API_KEY ? `${TMDB_API_KEY.substring(0, 6)}...` : "N/A",
    NODE_ENV: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
}

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

async function handleTestTmdbInception(req, res) {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: "TMDB_API_KEY not configured" });
    }

    // Test the exact search we're trying to do
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=Inception&year=2010`;
    
    console.log('Testing TMDB Inception search:', searchUrl);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`TMDB API responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      searchQuery: "Inception",
      year: 2010,
      resultsCount: data.results ? data.results.length : 0,
      results: data.results ? data.results.slice(0, 3).map(r => ({ title: r.title, id: r.id })) : [],
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
