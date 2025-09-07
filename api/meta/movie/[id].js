const { REAL_DEBRID_API_KEY } = process.env;

// UFC images
const ufcLogo = 'https://i.imgur.com/Hz4oI65.png';
const ufcBackground = 'https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000';

module.exports = async (req, res) => {
  try {
    const id = req.query.id;
    console.log('Meta request for ID:', id);
    
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // Extract the original filename from the ID
    const parts = id.split('_');
    let originalFilename = '';
    
    if (parts.length >= 4) {
      originalFilename = parts.slice(3).join('_');
      originalFilename = decodeURIComponent(originalFilename);
    } else {
      originalFilename = id.replace(/^rd_(movie|ufc)_/, '');
      originalFilename = decodeURIComponent(originalFilename);
    }

    // DEBUG: Check what the ID starts with
    console.log('ID starts with:', id.substring(0, 10));
    
    // Check if this is UFC content - BETTER DETECTION
    const isUfc = id.startsWith('rd_ufc_');
    console.log('Is UFC content:', isUfc, 'Full ID:', id);
    
    // Create display title
    let displayTitle = originalFilename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .trim();

    // Get appropriate image - FORCE UFC LOGO FOR TESTING
    let poster, background;
    
    if (isUfc) {
      // Use UFC-specific images
      poster = ufcLogo;
      background = ufcBackground;
      console.log('USING UFC LOGO:', ufcLogo);
    } else {
      // Use generic images for non-UFC content
      poster = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`;
      background = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`;
      console.log('Using text image for non-UFC content');
    }

    // Create proper meta response with debug info
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
      year: new Date().getFullYear().toString(),
      // Debug info
      _debug: {
        isUfc: isUfc,
        idPrefix: id.substring(0, 10),
        originalFilename: originalFilename
      },
      videos: [
        {
          id: id + '_video',
          title: displayTitle,
          released: new Date().toISOString(),
          thumbnail: poster
        }
      ]
    };

    console.log('Returning meta. UFC:', isUfc, 'Poster:', poster);
    res.json({ meta: meta });
  } catch (error) {
    console.error('Error in meta handler:', error);
    res.json({
      meta: {
        id: req.query.id || 'unknown',
        type: 'movie',
        name: 'Real-Debrid Content',
        poster: 'https://img.real-debrid.com/?text=Real-Debrid&width=300&height=450',
        posterShape: 'regular',
        description: 'Content from your Real-Debrid cloud storage'
      }
    });
  }
};
