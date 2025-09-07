const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    console.log('UFC Series endpoint called');
    
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (!REAL_DEBRID_API_KEY) {
      console.error('Real-Debrid API key is not configured');
      return res.json({ metas: [] });
    }

    console.log('Fetching torrents from Real-Debrid API for UFC series');
    
    // Fetch torrents from Real-Debrid API
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Real-Debrid API error: ${response.status} ${response.statusText}`, errorText);
      return res.json({ metas: [] });
    }

    const torrents = await response.json();
    
    console.log(`Found ${torrents.length} torrents from Real-Debrid API`);
    
    // Filter for UFC content that might be series (multiple files or contains season/episode info)
    const ufcSeriesTorrents = torrents.filter(torrent => 
      torrent.status === 'downloaded' && (
        (torrent.filename && (
          torrent.filename.toLowerCase().includes('ufc') || 
          torrent.filename.toLowerCase().includes('ultimate fighter') ||
          torrent.filename.toLowerCase().includes('tuf') ||
          torrent.filename.toLowerCase().includes('season') ||
          torrent.filename.toLowerCase().includes('s01') ||
          torrent.filename.toLowerCase().includes('s02') ||
          torrent.filename.toLowerCase().includes('episode') ||
          torrent.filename.toLowerCase().includes('ep') ||
          torrent.filename.toLowerCase().includes('series')
        )) || 
        (torrent.original_filename && (
          torrent.original_filename.toLowerCase().includes('ufc') || 
          torrent.original_filename.toLowerCase().includes('ultimate fighter') ||
          torrent.original_filename.toLowerCase().includes('tuf') ||
          torrent.original_filename.toLowerCase().includes('season') ||
          torrent.original_filename.toLowerCase().includes('s01') ||
          torrent.original_filename.toLowerCase().includes('s02') ||
          torrent.original_filename.toLowerCase().includes('episode') ||
          torrent.original_filename.toLowerCase().includes('ep') ||
          torrent.original_filename.toLowerCase().includes('series')
        ))
      )
    );
    
    // Convert to Stremio catalog format for series
    const metas = ufcSeriesTorrents.map(torrent => {
      const originalName = torrent.filename || torrent.original_filename || '';
      let title = originalName
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remove common file extensions
      title = title.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg)$/i, '');
      
      // Add UFC prefix if not already present
      if (!title.toLowerCase().includes('ufc') && !title.toLowerCase().includes('ultimate fighter')) {
        title = 'UFC: ' + title;
      }
      
      // Shorten very long titles
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      
      // Create a simple hash for the ID to ensure it's unique and consistent
      const idHash = simpleHash(torrent.id + title);
      
      // Try to extract season/episode information
      const seasonMatch = title.match(/s(\d+)/i) || title.match(/season\s*(\d+)/i);
      const episodeMatch = title.match(/e(\d+)/i) || title.match(/episode\s*(\d+)/i);
      
      const season = seasonMatch ? parseInt(seasonMatch[1]) : 1;
      const episode = episodeMatch ? parseInt(episodeMatch[1]) : 1;
      
      return {
        id: `rd_series_ufc_${idHash}`,
        type: 'series',
        name: title,
        poster: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`,
        background: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=800&height=450`,
        posterShape: 'regular',
        description: `UFC Series from your Real-Debrid cloud: ${title}`,
        genres: ['UFC', 'MMA', 'Fighting', 'Sports', 'Real-Debrid'],
        // Add series-specific metadata
        releaseInfo: `S${season}E${episode}`,
        // Add dummy video count for series
        videos: [
          {
            id: `rd_series_ufc_${idHash}_ep1`,
            title: `Episode ${episode}`,
            season: season,
            episode: episode,
            released: new Date().toISOString()
          }
        ]
      };
    });

    console.log(`Returning ${metas.length} UFC series torrents`);
    res.json({ metas });
  } catch (error) {
    console.error('Error in UFC series catalog:', error);
    res.json({ metas: [] });
  }
};

// Simple hash function for generating consistent IDs
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
