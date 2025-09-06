const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
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
      throw new Error('Real-Debrid API key is not configured');
    }

    // Fetch torrents from Real-Debrid API
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Real-Debrid API error: ${response.status} ${response.statusText}`);
    }

    const torrents = await response.json();
    
    console.log(`Found ${torrents.length} torrents from Real-Debrid API`);
    
    // Filter for only ready torrents and convert to Stremio format
    const metas = torrents
      .filter(torrent => torrent.status === 'downloaded')
      .map(torrent => {
        // Extract a cleaner title from the filename
        const originalName = torrent.filename || torrent.original_filename || '';
        let title = originalName
          .replace(/\./g, ' ')
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Shorten very long titles
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
        }
        
        return {
          id: `rd_movie_${torrent.id}`,
          type: 'movie',
          name: title,
          poster: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}`,
          posterShape: 'poster',
          genres: ['Real-Debrid', 'Cloud']
        };
      });

    console.log(`Returning ${metas.length} ready torrents`);
    res.json({ metas });
  } catch (error) {
    console.error('Error in debrid-cloud catalog:', error);
    // Return sample data as fallback
    res.json({ 
      metas: [
        {
          id: "rd_movie_1",
          type: "movie",
          name: "Sample Movie 1 (Fallback)",
          poster: "https://img.real-debrid.com/?text=Sample+1",
          posterShape: "poster"
        },
        {
          id: "rd_movie_2",
          type: "movie",
          name: "Sample Movie 2 (Fallback)",
          poster: "https://img.real-debrid.com/?text=Sample+2",
          posterShape: "poster"
        }
      ]
    });
  }
};
