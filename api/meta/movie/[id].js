const { REAL_DEBRID_API_KEY } = process.env;

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
    // ID format: rd_movie_12345_UFC.Tuesday.Night.Contender.Series.S09W04.1080p.WEB-DL.H264.Fight-BB.mkv
    const parts = id.split('_');
    let originalFilename = '';
    
    if (parts.length >= 4) {
      // Rejoin everything after the third underscore (which is the original filename)
      originalFilename = parts.slice(3).join('_');
      originalFilename = decodeURIComponent(originalFilename);
    } else {
      originalFilename = id.replace(/^rd_(movie|ufc)_/, '');
      originalFilename = decodeURIComponent(originalFilename);
    }

    // Create display title (remove file extension)
    let displayTitle = originalFilename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .trim();

    // Create proper meta response
    const meta = {
      id: id,
      type: 'movie',
      name: displayTitle,
      poster: `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`,
      posterShape: 'regular',
      description: `Content from your Real-Debrid cloud: ${displayTitle}`,
      background: `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`,
      genres: ['Real-Debrid', 'Cloud'],
      runtime: '120 min',
      year: new Date().getFullYear().toString(),
      videos: [
        {
          id: id + '_video',
          title: displayTitle,
          released: new Date().toISOString()
        }
      ]
    };

    console.log('Returning meta for title:', displayTitle);
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
