// Add this near the top of your file, after the imports
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// TMDB search function
async function searchTMDB(title, year = null, isMovie = true) {
  try {
    if (!TMDB_API_KEY) {
      console.log('TMDB_API_KEY not available');
      return null;
    }

    // Clean the title for better search results
    let cleanTitle = title
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\b(1080p|720p|480p|2160p|4k|hdr|dv|uhd|bluray|remux|bdrip|webrip|webdl|hdtv|dvdrip|brrip)\b/gi, '')
      .replace(/\b(x264|x265|hevc|avc|aac|ac3|dts|ddp5\.1|atmos|ita|eng|fre|ger|spa|sub|multi)\b/gi, '')
      .replace(/\[.*?\]|\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('TMDB searching for cleaned title:', cleanTitle);
    
    let searchUrl = `https://api.themoviedb.org/3/search/${isMovie ? 'movie' : 'tv'}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
    
    if (year) {
      searchUrl += `&year=${year}`;
    }
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.log('TMDB API failed:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      console.log('TMDB found result:', firstResult.title || firstResult.name);
      return firstResult;
    }
    
    console.log('No TMDB results found');
    return null;
    
  } catch (error) {
    console.log('TMDB search error:', error.message);
    return null;
  }
}

// Extract year from filename
function extractYear(title) {
  const yearMatch = title.match(/(19|20)\d{2}/);
  return yearMatch ? yearMatch[0] : null;
}

// Enhanced meta handler
async function handleMeta(req, res, pathname) {
  try {
    // Extract ID from path like /meta/movie/rd_movie_ABC123_TestMovie.mkv.json
    const id = decodeURIComponent(pathname.split('/').pop().replace('.json', ''));
    console.log('Processing meta for ID:', id);
    
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // Extract filename from ID
    const parts = id.split('_');
    let originalFilename = parts.length >= 4 ? 
      parts.slice(3).join('_') : 
      id.replace(/^rd_(movie|ufc)_/, '');

    const isUfc = id.startsWith('rd_ufc_');
    
    // Create display title (clean up the filename)
    let displayTitle = originalFilename
      .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/%20/g, ' ') // Decode URL-encoded spaces
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Display title:', displayTitle);

    // Extract year for better TMDB matching
    const year = extractYear(displayTitle);
    console.log('Extracted year:', year);

    // Get images - try TMDB first, fallback to text images
    let poster, background;
    
    if (isUfc) {
      // UFC content
      poster = 'https://i.imgur.com/Hz4oI65.png';
      background = 'https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000';
    } else {
      // Try to find movie on TMDB
      const searchTitle = displayTitle.replace(/\b(4k|hdr|dv|2160p|remux|ita|eng|x265)\b/gi, '').trim();
      const tmdbResult = await searchTMDB(searchTitle, year, true);
      
      if (tmdbResult) {
        // Use TMDB images if available
        poster = tmdbResult.poster_path ? TMDB_IMAGE_BASE + tmdbResult.poster_path : null;
        background = tmdbResult.backdrop_path ? 
          `https://image.tmdb.org/t/p/w1280${tmdbResult.backdrop_path}` : 
          poster;
        
        // Use TMDB title if we found a good match
        if (tmdbResult.title && tmdbResult.title !== searchTitle) {
          displayTitle = tmdbResult.title;
          if (tmdbResult.release_date) {
            displayTitle += ` (${tmdbResult.release_date.substring(0, 4)})`;
          }
        }
      }
      
      // Fallback to text images if TMDB didn't provide good results
      if (!poster) {
        poster = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=300&height=450`;
      }
      if (!background) {
        background = `https://img.real-debrid.com/?text=${encodeURIComponent(displayTitle)}&width=800&height=450`;
      }
    }

    const meta = {
      id: id,
      type: "movie",
      name: displayTitle,
      poster: poster,
      posterShape: "regular",
      description: `Content from your Real-Debrid cloud: ${displayTitle}`,
      background: background,
      genres: isUfc ? ['UFC', 'MMA', 'Fighting', 'Sports'] : ['Real-Debrid', 'Cloud'],
      runtime: "120 min",
      year: year || "2023"
    };

    console.log('Returning meta data for:', displayTitle);
    res.json({ meta });
    
  } catch (error) {
    console.error('Error in meta handler:', error);
    res.status(500).json({ 
      error: 'Failed to process meta request',
      message: error.message 
    });
  }
}
