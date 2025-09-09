const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!REAL_DEBRID_API_KEY) {
      return res.json({ metas: [] });
    }

    // Fetch torrents from Real-Debrid
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
    
    const metas = torrents
      .filter(torrent => torrent.status === 'downloaded')
      .slice(0, 50) // Limit to 50 items
      .map(torrent => {
        const filename = torrent.filename || 'Unknown';
        const displayName = filename
          .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
          .replace(/\./g, ' ')
          .replace(/_/g, ' ')
          .trim();

        return {
          id: `rd_movie_${torrent.id}_${filename}`,
          type: "movie",
          name: displayName,
          poster: `https://img.real-debrid.com/?text=${encodeURIComponent(displayName)}&width=300&height=450`,
          posterShape: "regular",
          background: `https://img.real-debrid.com/?text=${encodeURIComponent(displayName)}&width=800&height=450`
        };
      });

    res.json({ metas });
    
  } catch (error) {
    console.error('Error in debrid-cloud catalog:', error);
    res.json({ metas: [] });
  }
};
