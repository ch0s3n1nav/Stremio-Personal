const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    console.log('UFC Events endpoint called');
    
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

    console.log('Fetching torrents from Real-Debrid API for UFC content');
    
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
    
    // Improved UFC filtering - check for various UFC patterns
    const ufcTorrents = torrents.filter(torrent => {
      if (torrent.status !== 'downloaded') return false;
      
      const filename = (torrent.filename || '').toLowerCase();
      const originalFilename = (torrent.original_filename || '').toLowerCase();
      const combined = filename + ' ' + originalFilename;
      
      // UFC patterns to match
      const ufcPatterns = [
        'ufc', 
        'ultimate fighting championship',
        'ufc fight night',
        'ufc prelims',
        'ufc main event',
        'ufc ppv',
        'ufc event',
        'ufc [0-9]', // UFC followed by numbers
        'ufc[0-9]',  // UFC followed by numbers (no space)
        ' ufc '      // UFC with spaces around it
      ];
      
      // MMA patterns that might indicate UFC content
      const mmaPatterns = [
        'mma',
        'mixed martial arts',
        'fight night'
      ];
      
      // Check if it contains UFC patterns
      const hasUfcPattern = ufcPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(combined);
      });
      
      // Check if it contains MMA patterns BUT exclude non-UFC organizations
      const hasMmaPattern = mmaPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(combined);
      });
      
      // Exclude other MMA organizations
      const excludePatterns = [
        'bellator',
        'one championship',
        'one fc',
        'pfl',
        'bare knuckle',
        'bkfc',
        'rizin',
        'k-1',
        'glory',
        'wsof',
        'world series of fighting'
      ];
      
      const shouldExclude = excludePatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(combined);
      });
      
      // Return true if it has UFC patterns, or MMA patterns but not excluded organizations
      return hasUfcPattern || (hasMmaPattern && !shouldExclude);
    });
    
    console.log(`Found ${ufcTorrents.length} UFC torrents`);
    
    // Convert to Stremio catalog format
    const metas = ufcTorrents.map(torrent => {
      const originalName = torrent.filename || torrent.original_filename || '';
      let title = originalName
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remove common file extensions
      title = title.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '');
      
      // Remove common quality indicators (keep them in the name for identification)
      title = title
        .replace(/\b(1080p|720p|480p|2160p|4k|hd|sd|bluray|webrip|webdl|hdtv|dvdrip|brrip|bdrip)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remove common release group tags
      title = title
        .replace(/\b(rarbg|yts|amzn|amazon|netflix|hulu|disney|dc|hbo|max)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remove extra parentheses and brackets
      title = title
        .replace(/[\[\](){}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Ensure UFC is in the title for consistency
      if (!title.toLowerCase().includes('ufc')) {
        title = 'UFC: ' + title;
      }
      
      // Shorten very long titles
      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }
      
      // Create ID with torrent ID AND filename for meta handler
      const id = `rd_ufc_${torrent.id}_${encodeURIComponent(torrent.filename)}`;
      
      return {
        id: id,
        type: 'movie',
        name: title,
        poster: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`,
        posterShape: 'regular',
        description: `UFC Content from your Real-Debrid cloud`,
        genres: ['UFC', 'MMA', 'Fighting', 'Sports']
      };
    });

    console.log(`Returning ${metas.length} UFC torrents`);
    res.json({ metas });
  } catch (error) {
    console.error('Error in UFC events catalog:', error);
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
