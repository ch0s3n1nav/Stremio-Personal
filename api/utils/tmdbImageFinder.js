const { TMDB_API_KEY } = process.env;

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

async function findTmdbPoster(title, isMovie = true) {
  try {
    if (!TMDB_API_KEY) {
      console.log('TMDB API key not configured');
      return null;
    }

    // Clean up title for better search
    let searchTitle = cleanTitle(title);
    
    console.log('Searching TMDB for:', searchTitle);
    
    // Search TMDB
    const searchUrl = `https://api.themoviedb.org/3/search/${isMovie ? 'movie' : 'tv'}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error('TMDB API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Get the first result (most relevant)
      const firstResult = data.results[0];
      
      if (firstResult.poster_path) {
        const posterUrl = TMDB_IMAGE_BASE + firstResult.poster_path;
        console.log('Found TMDB poster:', posterUrl);
        return posterUrl;
      }
    }
    
    console.log('No TMDB poster found for:', searchTitle);
    return null;
    
  } catch (error) {
    console.error('Error searching TMDB:', error);
    return null;
  }
}

async function findTmdbBackground(title, isMovie = true) {
  try {
    if (!TMDB_API_KEY) return null;

    // Clean up title for better search
    let searchTitle = cleanTitle(title);
    
    // Search TMDB
    const searchUrl = `https://api.themoviedb.org/3/search/${isMovie ? 'movie' : 'tv'}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      
      if (firstResult.backdrop_path) {
        return TMDB_BACKDROP_BASE + firstResult.backdrop_path;
      }
      
      // Fallback to poster if no backdrop
      if (firstResult.poster_path) {
        return TMDB_IMAGE_BASE + firstResult.poster_path;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error searching TMDB for background:', error);
    return null;
  }
}

function cleanTitle(title) {
  // Remove file extensions, quality info, release groups, etc.
  return title
    .replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i, '')
    .replace(/\b(1080p|720p|480p|2160p|4k|hd|sd|bluray|webrip|webdl|hdtv|dvdrip|brrip|bdrip|remux)\b/gi, '')
    .replace(/\b(x264|x265|hevc|avc|aac|ac3|dts|ddp5\.1|atmos)\b/gi, '')
    .replace(/\[.*?\]|\(.*?\)/g, '') // Remove brackets and parentheses
    .replace(/\s+/g, ' ')
    .trim();
}

function isTvShow(title) {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('season') || 
         lowerTitle.includes('s01') || 
         lowerTitle.includes('s02') ||
         lowerTitle.includes('episode') ||
         lowerTitle.includes('series');
}

module.exports = { findTmdbPoster, findTmdbBackground, isTvShow, cleanTitle };
