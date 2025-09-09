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

  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);
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
          '/test-tmdb-direct'
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
        '/test-tmdb-direct'
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
        id: "rd_movie_ABC123_TestMovie.mkv",
        type: "movie",
        name: "Test Movie from Debrid Cloud",
        poster: "https://img.real-debrid.com/?text=Debrid+Cloud&width=300&height=450",
        posterShape: "regular"
      }
    ];
  } else if (catalogType === 'ufc-events') {
    metas = [
      {
        id: "rd_ufc_UFC123_TestUFC.mkv",
        type: "movie",
        name: "Test UFC Event",
        poster: "https://i.imgur.com/Hz4oI65.png",
        posterShape: "regular"
      }
    ];
  }
  
  res.json({ metas });
}

function handleMeta(req, res, pathname) {
  // Extract ID from path like /meta/movie/rd_movie_ABC123_TestMovie.mkv.json
  const id = pathname.split('/').pop().replace('.json', '');
  
  // Simple meta response
  const meta = {
    id: id,
    type: "movie",
    name: id.replace(/^rd_(movie|ufc)_/, '').replace(/\.[^/.]+$/, '').replace(/[._]/g, ' '),
    poster: "https://img.real-debrid.com/?text=Movie+Poster&width=300&height=450",
    posterShape: "regular",
    description: `Content from your Real-Debrid cloud: ${id}`,
    background: "https://img.real-debrid.com/?text=Background&width=800&height=450",
    genres: ["Real-Debrid", "Cloud"],
    runtime: "120 min",
    year: "2023"
  };

  res.json({ meta });
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

function handleTestTmdbSimple(req, res) {
  res.json({
    success: true,
    message: "TMDB Simple Test",
    apiKey: TMDB_API_KEY ? `${TMDB_API_KEY.substring(0, 6)}...` : "NOT SET",
    timestamp: new Date().toISOString()
  });
}

function handleTestTmdbDirect(req, res) {
  res.json({
    success: true,
    message: "TMDB Direct Test",
    apiKey: TMDB_API_KEY ? `${TMDB_API_KEY.substring(0, 6)}...` : "NOT SET",
    timestamp: new Date().toISOString()
  });
}
