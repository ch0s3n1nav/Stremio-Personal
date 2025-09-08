const { REAL_DEBRID_API_KEY, TMDB_API_KEY } = process.env;

// Import your utils
const imageFinder = require('./utils/imageFinder');
const tmdbImageFinder = require('./utils/tmdbImageFinder');
const ufcImageFinder = require('./utils/ufcImageFinder');

// Add global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

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
  
  console.log('Request received:', pathname);
  
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
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};

// Handler functions
async function handleManifest(req, res) {
  // ... your existing manifest code
}

async function handleConfigure(req, res) {
  // ... your existing configure code
}

async function handleCatalog(req, res, pathname) {
  // ... your existing catalog code
}

async function handleMeta(req, res, pathname) {
  try {
    console.log('Meta handler called for path:', pathname);
    
    // Extract ID from path like /meta/movie/rd_movie_ABC123_TestMovie.mkv.json
    const id = pathname.split('/').pop().replace('.json', '');
    console.log('Extracted ID:', id);
    
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // Extract filename from ID
    const parts = id.split('_');
    console.log('ID parts:', parts);
    
    let originalFilename = parts.length >= 4 ? 
      decodeURIComponent(parts.slice(3).join('_')) : 
      decodeURIComponent(id.replace(/^rd_(movie|ufc)_/, ''));
    
    console.log('Original filename:', originalFilename);

    const isUfc = id.startsWith('rd_ufc_');
    console.log('Is UFC:', isUfc);
    
    // Create display title
    let displayTitle = originalFilename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .trim();

    console.log('Display title:', displayTitle);

    // Get images
    let poster, background;
    
    if (isUfc) {
      poster = 'https://i.imgur.com/Hz4oI65.png';
      background = 'https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000';
    } else {
      // Use text-based images as fallback for now
      poster = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`;
      background = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`;
    }

    console.log('Poster URL:', poster);
    console.log('Background URL:', background);

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

    console.log('Final meta object:', JSON.stringify(meta, null, 2));
    res.json({ meta: meta });
    
  } catch (error) {
    console.error('Error in meta handler:', error);
    res.status(500).json({ 
      error: 'Failed to process meta request',
      message: error.message 
    });
  }
}

// ... other handler functions (stream, debug-env, etc.)
