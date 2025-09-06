export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { action } = req.query;
  
  try {
    if (action === 'test') {
      return res.json({
        status: "ready",
        message: "Real-Debrid API endpoint is operational",
        timestamp: new Date().toISOString()
      });
    }

    // Get API key from request header or query parameter
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || req.query.apiKey;
    
    if (!apiKey) {
      return res.json({
        status: "error",
        message: "API key required. Add ?apiKey=YOUR_KEY to the URL",
        timestamp: new Date().toISOString()
      });
    }

    // REAL API CALL to get torrents from Real-Debrid
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Real-Debrid API error: ${response.status} ${response.statusText}`);
    }

    const torrents = await response.json();

    // Filter and format for Stremio
    const stremioFiles = torrents
      .filter(torrent => torrent.status === 'downloaded')
      .map(torrent => ({
        id: `rd_${torrent.id}`,
        type: "movie",
        name: torrent.filename,
        poster: "https://image.tmdb.org/t/p/w500/ujSGUZQpyrv2jqKWaPdMrL2MNmM.jpg", // Default UFC poster
        description: `Size: ${formatBytes(torrent.bytes)} | Added: ${new Date(torrent.added).toLocaleDateString()}`,
        releaseInfo: new Date(torrent.added).getFullYear().toString(),
        runtime: "120 min"
      }));

    res.json({
      status: "success",
      data: {
        files: stremioFiles,
        total_count: stremioFiles.length,
        source: "real-debrid-api"
      }
    });

  } catch (error) {
    console.error('Real-Debrid API error:', error);
    res.json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to format file size
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
