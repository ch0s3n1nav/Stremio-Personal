const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
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

    // Extract the torrent ID from our custom ID format
    const torrentId = id.replace('rd_movie_', '').replace('rd_ufc_', '');
    
    if (!REAL_DEBRID_API_KEY) {
      return res.status(500).json({ error: 'Real-Debrid API key not configured' });
    }

    // Fetch torrent info from Real-Debrid
    const response = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Real-Debrid API error:', response.status);
      // Return basic meta as fallback
      return res.json({
        meta: {
          id: id,
          type: 'movie',
          name: 'Content from Real-Debrid',
          poster: 'https://img.real-debrid.com/?text=Real-Debrid&width=300&height=450',
          posterShape: 'regular',
          description: 'Content from your Real-Debrid cloud storage'
        }
      });
    }

    const torrentInfo = await response.json();
    const filename = torrentInfo.filename || torrentInfo.original_filename || 'Real-Debrid Content';
    
    // Create clean title
    let title = filename
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove file extensions
    title = title.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '');
    
    // Create meta response
    const meta = {
      id: id,
      type: 'movie',
      name: title,
      poster: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`,
      posterShape: 'regular',
      description: `From your Real-Debrid cloud: ${title}`,
      genres: ['Real-Debrid', 'Cloud'],
      // Add more metadata fields as needed
      runtime: '120 min',
      released: new Date().toISOString().split('T')[0]
    };

    res.json({ meta });
  } catch (error) {
    console.error('Error in meta handler:', error);
    // Fallback response
    res.json({
      meta: {
        id: req.query.id,
        type: 'movie',
        name: 'Real-Debrid Content',
        poster: 'https://img.real-debrid.com/?text=Real-Debrid&width=300&height=450',
        posterShape: 'regular',
        description: 'Content from your Real-Debrid cloud storage'
      }
    });
  }
};
