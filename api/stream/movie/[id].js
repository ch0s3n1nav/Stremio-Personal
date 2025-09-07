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

    // Extract the filename from the ID (same as meta handler)
    const parts = id.split('_');
    let filename = '';
    
    if (parts.length >= 4) {
      filename = parts.slice(3).join('_');
      filename = decodeURIComponent(filename);
    } else {
      filename = id.replace(/^rd_(movie|ufc)_/, '').replace(/_/g, ' ');
      filename = decodeURIComponent(filename);
    }

    let displayTitle = filename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // For Real-Debrid streaming, we need to get the actual stream URL
    // This is a simplified version - you might need to implement proper Real-Debrid API calls
    const torrentId = parts[2]; // The torrent ID from the ID string
    
    let streamUrl = '';
    
    if (REAL_DEBRID_API_KEY && torrentId) {
      try {
        // Fetch torrent info to get download links
        const response = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
          headers: {
            'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
          }
        });

        if (response.ok) {
          const torrentInfo = await response.json();
          if (torrentInfo.links && torrentInfo.links.length > 0) {
            // Use the first available link
            streamUrl = torrentInfo.links[0];
          }
        }
      } catch (apiError) {
        console.error('Error fetching from Real-Debrid API:', apiError);
      }
    }

    // If we couldn't get a real URL, create a dummy one
    if (!streamUrl) {
      streamUrl = `https://dav.real-debrid.com/${encodeURIComponent(filename)}`;
    }

    const streams = [
      {
        title: displayTitle,
        name: 'Real-Debrid Stream',
        url: streamUrl,
        behaviorHints: {
          notWebReady: true, // Real-Debrid links need special handling
          proxyHeaders: {
            request: {
              Authorization: `Bearer ${REAL_DEBRID_API_KEY}`
            }
          },
          bingeGroup: `real-debrid-${id}`
        },
        type: 'movie'
      }
    ];

    console.log('Returning stream for:', displayTitle);
    res.json({ streams: streams });
  } catch (error) {
    console.error('Error in stream handler:', error);
    res.json({ streams: [] });
  }
};
