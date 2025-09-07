// UFC logo hosted on Imgur - direct image URL
const ufcLogo = 'https://i.imgur.com/Hz4oI65.png';

// UFC background - using text-based for reliability
const ufcBackground = 'https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000';

function findUfcEventImage(title) {
  try {
    const lowerTitle = title.toLowerCase();
    console.log('Using UFC logo for title:', lowerTitle);
    
    // Always return your Imgur UFC logo
    return ufcLogo;
    
  } catch (error) {
    console.error('Error in UFC image finder:', error);
    // Fallback to text-based logo if Imgur fails
    return 'https://img.real-debrid.com/?text=UFC&width=300&height=450&bg=000000&color=FF0000';
  }
}

function getUfcBackgroundImage() {
  return ufcBackground;
}

module.exports = { findUfcEventImage, getUfcBackgroundImage };
