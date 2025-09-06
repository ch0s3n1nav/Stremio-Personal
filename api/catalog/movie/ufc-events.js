const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    if (!REAL_DEBRID_API_KEY) {
      throw new Error('Real-Debrid API key is not configured');
    }

    // Fetch torrents from Real-Debrid
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Real-Debrid API error: ${response.status} ${response.statusText}`);
    }

    const torrents = await response.json();
    
    // Filter for UFC content
    const ufcTorrents = torrents.filter(torrent => 
      torrent.filename.toLowerCase().includes('ufc') || 
      torrent.filename.toLowerCase().includes('mma')
    );
    
    // Convert to Stremio catalog format
    const metas = ufcTorrents.map(torrent => {
      // Extract title from torrent filename
      const title = torrent.filename.replace(/\./g, ' ').replace(/_/g, ' ');
      
      return {
        id: `rd_ufc_${torrent.id}`,
        type: 'movie',
        name: title,
        poster: `https://img.real-debrid.com/?src=${encodeURIComponent(torrent.filename)}`,
        posterShape: 'poster'
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ metas });
  } catch (error) {
    console.error('Error in UFC events catalog:', error);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Failed to fetch UFC content',
      details: error.message 
    });
  }
};
