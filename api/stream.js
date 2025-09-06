export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { type, id } = req.query;

  try {
    if (!id || !id.startsWith('rd_')) {
      return res.json({ streams: [] });
    }

    const torrentId = id.replace('rd_', '');
    const apiKey = process.env.REAL_DEBRID_API_KEY;

    if (!apiKey) {
      // Fallback to sample stream if no API key
      return res.json({
        streams: [{
          title: "Real-Debrid Stream (Setup Required)",
          name: "Debrid Cloud",
          url: `https://real-debrid.com/stream/${torrentId}`,
          behaviorHints: { notWebReady: true }
        }]
      });
    }

    // Get torrent info to get download links
    const torrentResponse = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!torrentResponse.ok) {
      throw new Error(`Failed to get torrent info: ${torrentResponse.status}`);
    }

    const torrentInfo = await torrentResponse.json();

    // Get unrestrict links for all files
    const streams = await Promise.all(
      torrentInfo.links.map(async (link) => {
        const unrestrictResponse = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `link=${encodeURIComponent(link)}`
        });

        if (unrestrictResponse.ok) {
          const unrestrictInfo = await unrestrictResponse.json();
          return {
            title: unrestrictInfo.filename,
            name: "Debrid Cloud",
            url: unrestrictInfo.download,
            behaviorHints: { notWebReady: true }
          };
        }
        return null;
      })
    );

    // Filter out null responses and return
    res.json({ streams: streams.filter(stream => stream !== null) });

  } catch (error) {
    console.error('Stream error:', error);
    res.json({ streams: [] });
  }
}
