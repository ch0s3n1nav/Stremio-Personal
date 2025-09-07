const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    console.log('Stream request for ID:', id);
    
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

    // Fetch torrent info to get download links
    const response = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Real-Debrid API error:', response.status);
      return res.json({ streams: [] });
    }

    const torrentInfo = await response.json();
    
    // Get the first available link (usually the largest file)
    const links = torrentInfo.links || [];
    if (links.length === 0) {
      return res.json({ streams: [] });
    }

    // For now, use the first link - you might want to implement file selection logic
    const streamUrl = links[0];
    
    // Create stream response
    const streams = [
      {
        name: 'Real-Debrid Stream',
        title: torrentInfo.filename || 'Real-Debrid Content',
        url: streamUrl,
        // Stremio will handle the actual streaming through its internal mechanisms
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: {
            request: {
              // These headers will help with authentication
              Authorization: `Bearer ${REAL_DEBRID_API_KEY}`
            }
          }
        }
      }
    ];

    res.json({ streams });
  } catch (error) {
    console.error('Error in stream handler:', error);
    res.json({ streams: [] });
  }
};
