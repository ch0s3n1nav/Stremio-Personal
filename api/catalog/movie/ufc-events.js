const fs = require('fs');
const path = require('path');

const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const ufcLogo = 'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png';
  const ufcBackground = 'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg';

  const metas = [];

  try {
    // ---------------- REAL-DEBRID UFC ----------------
    if (REAL_DEBRID_API_KEY) {
      try {
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
              const displayName = filename
                .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
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
      } catch (e) {
        console.error("RD UFC error:", e.message);
      }
    }

    // ---------------- MANUAL TORBOX UFC ----------------
    try {
      const filePath = path.join(process.cwd(), 'api', 'data', 'torbox-manual.json');
      const raw = fs.readFileSync(filePath, 'utf8');
      const manual = JSON.parse(raw);

      if (manual.files && Array.isArray(manual.files)) {
        manual.files.forEach(entry => {
          try {
            const url = entry.url;
            if (!url) return;

            const filename = decodeURIComponent(url.split('/').pop());
            const lower = filename.toLowerCase();

            if (
              !lower.includes('ufc') &&
              !lower.includes('fight') &&
              !lower.includes('mma')
            ) return;

            const displayName = filename
              .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
              .replace(/\./g, ' ')
              .replace(/_/g, ' ')
              .trim();

            metas.push({
              id: `manual_tb_${encodeURIComponent(filename)}`,
              type: "movie",
              name: displayName,
              poster: ufcLogo,
              posterShape: "regular",
              background: ufcBackground,
              url: url
            });

          } catch (innerErr) {
            console.error("Manual TorBox item error:", innerErr.message);
          }
        });
      }

    } catch (e) {
      console.error("Manual TorBox read error:", e.message);
    }

    return res.json({ metas });

  } catch (fatal) {
    console.error("UFC fatal error:", fatal);
    return res.json({ metas: [] });
  }
};
