const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Extract ID from the request
    const id = req.query.id || (req.url ? req.url.split('/').pop().replace('.json', '') : '');
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

    // For now, return a dummy stream response
    // In a real implementation, you'd fetch from Real-Debrid API
    const title = decodeURIComponent(id.replace(/rd_(movie|ufc)_/, '').replace(/_/g, ' '));
    
    const streams = [
      {
        name: 'Real-Debrid Stream',
        title: title || 'Real-Debrid Content',
        url: `https://dav.real-debrid.com/${encodeURIComponent(title || 'content')}`,
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: {
            request: {
              Authorization: `Bearer ${REAL_DEBRID_API_KEY}`
            }
          }
        }
      }
    ];

    console.log('Returning stream for:', title);
    res.json({ streams });
  } catch (error) {
    console.error('Error in stream handler:', error);
    res.json({ streams: [] });
  }
};
