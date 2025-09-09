const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    const id = req.query.id;
    console.log('Stream request for ID:', id);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required', streams: [] });
    }

    if (!REAL_DEBRID_API_KEY) {
      console.error('Real-Debrid API key is not configured');
      return res.json({ error: 'API key not configured', streams: [] });
    }

    const parts = id.split('_');
    if (parts.length < 3) {
      console.error('Invalid ID format:', id);
      return res.json({ error: 'Invalid ID format', streams: [] });
    }

    const torrentId = parts[2];
    console.log('Extracted torrent ID:', torrentId);

    const torrentResponse = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
      headers: { 'Authorization': `Bearer ${REAL_DEBRID_API_KEY}` }
    });

    if (!torrentResponse.ok) {
      const errorText = await torrentResponse.text();
      console.error('Real-Debrid torrent API error:', torrentResponse.status, errorText);
      return res.json({ error: `Torrent API error: ${torrentResponse.status}`, streams: [] });
    }

    const torrentInfo = await torrentResponse.json();
    console.log('Torrent info received successfully');
    
    if (!torrentInfo.links || torrentInfo.links.length === 0) {
      console.error('No download links found for torrent');
      return res.json({ error: 'No download links found', streams: [] });
    }

    console.log(`Found ${torrentInfo.links.length} links for torrent`);
    const downloadLink = torrentInfo.links[0];
    
    const unrestrictResponse = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `link=${encodeURIComponent(downloadLink)}`
    });

    if (!unrestrictResponse.ok) {
      const errorText = await unrestrictResponse.text();
      console.error('Real-Debrid unrestrict API error:', unrestrictResponse.status, errorText);
      return res.json({ error: `Unrestrict API error: ${unrestrictResponse.status}`, streams: [] });
    }

    const unrestrictInfo = await unrestrictResponse.json();
    console.log('Unrestrict info received successfully');
    
    if (!unrestrictInfo.download) {
      console.error('No direct download URL from unrestrict');
      return res.json({ error: 'No download URL from unrestrict', streams: [] });
    }

    console.log('Got direct download URL:', unrestrictInfo.download);

    const filename = parts.length >= 4 ? decodeURIComponent(parts.slice(3).join('_')) : 'Real-Debrid Content';
    let displayTitle = filename.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .trim();

    const streams = [
      {
        title: displayTitle,
        name: 'Nav\'s Cloud Stream',
        url: unrestrictInfo.download,
        behaviorHints: {
          notWebReady: false,
          bingeGroup: `navs-cloud-${id}`
        },
        type: 'movie'
      }
    ];

    console.log('Successfully returning stream URL');
    res.json({ streams });
  } catch (error) {
    console.error('Error in stream handler:', error);
    res.json({ error: error.message, streams: [] });
  }
};
