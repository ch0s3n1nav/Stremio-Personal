const { REAL_DEBRID_API_KEY } = process.env;

// UFC portrait poster for catalog view
const ufcPortraitPoster = 'https://i.imgur.com/GkrHvhe.jpeg';

module.exports = async (req, res) => {
  try {
    console.log('All Cloud Movies endpoint called');
    
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

    console.log('Fetching torrents from Real-Debrid API');
    
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
    
    // Filter for only ready torrents and convert to Stremio format
    const metas = torrents
      .filter(torrent => torrent.status === 'downloaded')
      .map(torrent => {
        // Use the EXACT filename from Real-Debrid
        const originalFilename = torrent.filename || torrent.original_filename || 'Unknown File';
        
        // Create a clean display title
        let displayTitle = originalFilename
          .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
          .replace(/\./g, ' ')
          .replace(/_/g, ' ')
          .trim();
        
        // SIMPLE UFC detection - just check for 'ufc' in filename
        const isUfc = originalFilename.toLowerCase().includes('ufc');
        console.log('File:', originalFilename, 'isUfc:', isUfc);
        
        // Create ID with proper prefix
        const idPrefix = isUfc ? 'rd_ufc' : 'rd_movie';
        const id = `${idPrefix}_${torrent.id}_${encodeURIComponent(originalFilename)}`;
        
        // Use UFC poster for UFC content, text-based for others
        const poster = isUfc ? ufcPortraitPoster : `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=600&height=900`;
        
        return {
          id: id,
          type: 'movie',
          name: displayTitle,
          poster: poster,
          posterShape: 'regular',
          description: `From your Real-Debrid cloud: ${displayTitle}`,
          genres: isUfc ? ['UFC', 'MMA', 'Fighting', 'Sports'] : ['Real-Debrid', 'Cloud']
        };
      });

    console.log(`Returning ${metas.length} ready torrents`);
    res.json({ metas });
  } catch (error) {
    console.error('Error in debrid-cloud catalog:', error);
    res.json({ metas: [] });
  }
};
