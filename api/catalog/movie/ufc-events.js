const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    console.log('UFC Events endpoint called');
    
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

    if (!REAL_DEBRID_API_KEY) {
      console.error('Real-Debrid API key is not configured');
      return res.json({ metas: [] });
    }

    console.log('Fetching torrents from Real-Debrid API for UFC content');
    
    // Fetch torrents from Real-Debrid API
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Real-Debrid API error: ${response.status} ${response.statusText}`, errorText);
      return res.json({ metas: [] });
    }

    const torrents = await response.json();
    
    console.log(`Found ${torrents.length} torrents from Real-Debrid API`);
    
    // Filter for UFC content using the EXACT filename from Real-Debrid
    const ufcTorrents = torrents.filter(torrent => {
      if (torrent.status !== 'downloaded') return false;
      
      const filename = (torrent.filename || '').toLowerCase();
      const originalFilename = (torrent.original_filename || '').toLowerCase();
      
      // Check if filename contains UFC patterns
      const hasUfc = filename.includes('ufc') || originalFilename.includes('ufc');
      
      return hasUfc;
    });
    
    console.log(`Found ${ufcTorrents.length} UFC torrents`);
    
    // Convert to Stremio catalog format
    const metas = ufcTorrents.map(torrent => {
      // Use the EXACT filename from Real-Debrid
      const originalFilename = torrent.filename || torrent.original_filename || 'Unknown UFC File';
      
      // Create a clean display title (remove file extension)
      let displayTitle = originalFilename
        .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .trim();
      
      // Ensure UFC is in the title for consistency
      if (!displayTitle.toLowerCase().includes('ufc')) {
        displayTitle = 'UFC: ' + displayTitle;
      }
      
      // Create ID with REAL torrent ID AND original filename for meta handler
      const id = `rd_ufc_${torrent.id}_${encodeURIComponent(originalFilename)}`;
      
      return {
        id: id,
        type: 'movie',
        name: displayTitle,
        poster: `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`,
        posterShape: 'regular',
        description: `UFC Content from your Real-Debrid cloud`,
        genres: ['UFC', 'MMA', 'Fighting', 'Sports']
      };
    });

    console.log(`Returning ${metas.length} UFC torrents`);
    res.json({ metas });
  } catch (error) {
    console.error('Error in UFC events catalog:', error);
    res.json({ metas: [] });
  }
};
