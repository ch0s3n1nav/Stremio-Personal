const { REAL_DEBRID_API_KEY } = process.env;

// Use a try-catch for the require to prevent breaking the handler
let ufcImageFinder;
try {
  ufcImageFinder = require('../utils/ufcImageFinder');
} catch (error) {
  console.warn('UFC image finder not available, using fallback images');
  ufcImageFinder = {
    findUfcEventImage: (title) => `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`,
    getUfcBackgroundImage: () => `https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000`
  };
}

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

    // Check if this is UFC content
    const isUfc = id.startsWith('rd_ufc_');
    
    // Create display title
    let displayTitle = originalFilename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .trim();

    // Get appropriate image
    let poster, background;
    
    if (isUfc) {
      // Use UFC-specific images
      poster = ufcImageFinder.findUfcEventImage(displayTitle);
      background = ufcImageFinder.getUfcBackgroundImage(displayTitle);
    } else {
      // Use generic images for non-UFC content
      poster = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`;
      background = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`;
    }

    // Create proper meta response
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
      videos: [
        {
          id: id + '_video',
          title: displayTitle,
          released: new Date().toISOString(),
          thumbnail: poster
        }
      ]
    };

    console.log('Returning meta for title:', displayTitle, 'UFC:', isUfc);
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
