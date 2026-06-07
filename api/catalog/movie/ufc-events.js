const { REAL_DEBRID_API_KEY, TORBOX_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const ufcLogo = 'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png';
    const ufcBackground = 'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg';

    const metas = [];

    // ---------------- RD UFC ----------------
    try {
      if (REAL_DEBRID_API_KEY) {
        const rdResp = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
          headers: { Authorization: `Bearer ${REAL_DEBRID_API_KEY}` }
        });

        if (rdResp.ok) {
          const torrents = await rdResp.json();

          torrents
            .filter(t => {
              const name = (t.filename || '').toLowerCase();
              return t.status === 'downloaded' &&
                (name.includes('ufc') || name.includes('mma') || name.includes('fight'));
            })
            .forEach(t => {
              const filename = t.filename || 'UFC Event';
              const displayName = filename.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
                .replace(/\./g, ' ')
                .replace(/_/g, ' ')
                .trim();

              metas.push({
                id: `rd_ufc_${t.id}_${filename}`,
                type: "movie",
                name: displayName,
                poster: ufcLogo,
                posterShape: "regular",
                background: ufcBackground
              });
            });
        }
      }
    } catch (err) {
      return res.json({ error: "RD UFC error: " + err.message });
    }

    // ---------------- TORBOX UFC ----------------
    try {
      if (TORBOX_API_KEY) {
        const tbResp = await fetch('https://api.torbox.app/v1/api/torrents/mylist', {
          headers: { Authorization: `Bearer ${TORBOX_API_KEY}` }
        });

        if (!tbResp.ok) {
          return res.json({ error: "TorBox fetch failed: " + tbResp.status });
        }

        const json = await tbResp.json();

        if (!json.success || !Array.isArray(json.data)) {
          return res.json({ error: "TorBox returned no data", raw: json });
        }

        json.data.forEach(t => {
          try {
            const rawName =
              (t.name || '') + ' ' +
              (t.files?.[0]?.short_name || '') + ' ' +
              (t.files?.[0]?.name || '');

            const name = rawName.toLowerCase();

            const isDownloaded =
              t.download_present === true ||
              t.progress === 1 ||
              t.download_state === "cached";

            if (!isDownloaded) return;
            if (!name.includes('ufc') && !name.includes('mma') && !name.includes('fight')) return;

            const file = t.files?.[0];
            const filename =
              file?.short_name ||
              file?.name ||
              t.name ||
              'UFC Event';

            const displayName = filename.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
              .replace(/\./g, ' ')
              .replace(/_/g, ' ')
              .trim();

            metas.push({
              id: `tb_ufc_${t.id}_${encodeURIComponent(filename)}`,
              type: "movie",
              name: displayName,
              poster: ufcLogo,
              posterShape: "regular",
              background: ufcBackground
            });

          } catch (innerErr) {
            metas.push({ error: "TorBox item error: " + innerErr.message, item: t });
          }
        });
      }
    } catch (err) {
      return res.json({ error: "TorBox UFC error: " + err.message });
    }

    return res.json({ metas });

  } catch (fatal) {
    return res.json({ fatal: fatal.message, stack: fatal.stack });
  }
};
