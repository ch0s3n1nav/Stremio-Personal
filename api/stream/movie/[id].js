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

    if (!REAL_DEBRID_API_KEY) {
      console.error('Real-Debrid API key is not configured');
      return res.json({ streams: [] });
    }

    // Extract torrent ID from the ID
    const parts = id.split('_');
    const torrentId = parts[2]; // Third part is the torrent ID
    
    if (!torrentId) {
      console.error('Could not extract torrent ID from:', id);
      return res.json({ streams: [] });
    }

    console.log('Fetching torrent info for ID:', torrentId);
    
    // Fetch torrent info from Real-Debrid API
    const torrentResponse = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!torrentResponse.ok) {
      console.error('Real-Debrid torrent API error:', torrentResponse.status, torrentResponse.statusText);
      return res.json({ streams: [] });
    }

    const torrentInfo = await torrentResponse.json();
    
    if (!torrentInfo.links || torrentInfo.links.length === 0) {
      console.error('No download links found for torrent');
      return res.json({ streams: [] });
    }

    console.log(`Found ${torrentInfo.links.length} links for torrent`);

    // Get the first link (main file)
    const downloadLink = torrentInfo.links[0];
    
    // Now we need to unrestrict this link to get a direct download URL
    console.log('Unrestricting link:', downloadLink);
    
    const unrestrictResponse = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `link=${encodeURIComponent(downloadLink)}`
    });

    if (!unrestrictResponse.ok) {
      console.error('Real-Debrid unrestrict API error:', unrestrictResponse.status, unrestrictResponse.statusText);
      return res.json({ streams: [] });
    }

    const unrestrictInfo = await unrestrictResponse.json();
    
    if (!unrestrictInfo.download) {
      console.error('No direct download URL from unrestrict');
      return res.json({ streams: [] });
    }

    console.log('Got direct download URL:', unrestrictInfo.download);

    // Extract filename for title
    const filename = parts.length >= 4 ? decodeURIComponent(parts.slice(3).join('_')) : 'Real-Debrid Content';
    let displayTitle = filename.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .trim();

    // Create stream response with DIRECT download link
    const streams = [
      {
        title: displayTitle,
        name: 'Real-Debrid Stream',
        url: unrestrictInfo.download, // This is the DIRECT download link
        behaviorHints: {
          notWebReady: false, // This should be playable directly
          bingeGroup: `real-debrid-${id}`
        },
        type: 'movie'
      }
    ];

    console.log('Returning direct stream URL');
    res.json({ streams: streams });
  } catch (error) {
    console.error('Error in stream handler:', error);
    res.json({ streams: [] });
  }
};
