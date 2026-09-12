const { TMDB_API_KEY } = process.env;

// Simple UFC event image mapping
const ufcEventImages = {
  'ufc 300': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-04/UF300_Embedded_01_0.jpg',
  'ufc 299': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/299_Embedded_01_0.jpg',
  'ufc 298': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-02/298_Embedded_01.jpg',
  'ufc 297': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-01/297_Embedded_01.jpg',
  'ufc 296': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-12/296_Embedded_01.jpg'
};

const genericUfcLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/UFC_Logo.svg/1200px-UFC_Logo.svg.png';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Simple function to find UFC images without async/await issues
function findUfcEventImage(title) {
  try {
    const lowerTitle = title.toLowerCase();
    
    // Check for specific UFC event numbers
    const ufcMatch = lowerTitle.match(/ufc\s*(\d+)/);
    if (ufcMatch) {
      const eventNumber = `ufc ${ufcMatch[1]}`;
      return ufcEventImages[eventNumber] || genericUfcLogo;
    }
    
    // Check for fight night events
    if (lowerTitle.includes('fight night') || lowerTitle.includes('fn')) {
      return genericUfcLogo;
    }
    
    return null;
  } catch (error) {
    console.error('Error in UFC image finder:', error);
    return null;
  }
}

// Simple function that won't break the meta handler
function findImageForTitle(title, isUfc = false) {
  try {
    // If it's UFC content, try to find event-specific image
    if (isUfc) {
      const ufcImage = findUfcEventImage(title);
      if (ufcImage) return ufcImage;
      return genericUfcLogo;
    }
    
    // For non-UFC content, return text-based image for now
    // We'll add TMDB later once everything is stable
    return `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`;
    
  } catch (error) {
    console.error('Error finding image for title:', title, error);
    return `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`;
  }
}

module.exports = { findImageForTitle };
