const { REAL_DEBRID_API_KEY, TMDB_API_KEY } = process.env;

// UFC images
const ufcLogo = 'https://i.imgur.com/Hz4oI65.png';
const ufcBackground = 'https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Simple TMDB search function
async function simpleTmdbSearch(title, isMovie = true) {
  try {
    if (!TMDB_API_KEY) {
      console.log('TMDB_API_KEY not available in simpleTmdbSearch');
      return null;
    }

    // Clean the title
    const cleanTitle = title
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\b(1080p|720p|480p|2160p|4k|hd|sd|bluray|webrip|webdl|hdtv|dvdrip|brrip|bdrip|remux)\b/gi, '')
      .replace(/\b(x264|x265|hevc|avc|aac|ac3|dts|ddp5\.1|atmos)\b/gi, '')
      .replace(/\[.*?\]|\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('TMDB searching for:', cleanTitle, 'isMovie:', isMovie);
    
    const searchUrl = `https://api.themoviedb.org/3/search/${isMovie ? 'movie' : 'tv'}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
    console.log('TMDB search URL:', searchUrl);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.log('TMDB API failed:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('TMDB found results:', data.results ? data.results.length : 0);
    
    if (data.results && data.results.length > 0) {
      console.log('First result:', data.results[0].title || data.results[0].name);
      return data.results[0];
    }
    
    return null;
    
  } catch (error) {
    console.log('TMDB search error:', error.message);
    return null;
  }
}

function isTvShow(title) {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('season') || 
         lowerTitle.includes('s01') || 
         lowerTitle.includes('s02') ||
         lowerTitle.match(/s\d+e\d+/i) ||
         lowerTitle.includes('episode') ||
         lowerTitle.includes('series');
}

module.exports = async (req, res) => {
  try {
    const id = req.query.id;
    console.log('Meta request for ID:', id, 'TMDB Key available:', !!TMDB_API_KEY);
    
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // Extract filename from ID
    const parts = id.split('_');
    let originalFilename = parts.length >= 4 ? 
      decodeURIComponent(parts.slice(3).join('_')) : 
      decodeURIComponent(id.replace(/^rd_(movie|ufc)_/, ''));

    const isUfc = id.startsWith('rd_ufc_');
    
    // Create display title
    let displayTitle = originalFilename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .trim();

    // Get images
    let poster, background;
    
    if (isUfc) {
      poster = ufcLogo;
      background = ufcBackground;
      console.log('Using UFC images');
    } else {
      console.log('Processing non-UFC content:', displayTitle);
      
      // Try TMDB lookup
      const isTv = isTvShow(displayTitle);
      console.log('Is TV show:', isTv);
      
      const tmdbResult = await simpleTmdbSearch(displayTitle, !isTv);
      
      if (tmdbResult && tmdbResult.poster_path) {
        poster = TMDB_IMAGE_BASE + tmdbResult.poster_path;
        background = tmdbResult.backdrop_path ? 
          `https://image.tmdb.org/t/p/w1280${tmdbResult.backdrop_path}` : 
          poster;
        console.log('Using TMDB image:', poster);
      } else {
        // Fallback to text images
        poster = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`;
        background = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`;
        console.log('Using fallback text image');
      }
    }

    const type = isTvShow(displayTitle) ? 'series' : 'movie';
    const genres = isUfc ? ['UFC', 'MMA', 'Fighting', 'Sports'] : ['Real-Debrid', 'Cloud'];

    const meta = {
      id: id,
      type: type,
      name: displayTitle,
      poster: poster,
      posterShape: 'regular',
      description: `Content from your Real-Debrid cloud: ${displayTitle}`,
      background: background,
      genres: genres,
      runtime: '120 min',
      year: new Date().getFullYear().toString(),
      videos: [
        {
          id: id + '_video',
          title: displayTitle,
          released: new Date().toISOString(),
          thumbnail: poster
        }
      ]
    };

    console.log('Final poster URL:', poster);
    res.json({ meta: meta });
  } catch (error) {
    console.error('Error in meta handler:', error);
    res.json({
      meta: {
        id: req.query.id || 'unknown',
        type: 'movie',
        name: 'Real-Debrid Content',
        poster: 'https://img.real-debrid.com/?text=Real-Debrid&width=300&height=450',
        posterShape: 'regular',
        description: 'Content from your Real-Debrid cloud storage'
      }
    });
  }
};
