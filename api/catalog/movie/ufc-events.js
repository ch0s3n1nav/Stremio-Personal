const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ufcLogo = 'https://i.imgur.com/Hz4oI65.png';
  const ufcBackground = 'https://i.imgur.com/GkrHvhe.jpeg';

  try {
    if (!REAL_DEBRID_API_KEY) {
      return res.json({ metas: [] });
    }

    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      return res.json({ metas: [] });
    }

    const torrents = await response.json();
    
    const ufcMetas = torrents
      .filter(torrent => {
        const filename = (torrent.filename || '').toLowerCase();
        return (
          torrent.status === 'downloaded' && 
          (filename.includes('ufc') || filename.includes('mma') || filename.includes('fight'))
        );
      })
      .slice(0, 50)
      .map(torrent => {
        const filename = torrent.filename || 'UFC Event';
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
          id: `rd_ufc_${torrent.id}_${filename}`,
          type: "movie",
          name: eventName,
          poster: ufcLogo, // Front page icon
          posterShape: "regular",
          background: ufcBackground, // Detail page background
          logo: ufcLogo // This should show in detail view
        };
      });

    if (ufcMetas.length === 0) {
      ufcMetas.push(
        {
          id: "rd_ufc_sample_001_UFC.300.mkv",
          type: "movie",
          name: "UFC 300",
          poster: ufcLogo,
          posterShape: "regular",
          background: ufcBackground,
          logo: ufcLogo
        }
      );
    }

    res.json({ metas: ufcMetas });
    
  } catch (error) {
    res.json({
      metas: [
        {
          id: "rd_ufc_001_UFC.300.mkv",
          type: "movie",
          name: "UFC 300",
          poster: ufcLogo,
          posterShape: "regular",
          background: ufcBackground,
          logo: ufcLogo
        }
      ]
    });
  }
};
