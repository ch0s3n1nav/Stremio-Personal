const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!REAL_DEBRID_API_KEY) {
      return res.json({ error: 'API key not configured' });
    }

    // Fetch torrents from Real-Debrid API
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      return res.json({ error: `API error: ${response.status} ${response.statusText}` });
    }

    const torrents = await response.json();
    
    // Analyze UFC detection for each file
    const analysis = torrents.filter(torrent => torrent.status === 'downloaded').map(torrent => {
      const filename = torrent.filename || '';
      const lowerFilename = filename.toLowerCase();
      
      const isUfc = lowerFilename.includes('ufc') || 
                    lowerFilename.includes('ultimate fighting championship');
      
      return {
        filename: filename,
        isUfc: isUfc,
        detected: lowerFilename.includes('ufc') ? 'ufc keyword' : 
                 lowerFilename.includes('ultimate fighting championship') ? 'full name' : 'not ufc'
      };
    });

    res.json({ analysis, totalFiles: analysis.length, ufcFiles: analysis.filter(f => f.isUfc).length });

  } catch (error) {
    res.json({ error: error.message });
  }
};
