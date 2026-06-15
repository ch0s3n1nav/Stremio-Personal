const { REAL_DEBRID_API_KEY, TORBOX_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    const id = req.query.id;
    // --- Manual TorBox direct URL path ---
if (id.startsWith("manual_tb_")) {
  try {
    const fs = require('fs');
    const path = require('path');

    const filename = decodeURIComponent(id.replace("manual_tb_", ""));

    const filePath = path.join(process.cwd(), 'api', 'data', 'torbox-manual.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const manual = JSON.parse(raw);

    const entry = manual.files.find(f => f.url.includes(filename));

    if (!entry) {
      console.error("Manual TB: file not found");
      return res.json({ streams: [] });
    }

    return res.json({
      streams: [
        {
          title: filename,
          name: "Manual TorBox",
          url: entry.url,
          behaviorHints: {
            notWebReady: false,
            bingeGroup: `manual-tb-${id}`
          },
          type: "movie"
        }
      ]
    });

  } catch (err) {
    console.error("Manual TB stream error:", err.message);
    return res.json({ streams: [] });
  }
}

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

    const parts = id.split('_');
    if (parts.length < 3) {
      console.error('Invalid ID format:', id);
      return res.json({ error: 'Invalid ID format', streams: [] });
    }

    const providerPrefix = parts[0]; // rd or tb
    const contentType = parts[1];    // movie or ufc
    const torrentId = parts[2];

    console.log('Provider:', providerPrefix, 'Type:', contentType, 'Torrent ID:', torrentId);

    // --- Real-Debrid path ---
    if (providerPrefix === 'rd') {
      if (!REAL_DEBRID_API_KEY) {
        console.error('Real-Debrid API key is not configured');
        return res.json({ error: 'Real-Debrid API key not configured', streams: [] });
      }

      const torrentResponse = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
        headers: { 'Authorization': `Bearer ${REAL_DEBRID_API_KEY}` }
      });

      if (!torrentResponse.ok) {
        const errorText = await torrentResponse.text();
        console.error('Real-Debrid torrent API error:', torrentResponse.status, errorText);
        return res.json({ error: `Torrent API error: ${torrentResponse.status}`, streams: [] });
      }

      const torrentInfo = await torrentResponse.json();
      console.log('RD torrent info received successfully');

      if (!torrentInfo.links || torrentInfo.links.length === 0) {
        console.error('No download links found for RD torrent');
        return res.json({ error: 'No download links found', streams: [] });
      }

      const downloadLink = torrentInfo.links[0];

      const unrestrictResponse = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `link=${encodeURIComponent(downloadLink)}`
      });

      if (!unrestrictResponse.ok) {
        const errorText = await unrestrictResponse.text();
        console.error('Real-Debrid unrestrict API error:', unrestrictResponse.status, errorText);
        return res.json({ error: `Unrestrict API error: ${unrestrictResponse.status}`, streams: [] });
      }

      const unrestrictInfo = await unrestrictResponse.json();
      console.log('RD unrestrict info received successfully');

      if (!unrestrictInfo.download) {
        console.error('No direct download URL from RD unrestrict');
        return res.json({ error: 'No download URL from unrestrict', streams: [] });
      }

      const filename = parts.length >= 4 ? decodeURIComponent(parts.slice(3).join('_')) : 'Real-Debrid Content';
      let displayTitle = filename
        .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .trim();

      const streams = [
        {
          title: displayTitle,
          name: "Nav's Cloud (Real-Debrid)",
          url: unrestrictInfo.download,
          behaviorHints: {
            notWebReady: false,
            bingeGroup: `navs-cloud-rd-${id}`
          },
          type: 'movie'
        }
      ];

      console.log('Returning RD stream');
      return res.json({ streams });
    }

    // --- TorBox path ---
    if (providerPrefix === 'tb') {
      if (!TORBOX_API_KEY) {
        console.error('TorBox API key is not configured');
        return res.json({ error: 'TorBox API key not configured', streams: [] });
      }

      const tbResp = await fetch(
        `https://api.torbox.app/v1/api/torrents/requestdl?torrent_id=${encodeURIComponent(torrentId)}&token=${encodeURIComponent(TORBOX_API_KEY)}`
      );

      if (!tbResp.ok) {
        const errorText = await tbResp.text();
        console.error('TorBox requestdl error:', tbResp.status, errorText);
        return res.json({ error: `TorBox requestdl error: ${tbResp.status}`, streams: [] });
      }

      const tbJson = await tbResp.json();
      console.log('TorBox requestdl response:', tbJson.detail || 'OK');

      if (!tbJson.success || !tbJson.data) {
        console.error('TorBox did not return a direct URL');
        return res.json({ error: 'TorBox did not return a direct URL', streams: [] });
      }

      const directUrl = tbJson.data;

      const filename = parts.length >= 4 ? decodeURIComponent(parts.slice(3).join('_')) : 'TorBox Content';
      let displayTitle = filename
        .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .trim();

      const streams = [
        {
          title: displayTitle,
          name: "Nav's Cloud (TorBox)",
          url: directUrl,
          behaviorHints: {
            notWebReady: false,
            bingeGroup: `navs-cloud-tb-${id}`
          },
          type: 'movie'
        }
      ];

      console.log('Returning TorBox stream');
      return res.json({ streams });
    }

    // Unknown provider
    console.error('Unknown provider prefix:', providerPrefix);
    return res.json({ error: 'Unknown provider', streams: [] });
  } catch (error) {
    console.error('Error in stream handler:', error);
    res.json({ error: error.message, streams: [] });
  }
};
