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
    
    // Improved UFC filtering - be more specific to catch only UFC content
    const ufcTorrents = torrents.filter(torrent => {
      if (torrent.status !== 'downloaded') return false;
      
      const filename = (torrent.filename || '').toLowerCase();
      const originalFilename = (torrent.original_filename || '').toLowerCase();
      const combined = filename + ' ' + originalFilename;
      
      // Specific UFC patterns (must include UFC or Ultimate Fighting Championship)
      const ufcPatterns = [
        'ufc',
        'ultimate fighting championship',
        'ufc fight night',
        'ufc prelims',
        'ufc main event',
        'ufc ppv',
        'ufc event'
      ];
      
      // Check if it contains specific UFC patterns
      const hasUfcPattern = ufcPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(combined);
      });
      
      // Additional UFC number patterns (UFC 300, UFC301, etc.)
      const hasUfcNumber = /\bufc\s*[0-9]{1,4}\b/i.test(combined);
      
      // UFC series patterns
      const hasUfcSeries = /\bufc\s*(fight night|fn|ppv|event|main event|prelims)\b/i.test(combined);
      
      // Exclude patterns that might give false positives
      const excludePatterns = [
        'ufc gym',
        'ufc training',
        'ufc workout',
        'ufc game',
        'ufc undefeated',
        'ufc ultimate',
        'ufc champion',
        'ufc history',
        'ufc documentary',
        'ufc embedded',
        'ufc countdown',
        'ufc weigh',
        'ufc prelude',
        'ufc post fight',
        'ufc press conference',
        'ufc interview',
        'ufc highlights',
        'ufc best of',
        'ufc classic',
        'ufc greatest',
        'ufc legacy',
        'ufc hall of fame',
        'ufc unleashed',
        'ufc connected',
        'ufc tonight',
        'ufc now',
        'ufc all access',
        'ufc ultimate insider',
        'ufc ultimate fighter', // This is a specific series we might want to include actually
        'tuf', // The Ultimate Fighter
        'ultimate fighter' // The Ultimate Fighter
      ];
      
      const shouldExclude = excludePatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(combined);
      });
      
      // Also exclude other MMA organizations
      const otherOrgs = [
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
        'world series of fighting',
        'invicta',
        'aca',
        'efn',
        'eagle fc',
        'brave cf',
        'ksw',
        'cage warriors',
        'legacy fc',
        'lfa'
      ];
      
      const hasOtherOrg = otherOrgs.some(org => {
        const regex = new RegExp(org, 'i');
        return regex.test(combined);
      });
      
      // Return true if it has specific UFC patterns AND doesn't contain exclude patterns or other organizations
      return (hasUfcPattern || hasUfcNumber || hasUfcSeries) && !shouldExclude && !hasOtherOrg;
    });
    
    console.log(`Found ${ufcTorrents.length} UFC torrents after filtering`);
    
    // Convert to Stremio catalog format
    const metas = ufcTorrents.map(torrent => {
      // Use the EXACT filename from Real-Debrid
      const originalFilename = torrent.filename || torrent.original_filename || 'Unknown UFC File';
      
      // Create a clean display title (remove file extension)
      let displayTitle = originalFilename
        .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .trim();
      
      // Ensure UFC is in the title for consistency
      if (!displayTitle.toLowerCase().includes('ufc')) {
        displayTitle = 'UFC: ' + displayTitle;
      }
      
      // Create ID with torrent ID AND original filename for meta handler
      const id = `rd_ufc_${torrent.id}_${encodeURIComponent(originalFilename)}`;
      
      return {
        id: id,
        type: 'movie',
        name: displayTitle,
        poster: `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`,
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
