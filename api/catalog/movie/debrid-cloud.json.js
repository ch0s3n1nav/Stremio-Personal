export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Get API key from environment variable or default
    const apiKey = process.env.REAL_DEBRID_API_KEY;
    
    if (!apiKey) {
      // Fallback to sample data if no API key configured
      const sampleData = {
        metas: [
          {
            id: "rd_ufc291",
            type: "movie",
            name: "UFC 291: Poirier vs. Gaethje 2",
            poster: "https://image.tmdb.org/t/p/w500/ujSGUZQpyrv2jqKWaPdMrL2MNmM.jpg",
            description: "July 29, 2023 - BMF Title Fight (Sample Data)",
            releaseInfo: "2023"
          }
        ]
      };
      return res.json(sampleData);
    }

    // REAL API CALL to get torrents
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Real-Debrid API error: ${response.status}`);
    }

    const torrents = await response.json();

    // Convert to Stremio format
    const metas = torrents
      .filter(torrent => torrent.status === 'downloaded')
      .map(torrent => ({
        id: `rd_${torrent.id}`,
        type: "movie",
        name: torrent.filename.replace(/\.[^/.]+$/, ""), // Remove file extension
        poster: getPosterForFilename(torrent.filename),
        description: `Size: ${formatBytes(torrent.bytes)} | Added: ${new Date(torrent.added).toLocaleDateString()}`,
        releaseInfo: new Date(torrent.added).getFullYear().toString()
      }));

    res.json({ metas });

  } catch (error) {
    console.error('Catalog error:', error);
    // Fallback to empty response instead of error
    res.json({ metas: [] });
  }
}

function getPosterForFilename(filename) {
  if (filename.toLowerCase().includes('ufc')) {
    return "https://image.tmdb.org/t/p/w500/ujSGUZQpyrv2jqKWaPdMrL2MNmM.jpg";
  }
  return "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg";
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
