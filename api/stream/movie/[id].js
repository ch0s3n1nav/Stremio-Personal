const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    const id = req.query.id;
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

    // Extract title from ID for display
    const titleFromId = id.replace(/^rd_(movie|ufc)_/, '').replace(/_/g, ' ');
    let title = decodeURIComponent(titleFromId);
    
    if (title.length === 32 || title.length === 40 || /^[0-9a-f]+$/i.test(title)) {
      title = 'Real-Debrid Content';
    }

    // For now, create a dummy stream response
    // In production, you'd fetch the actual Real-Debrid stream URL
    const streams = [
      {
        title: title || 'Real-Debrid Stream',
        name: 'Real-Debrid', // This appears in the player UI
        // For Real-Debrid, we need to provide a URL that Stremio can handle
        // This might need to be a proxy URL or direct link with auth
        url: `https://dav.real-debrid.com/${encodeURIComponent(title)}.mp4`,
        
        // Important: Stremio needs to know how to handle this stream
        behaviorHints: {
          notWebReady: false, // Set to true if it needs special handling
          proxyHeaders: {
            request: {
              Authorization: `Bearer ${REAL_DEBRID_API_KEY}`
            }
          },
          // Additional hints for Stremio
          bingeGroup: `real-debrid-${id}`,
          externalPlayer: {
            name: 'Real-Debrid',
            supported: true
          }
        },
        
        // Stream metadata
        type: 'movie',
        hash: id,
        quality: '1080p',
        size: 1024 * 1024 * 1500, // Approximate size in bytes (1.5GB)
        // Add more stream info as needed
      }
    ];

    console.log('Returning stream for ID:', id);
    res.json({ streams: streams }); // Note: { streams: [...] } format
  } catch (error) {
    console.error('Error in stream handler:', error);
    // Return empty streams array instead of error
    res.json({ streams: [] });
  }
};
