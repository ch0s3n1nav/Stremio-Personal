const { REAL_DEBRID_API_KEY, TORBOX_API_KEY } = process.env;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ufcLogo = 'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png';
  const ufcBackground = 'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg';

  const metas = [];

  try {
    // --- Real-Debrid UFC ---
    if (REAL_DEBRID_API_KEY) {
      try {
        const rdResp = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
          headers: { 'Authorization': `Bearer ${REAL_DEBRID_API_KEY}` }
        });

        if (rdResp.ok) {
          const torrents = await rdResp.json();

          const rdUfc = torrents
            .filter(t => {
              const filename = (t.filename || '').toLowerCase();
              return (
                t.status === 'downloaded' &&
                (filename.includes('ufc') || filename.includes('mma') || filename.includes('fight'))
              );
            })
            .slice(0, 50)
            .map(t => {
              const filename = t.filename || 'UFC Event';
              const displayName = filename
                .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
                .replace(/\./g, ' ')
                .replace(/_/g, ' ')
                .trim();

              let eventName = displayName;
              const ufcMatch = displayName.match(/(ufc[\._\s]*\d+)/i);
              if (ufcMatch) {
                eventName = ufcMatch[0].toUpperCase().replace(/[\._]/g, ' ');
              }

              return {
                id: `rd_ufc_${t.id}_${filename}`,
                type: "movie",
                name: eventName,
                poster: ufcLogo,
                posterShape: "regular",
                background: ufcBackground,
                logo: ufcLogo
              };
            });

          metas.push(...rdUfc);
        }
      } catch (e) {
        console.error('RD UFC fetch error:', e.message);
      }
    }

    // --- TorBox UFC ---
    if (TORBOX_API_KEY) {
      try {
        const tbResp = await fetch('https://api.torbox.app/v1/api/torrents/mylist', {
          headers: { 'Authorization': `Bearer ${TORBOX_API_KEY}` }
        });

        if (tbResp.ok) {
          const json = await tbResp.json();
          const torrents = Array.isArray(json.data) ? json.data : [];

          const tbUfc = torrents
            .filter(t => {
              const name = (t.name || '').toLowerCase();
              return (
                t.download_finished &&
                t.download_present &&
                (name.includes('ufc') || name.includes('mma') || name.includes('fight'))
              );
            })
            .slice(0, 50)
            .map(t => {
              const filename = (t.files && t.files[0] && (t.files[0].short_name || t.files[0].name)) || t.name || 'UFC Event';
              const displayName = filename
                .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
                .replace(/\./g, ' ')
                .replace(/_/g, ' ')
                .trim();

              let eventName = displayName;
              const ufcMatch = displayName.match(/(ufc[\._\s]*\d+)/i);
              if (ufcMatch) {
                eventName = ufcMatch[0].toUpperCase().replace(/[\._]/g, ' ');
              }

              return {
                id: `tb_ufc_${t.id}_${encodeURIComponent(filename)}`,
                type: "movie",
                name: eventName,
                poster: ufcLogo,
                posterShape: "regular",
                background: ufcBackground,
                logo: ufcLogo
              };
            });

          metas.push(...tbUfc);
        } else {
          console.error('TorBox UFC mylist failed:', tbResp.status);
        }
      } catch (e) {
        console.error('TorBox UFC fetch error:', e.message);
      }
    }

    if (metas.length === 0) {
      metas.push({
        id: "rd_ufc_sample_001_UFC.300.mkv",
        type: "movie",
        name: "UFC 300",
        poster: ufcLogo,
        posterShape: "regular",
        background: ufcBackground,
        logo: ufcLogo
      });
    }

    res.json({ metas });
  } catch (error) {
    console.error('UFC catalog error:', error);
    res.json({ metas: [] });
  }
};
const { REAL_DEBRID_API_KEY, TORBOX_API_KEY } = process.env;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ufcLogo = 'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png';
  const ufcBackground = 'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg';

  const metas = [];

  try {
    // --- Real-Debrid UFC ---
    if (REAL_DEBRID_API_KEY) {
      try {
        const rdResp = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
          headers: { 'Authorization': `Bearer ${REAL_DEBRID_API_KEY}` }
        });

        if (rdResp.ok) {
          const torrents = await rdResp.json();

          const rdUfc = torrents
            .filter(t => {
              const filename = (t.filename || '').toLowerCase();
              return (
                t.status === 'downloaded' &&
                (filename.includes('ufc') || filename.includes('mma') || filename.includes('fight'))
              );
            })
            .slice(0, 50)
            .map(t => {
              const filename = t.filename || 'UFC Event';
              const displayName = filename
                .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
                .replace(/\./g, ' ')
                .replace(/_/g, ' ')
                .trim();

              let eventName = displayName;
              const ufcMatch = displayName.match(/(ufc[\._\s]*\d+)/i);
              if (ufcMatch) {
                eventName = ufcMatch[0].toUpperCase().replace(/[\._]/g, ' ');
              }

              return {
                id: `rd_ufc_${t.id}_${filename}`,
                type: "movie",
                name: eventName,
                poster: ufcLogo,
                posterShape: "regular",
                background: ufcBackground,
                logo: ufcLogo
              };
            });

          metas.push(...rdUfc);
        }
      } catch (e) {
        console.error('RD UFC fetch error:', e.message);
      }
    }

    // --- TorBox UFC ---
    if (TORBOX_API_KEY) {
      try {
        const tbResp = await fetch('https://api.torbox.app/v1/api/torrents/mylist', {
          headers: { 'Authorization': `Bearer ${TORBOX_API_KEY}` }
        });

        if (tbResp.ok) {
          const json = await tbResp.json();
          const torrents = Array.isArray(json.data) ? json.data : [];

          const tbUfc = torrents
            .filter(t => {
              const name = (t.name || '').toLowerCase();
              return (
                t.download_finished &&
                t.download_present &&
                (name.includes('ufc') || name.includes('mma') || name.includes('fight'))
              );
            })
            .slice(0, 50)
            .map(t => {
              const filename = (t.files && t.files[0] && (t.files[0].short_name || t.files[0].name)) || t.name || 'UFC Event';
              const displayName = filename
                .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
                .replace(/\./g, ' ')
                .replace(/_/g, ' ')
                .trim();

              let eventName = displayName;
              const ufcMatch = displayName.match(/(ufc[\._\s]*\d+)/i);
              if (ufcMatch) {
                eventName = ufcMatch[0].toUpperCase().replace(/[\._]/g, ' ');
              }

              return {
                id: `tb_ufc_${t.id}_${encodeURIComponent(filename)}`,
                type: "movie",
                name: eventName,
                poster: ufcLogo,
                posterShape: "regular",
                background: ufcBackground,
                logo: ufcLogo
              };
            });

          metas.push(...tbUfc);
        } else {
          console.error('TorBox UFC mylist failed:', tbResp.status);
        }
      } catch (e) {
        console.error('TorBox UFC fetch error:', e.message);
      }
    }

    if (metas.length === 0) {
      metas.push({
        id: "rd_ufc_sample_001_UFC.300.mkv",
        type: "movie",
        name: "UFC 300",
        poster: ufcLogo,
        posterShape: "regular",
        background: ufcBackground,
        logo: ufcLogo
      });
    }

    res.json({ metas });
  } catch (error) {
    console.error('UFC catalog error:', error);
    res.json({ metas: [] });
  }
};
