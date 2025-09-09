const { TMDB_API_KEY } = process.env;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// TMDB search function
async function searchTMDB(title, year = null) {
  try {
    if (!TMDB_API_KEY) return null;

    let searchQuery = title;
    let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`;
    
    if (year) searchUrl += `&year=${year}`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    return null;
  }
}

// Extract year from filename
function extractYear(title) {
  const yearMatch = title.match(/(19|20)\d{2}/);
  return yearMatch ? yearMatch[0] : null;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'ID parameter is required' });

    const parts = id.split('_');
    let originalFilename = parts.length >= 4 ? 
      parts.slice(3).join('_') : 
      id.replace(/^rd_(movie|ufc)_/, '');

    const isUfc = id.startsWith('rd_ufc_');
    
    let displayTitle = originalFilename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/%20/g, ' ')
      .trim();

    const year = extractYear(displayTitle);
    let poster, background;

    if (isUfc) {
      // UFC content - use your custom images
      poster = 'https://i.imgur.com/Hz4oI65.png'; // UFC logo
      background = 'https://i.imgur.com/GkrHvhe.jpeg'; // Your portrait image
    } else {
      // Movie content - try TMDB
      const movieName = displayTitle.replace(/(19|20)\d{2}.*$/, '').trim();
      const tmdbResult = await searchTMDB(movieName, year);
      
      if (tmdbResult) {
        poster = tmdbResult.poster_path ? TMDB_IMAGE_BASE + tmdbResult.poster_path : null;
        background = tmdbResult.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbResult.backdrop_path}` : poster;
        if (tmdbResult.title) {
          displayTitle = tmdbResult.title + (year ? ` (${year})` : '');
        }
      }
      
      // Fallback to text images
      if (!poster) poster = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`;
      if (!background) background = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`;
    }

    const meta = {
      id: id,
      type: "movie",
      name: displayTitle,
      poster: poster,
      posterShape: "regular",
      description: `Content from Nav's Cloud: ${displayTitle}`,
      background: background,
      genres: isUfc ? ['UFC', 'MMA', 'Fighting', 'Sports'] : ['Real-Debrid', 'Cloud'],
      runtime: isUfc ? "180 min" : "120 min", // Longer runtime for UFC events
      year: year || "2023"
    };

    res.json({ meta });
    
  } catch (error) {
    res.json({
      meta: {
        id: req.query.id || 'unknown',
        type: 'movie',
        name: 'Nav\'s Cloud Content',
        poster: 'https://img.real-debrid.com/?text=Nav%27s+Cloud&width=300&height=450',
        posterShape: 'regular',
        description: 'Content from Nav\'s Real-Debrid cloud storage'
      }
    });
  }
};
