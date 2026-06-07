const { REAL_DEBRID_API_KEY, TORBOX_API_KEY } = process.env;

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

    // ---------------- TORBOX UFC ----------------
    if (TORBOX_API_KEY) {
      try {
        const tbResp = await fetch(
          `https://api.torbox.app/v1/api/torrents/mylist?token=${TORBOX_API_KEY}`
        );

        if (!tbResp.ok) {
          console.error("TorBox UFC fetch failed:", tbResp.status);
        } else {
          const json = await tbResp.json();

          if (json.success && Array.isArray(json.data)) {
            json.data.forEach(t => {
              try {
                const file = t.files?.[0];

                const rawName = [
                  t.name || '',
                  file?.short_name || '',
                  file?.name || ''
                ].join(' ').toLowerCase();

                const isDownloaded =
                  t.download_present === true ||
                  Number(t.progress) === 1 ||
                  String(t.download_state).toLowerCase() === "cached";

                if (!isDownloaded) return;

                if (
                  !rawName.includes('ufc') &&
                  !rawName.includes('fight') &&
                  !rawName.includes('mma')
                ) return;

                const filename =
                  file?.short_name ||
                  file?.name?.split('/').pop() ||
                  t.name ||
                  'UFC Event';

                const displayName = filename
                  .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
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
                console.error("TorBox item error:", innerErr.message);
              }
            });
          }
        }
      } catch (e) {
        console.error("TorBox UFC error:", e.message);
      }
    }

    return res.json({ metas });

  } catch (fatal) {
    console.error("UFC fatal error:", fatal);
    return res.json({ metas: [] });
  }
};
