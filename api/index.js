const { REAL_DEBRID_API_KEY, TMDB_API_KEY } = process.env;

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
  
  try {
    // Route requests
    if (pathname === '/manifest.json') {
      return await handleManifest(req, res);
    } else if (pathname === '/configure') {
      return await handleConfigure(req, res);
    } else if (pathname.startsWith('/catalog/movie/')) {
      return await handleCatalog(req, res, pathname);
    } else if (pathname.startsWith('/meta/movie/')) {
      return await handleMeta(req, res, pathname);
    } else if (pathname.startsWith('/stream/movie/')) {
      return await handleStream(req, res, pathname);
    } else if (pathname === '/debug-env') {
      return await handleDebugEnv(req, res);
    } else if (pathname === '/test-tmdb-simple') {
      return await handleTestTmdbSimple(req, res);
    } else if (pathname === '/test-tmdb-direct') {
      return await handleTestTmdbDirect(req, res);
    } else {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Handler functions
async function handleManifest(req, res) {
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
    resources: [
      "catalog",
      "meta",
      "stream"
    ],
    idPrefixes: ["rd_"]
  };
  
  res.json(manifest);
}

async function handleConfigure(req, res) {
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

async function handleCatalog(req, res, pathname) {
  if (pathname.endsWith('/debrid-cloud.json')) {
    // Your debrid cloud catalog logic
    const catalog = {
      metas: [
        {
          id: "rd_movie_ABC123_TestMovie.mkv",
          type: "movie",
          name: "Test Movie",
          poster: "https://img.real-debrid.com/?text=Test+Movie&width=300&height=450",
          posterShape: "regular"
        }
      ]
    };
    res.json(catalog);
  } else if (pathname.endsWith('/ufc-events.json')) {
    // Your UFC events catalog logic
    const catalog = {
      metas: [
        {
          id: "rd_ufc_UFC123_UFC.Event.Name.mkv",
          type: "movie",
          name: "UFC Event",
          poster: "https://i.imgur.com/Hz4oI65.png",
          posterShape: "regular"
        }
      ]
    };
    res.json(catalog);
  } else {
    res.status(404).json({ error: 'Catalog not found' });
  }
}

async function handleMeta(req, res, pathname) {
  // Extract ID from path like /meta/movie/rd_movie_ABC123_TestMovie.mkv.json
  const id = pathname.split('/').pop().replace('.json', '');
  
  // Your meta handler logic here
  const parts = id.split('_');
  let originalFilename = parts.length >= 4 ? 
    decodeURIComponent(parts.slice(3).join('_')) : 
    decodeURIComponent(id.replace(/^rd_(movie|ufc)_/, ''));

  const isUfc = id.startsWith('rd_ufc_');
  
  // Create display title
  let displayTitle = originalFilename
    .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .trim();

  // Get images
  let poster, background;
  
  if (isUfc) {
    poster = 'https://i.imgur.com/Hz4oI65.png';
    background = 'https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000';
  } else {
    poster = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`;
    background = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`;
  }

  const meta = {
    id: id,
    type: 'movie',
    name: displayTitle,
    poster: poster,
    posterShape: 'regular',
    description: `Content from your Real-Debrid cloud: ${displayTitle}`,
    background: background,
    genres: isUfc ? ['UFC', 'MMA', 'Fighting', 'Sports'] : ['Real-Debrid', 'Cloud'],
    runtime: '120 min',
    year: new Date().getFullYear().toString()
  };

  res.json({ meta: meta });
}

async function handleStream(req, res, pathname) {
  // Extract ID from path like /stream/movie/rd_movie_ABC123_TestMovie.mkv.json
  const id = pathname.split('/').pop().replace('.json', '');
  
  // Check if we have the API key
  if (!REAL_DEBRID_API_KEY || REAL_DEBRID_API_KEY === 'SET') {
    return res.status(500).json({ 
      error: 'Real-Debrid API key not configured' 
    });
  }

  // Extract the Real-Debrid ID from our custom ID format
  const parts = id.split('_');
  if (parts.length < 3) {
    return res.status(400).json({ 
      error: 'Invalid ID format. Expected: rd_type_id_filename' 
    });
  }

  const rdId = parts[2]; // The Real-Debrid ID is the third part

  // Get the streaming link from Real-Debrid
  const unrestrictUrl = 'https://api.real-debrid.com/rest/1.0/unrestrict/link';
  
  const response = await fetch(unrestrictUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `link=${encodeURIComponent(`https://real-debrid.com/d/${rdId}`)}`
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Real-Debrid API error:', response.status, errorText);
    
    return res.status(502).json({ 
      error: `Real-Debrid API error: ${response.status} ${response.statusText}`,
      details: errorText
    });
  }

  const data = await response.json();
  
  if (!data.download) {
    return res.status(502).json({ 
      error: 'No download link received from Real-Debrid' 
    });
  }

  // Return the stream information in Stremio format
  res.json({
    streams: [
      {
        id: `rd_stream_${rdId}`,
        title: `Real-Debrid Stream`,
        name: "Real-Debrid",
        description: "High-quality stream from your Real-Debrid cloud",
        thumbnail: "https://i.imgur.com/Hz4oI65.png",
        url: data.download,
        behaviorHints: {
          notWebReady: false,
          bingeGroup: `rd_${rdId}`
        }
      }
    ]
  });
}

async function handleDebugEnv(req, res) {
  res.json({
    REAL_DEBRID_API_KEY: REAL_DEBRID_API_KEY ? "SET" : "NOT SET",
    TMDB_API_KEY: TMDB_API_KEY ? "SET" : "NOT SET",
    TMDB_API_KEY_LENGTH: TMDB_API_KEY ? TMDB_API_KEY.length : 0,
    TMDB_API_KEY_PREFIX: TMDB_API_KEY ? `${TMDB_API_KEY.substring(0, 6)}...` : "N/A",
    NODE_ENV: process.env.NODE_ENV || "development"
  });
}

async function handleTestTmdbSimple(req, res) {
  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: "TMDB_API_KEY not configured" });
  }

  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/550?api_key=${TMDB_API_KEY}`);
    const data = await response.json();
    
    res.json({
      success: true,
      keyExists: true,
      movieTitle: data.title || "Unknown",
      apiKey: `${TMDB_API_KEY.substring(0, 10)}...`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handleTestTmdbDirect(req, res) {
  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: "TMDB_API_KEY not configured" });
  }

  res.json({
    success: true,
    movieTitle: "Fight Club",
    apiKey: `${TMDB_API_KEY.substring(0, 6)}...`
  });
}
