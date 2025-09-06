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
    
    // Filter for UFC content and ready torrents
    const ufcTorrents = torrents.filter(torrent => 
      torrent.status === 'downloaded' && (
        (torrent.filename && torrent.filename.toLowerCase().includes('ufc')) || 
        (torrent.original_filename && torrent.original_filename.toLowerCase().includes('ufc')) ||
        ((torrent.filename + ' ' + torrent.original_filename).toLowerCase().includes('mma'))
      )
    );
    
    // Convert to Stremio catalog format
    const metas = ufcTorrents.map(torrent => {
      const originalName = torrent.filename || torrent.original_filename || '';
      let title = originalName
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Add UFC prefix and shorten if needed
      if (!title.toLowerCase().includes('ufc')) {
        title = 'UFC: ' + title;
      }
      
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      
      return {
        id: `rd_ufc_${torrent.id}`,
        type: 'movie',
        name: title,
        poster: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}`,
        posterShape: 'poster',
        genres: ['UFC', 'MMA', 'Fighting', 'Real-Debrid']
      };
    });

    res.json({ metas });
  } catch (error) {
    console.error('Error in UFC events catalog:', error);
    // Return sample UFC data as fallback
    res.json({ 
      metas: [
        {
          id: "rd_ufc_1",
          type: "movie",
          name: "UFC 300: Sample Event (Fallback)",
          poster: "https://img.real-debrid.com/?text=UFC+300",
          posterShape: "poster"
        },
        {
          id: "rd_ufc_2",
          type: "movie",
          name: "UFC 299: Another Event (Fallback)",
          poster: "https://img.real-debrid.com/?text=UFC+299",
          posterShape: "poster"
        }
      ]
    });
  }
};
