const { REAL_DEBRID_API_KEY, TORBOX_API_KEY } = process.env;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const metas = [];

  try {
    // --- Real-Debrid cloud ---
    if (REAL_DEBRID_API_KEY) {
      try {
        const rdResp = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
          headers: { 'Authorization': `Bearer ${REAL_DEBRID_API_KEY}` }
        });

        if (rdResp.ok) {
          const torrents = await rdResp.json();
          const rdMetas = torrents
            .filter(t => t.status === 'downloaded')
            .slice(0, 50)
            .map(t => {
              const filename = t.filename || 'Unknown';
              const displayName = filename
                .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
                .replace(/\./g, ' ')
                .replace(/_/g, ' ')
                .trim();

              return {
                id: `rd_movie_${t.id}_${filename}`,
                type: "movie",
                name: displayName,
                poster: `https://img.real-debrid.com/?text=${encodeURIComponent(displayName)}&width=300&height=450`,
                posterShape: "regular",
                background: `https://img.real-debrid.com/?text=${encodeURIComponent(displayName)}&width=800&height=450`
              };
            });

          metas.push(...rdMetas);
        }
      } catch (e) {
        console.error('RD cloud fetch error:', e.message);
      }
    }

    // --- TorBox cloud ---
    if (TORBOX_API_KEY) {
      try {
        const tbResp = await fetch('https://api.torbox.app/v1/api/torrents/mylist', {
          headers: { 'Authorization': `Bearer ${TORBOX_API_KEY}` }
        });

        if (tbResp.ok) {
          const json = await tbResp.json();
          const torrents = Array.isArray(json.data) ? json.data : [];

          const tbMetas = torrents
            .filter(t => t.download_finished && t.download_present && t.files && t.files.length > 0)
            .slice(0, 50)
            .map(t => {
              const file = t.files[0];
              const filename = file.short_name || file.name || t.name || 'TorBox Content';
              const displayName = filename
                .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
                .replace(/\./g, ' ')
                .replace(/_/g, ' ')
                .trim();

              return {
                id: `tb_movie_${t.id}_${encodeURIComponent(filename)}`,
                type: "movie",
                name: displayName,
                poster: `https://img.real-debrid.com/?text=${encodeURIComponent(displayName)}&width=300&height=450`,
                posterShape: "regular",
                background: `https://img.real-debrid.com/?text=${encodeURIComponent(displayName)}&width=800&height=450`
              };
            });

          metas.push(...tbMetas);
        } else {
          console.error('TorBox mylist failed:', tbResp.status);
        }
      } catch (e) {
        console.error('TorBox cloud fetch error:', e.message);
      }
    }

    res.json({ metas });
  } catch (error) {
    console.error('Error in debrid-cloud catalog:', error);
    res.json({ metas: [] });
  }
};
