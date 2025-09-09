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
      console.error('Real-Debrid API key not configured');
      return res.json({ metas: [] });
    }

    // Fetch all torrents from Real-Debrid
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch torrents from Real-Debrid');
      return res.json({ metas: [] });
    }

    const torrents = await response.json();
    
    // Filter for UFC events (filenames containing UFC, MMA, fight, etc.)
    const ufcMetas = torrents
      .filter(torrent => {
        const filename = (torrent.filename || '').toLowerCase();
        return (
          torrent.status === 'downloaded' && 
          (filename.includes('ufc') || 
           filename.includes('mma') || 
           filename.includes('fight') ||
           filename.includes('ppv') ||
           filename.match(/ufc[\._\s]*\d+/i)) // Match UFC 300, UFC.300, UFC_300
        );
      })
      .slice(0, 50) // Limit to 50 UFC events
      .map(torrent => {
        const filename = torrent.filename || 'UFC Event';
        const displayName = filename
          .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
          .replace(/\./g, ' ')
          .replace(/_/g, ' ')
          .trim();

        // Extract event number for better naming
        let eventName = displayName;
        const ufcMatch = displayName.match(/(ufc[\._\s]*\d+)/i);
        if (ufcMatch) {
          eventName = ufcMatch[0].toUpperCase().replace(/[\._]/g, ' ');
        }

        return {
          id: `rd_ufc_${torrent.id}_${filename}`,
          type: "movie",
          name: eventName,
          poster: ufcLogo,
          posterShape: "regular",
          background: ufcBackground
        };
      });

    // If no UFC events found, provide some default ones
    if (ufcMetas.length === 0) {
      console.log('No UFC events found in Real-Debrid, showing sample events');
      ufcMetas.push(
        {
          id: "rd_ufc_sample_001_UFC.300.mkv",
          type: "movie",
          name: "UFC 300",
          poster: ufcLogo,
          posterShape: "regular",
          background: ufcBackground
        },
        {
          id: "rd_ufc_sample_002_UFC.299.mkv",
          type: "movie",
          name: "UFC 299",
          poster: ufcLogo,
          posterShape: "regular",
          background: ufcBackground
        }
      );
    }

    res.json({ metas: ufcMetas });
    
  } catch (error) {
    console.error('Error in UFC catalog:', error);
    // Fallback to sample UFC events on error
    res.json({
      metas: [
        {
          id: "rd_ufc_error_001_UFC.300.mkv",
          type: "movie",
          name: "UFC 300",
          poster: ufcLogo,
          posterShape: "regular",
          background: ufcBackground
        },
        {
          id: "rd_ufc_error_002_UFC.299.mkv", 
          type: "movie",
          name: "UFC 299",
          poster: ufcLogo,
          posterShape: "regular",
          background: ufcBackground
        }
      ]
    });
  }
};
