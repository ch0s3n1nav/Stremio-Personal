const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    console.log('All Cloud Movies endpoint called');
    
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

    console.log('Fetching torrents from Real-Debrid API');
    
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
    
    // Filter for only ready torrents and convert to Stremio format
    const metas = torrents
      .filter(torrent => torrent.status === 'downloaded')
      .map(torrent => {
        // Extract a cleaner title from the filename
        const originalName = torrent.filename || torrent.original_filename || '';
        let title = originalName
          .replace(/\./g, ' ')
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Remove common file extensions
        title = title.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '');
        
        // Shorten very long titles
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
        }
        
        // Create ID with torrent ID AND filename for meta handler
        const id = `rd_movie_${torrent.id}_${encodeURIComponent(torrent.filename)}`;
        
        return {
          id: id,
          type: 'movie',
          name: title,
          poster: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`,
          posterShape: 'poster',
          genres: ['Real-Debrid', 'Cloud']
        };
      });

    console.log(`Returning ${metas.length} ready torrents`);
    res.json({ metas });
  } catch (error) {
    console.error('Error in debrid-cloud catalog:', error);
    // Return sample data as fallback
    res.json({ 
      metas: [
        {
          id: "rd_movie_1_sample",
          type: "movie",
          name: "Sample Movie 1 (Fallback)",
          poster: "https://img.real-debrid.com/?text=Sample+1",
          posterShape: "poster"
        },
        {
          id: "rd_movie_2_sample",
          type: "movie",
          name: "Sample Movie 2 (Fallback)",
          poster: "https://img.real-debrid.com/?text=Sample+2",
          posterShape: "poster"
        }
      ]
    });
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
