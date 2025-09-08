const { REAL_DEBRID_API_KEY } = process.env;
const ufcPortraitPoster = 'https://i.imgur.com/GkrHvhe.jpeg';

// Use a try-catch for TMDB require
let tmdbImageFinder;
try {
  tmdbImageFinder = require('../utils/tmdbImageFinder');
} catch (error) {
  console.warn('TMDB image finder not available for catalog');
  tmdbImageFinder = {
    findTmdbPoster: () => null,
    cleanTitle: (title) => title
  };
}

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
      return res.json({ metas: [] });
    }

    // Fetch torrents from Real-Debrid API
    const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    if (!response.ok) return res.json({ metas: [] });

    const torrents = await response.json();
    
    // Process all torrents
    const metas = await Promise.all(
      torrents
        .filter(torrent => torrent.status === 'downloaded')
        .map(async (torrent) => {
          const originalFilename = torrent.filename || torrent.original_filename || 'Unknown File';
          const isUfc = originalFilename.toLowerCase().includes('ufc');
          
          let displayTitle = originalFilename
            .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
            .replace(/\./g, ' ')
            .replace(/_/g, ' ')
            .trim();
          
          const idPrefix = isUfc ? 'rd_ufc' : 'rd_movie';
          const id = `${idPrefix}_${torrent.id}_${encodeURIComponent(originalFilename)}`;
          
          let poster;
          if (isUfc) {
            poster = ufcPortraitPoster;
          } else {
            // Try to get TMDB poster for non-UFC content
            const cleanTitle = tmdbImageFinder.cleanTitle(displayTitle);
            const tmdbPoster = await tmdbImageFinder.findTmdbPoster(cleanTitle, true);
            poster = tmdbPoster || `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=600&height=900`;
          }
          
          return {
            id: id,
            type: 'movie',
            name: displayTitle,
            poster: poster,
            posterShape: 'regular',
            description: `From your Real-Debrid cloud: ${displayTitle}`,
            genres: isUfc ? ['UFC', 'MMA', 'Fighting', 'Sports'] : ['Real-Debrid', 'Cloud']
          };
        })
    );

    res.json({ metas });
  } catch (error) {
    console.error('Error in debrid-cloud catalog:', error);
    res.json({ metas: [] });
  }
};
