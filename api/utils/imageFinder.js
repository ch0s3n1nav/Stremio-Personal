const { TMDB_API_KEY } = process.env;

// UFC event image database (we can expand this)
const ufcEventImages = {
  'ufc 300': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-04/UF300_Embedded_01_0.jpg',
  'ufc 299': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/299_Embedded_01_0.jpg',
  'ufc 298': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-02/298_Embedded_01.jpg',
  'ufc 297': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-01/297_Embedded_01.jpg',
  'ufc 296': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-12/296_Embedded_01.jpg',
  'ufc 295': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-11/295_Embedded_01.jpg',
  'ufc 294': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-10/294_Embedded_01.jpg',
  'ufc 293': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-09/293_Embedded_01.jpg',
  'ufc 292': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-08/292_Embedded_01.jpg',
  'ufc 291': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-07/291_Embedded_01.jpg',
  'ufc 290': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-07/290_Embedded_01.jpg',
  'ufc 289': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-06/289_Embedded_01.jpg'
};

// Generic UFC logo as fallback
const genericUfcLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/UFC_Logo.svg/1200px-UFC_Logo.svg.png';

// TMDB base URL for images
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function findImageForTitle(title, isUfc = false) {
  try {
    // If it's UFC content, try to find event-specific image
    if (isUfc) {
      const ufcImage = findUfcEventImage(title);
      if (ufcImage) return ufcImage;
      
      // Fallback to generic UFC logo for UFC content
      return genericUfcLogo;
    }
    
    // For non-UFC content, try to find TMDB poster
    if (TMDB_API_KEY) {
      const tmdbImage = await findTmdbPoster(title);
      if (tmdbImage) return tmdbImage;
    }
    
    // Fallback: text-based image
    return `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`;
    
  } catch (error) {
    console.error('Error finding image for title:', title, error);
    return `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`;
  }
}

function findUfcEventImage(title) {
  const lowerTitle = title.toLowerCase();
  
  // Check for specific UFC event numbers
  const ufcMatch = lowerTitle.match(/ufc\s*(\d+)/);
  if (ufcMatch) {
    const eventNumber = `ufc ${ufcMatch[1]}`;
    return ufcEventImages[eventNumber] || null;
  }
  
  // Check for fight night events
  if (lowerTitle.includes('fight night') || lowerTitle.includes('fn')) {
    // Try to extract event number from fight night
    const fnMatch = lowerTitle.match(/fight\s*night\s*(\d+)/) || lowerTitle.match(/fn\s*(\d+)/);
    if (fnMatch) {
      return `https://img.real-debrid.com/?text=UFC%20Fight%20Night%20${fnMatch[1]}&width=300&height=450`;
    }
    return genericUfcLogo;
  }
  
  return null;
}

async function findTmdbPoster(title) {
  try {
    // Clean up title for better search
    let searchTitle = title
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove year if present (e.g., "Movie Name (2023)" -> "Movie Name")
    searchTitle = searchTitle.replace(/\s*\(\d{4}\)\s*$/, '');
    
    // Remove quality info (1080p, 4K, etc.)
    searchTitle = searchTitle.replace(/\b(1080p|720p|480p|2160p|4k|hd|sd|bluray|webrip|webdl|hdtv|dvdrip|brrip|bdrip)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Search TMDB
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}`;
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
        return TMDB_IMAGE_BASE + firstResult.poster_path;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error searching TMDB:', error);
    return null;
  }
}

module.exports = { findImageForTitle };
