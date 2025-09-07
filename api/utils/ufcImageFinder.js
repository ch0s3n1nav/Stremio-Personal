// UFC event image database with actual image URLs
const ufcEventImages = {
  // UFC Numbered Events
  'ufc 300': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-04/UF300_Embedded_01_0.jpg',
  'ufc 299': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/299_Embedded_01_0.jpg',
  'ufc 298': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-02/298_Embedded_01.jpg',
  'ufc 297': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-01/297_Embedded_01.jpg',
  'ufc 296': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-12/296_Embedded_01.jpg',
  'ufc 295': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-11/295_Embedded_01.jpg',
  'ufc 294': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-10/294_Embedded_01.jpg',
  
  // Fight Night Events
  'fight night 258': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-04/FN258_Embedded_01.jpg',
  'fight night 257': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/FN257_Embedded_01.jpg',
  'fight night 256': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/FN256_Embedded_01.jpg',
  
  // Popular Fighters (fallback images)
  'mcgregor': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2021-07/264_Embedded_01.jpg',
  'khabib': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2020-10/254_Embedded_01.jpg',
  'adesanya': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-04/287_Embedded_01.jpg',
  'jones': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-03/285_Embedded_01.jpg',
  'usman': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2022-08/278_Embedded_01.jpg',
};

// Generic UFC images for events without specific images
const genericUfcImages = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/UFC_Logo.svg/1200px-UFC_Logo.svg.png',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-04/UF300_Embedded_01_0.jpg',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/299_Embedded_01_0.jpg',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-02/298_Embedded_01.jpg',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-11/295_Embedded_01.jpg'
];

// UFC background images
const ufcBackgroundImages = [
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/background_image/s3/2024-04/UF300_Background_0.jpg',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/background_image/s3/2024-03/299_Background_0.jpg',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/background_image/s3/2024-02/298_Background_0.jpg',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/background_image/s3/2023-12/296_Background_0.jpg'
];

function findUfcEventImage(title) {
  try {
    const lowerTitle = title.toLowerCase();
    
    console.log('Finding image for UFC title:', lowerTitle);
    
    // First, try to find exact event matches
    for (const [eventPattern, imageUrl] of Object.entries(ufcEventImages)) {
      if (lowerTitle.includes(eventPattern)) {
        console.log('Found exact match:', eventPattern);
        return imageUrl;
      }
    }
    
    // Try to extract UFC event number (e.g., UFC 258, UFC298)
    const ufcMatch = lowerTitle.match(/ufc\s*(\d+)/);
    if (ufcMatch) {
      const eventNumber = ufcMatch[1];
      console.log('Found UFC event number:', eventNumber);
      
      // Try to find a similar event image
      for (const [eventPattern, imageUrl] of Object.entries(ufcEventImages)) {
        if (eventPattern.includes(eventNumber)) {
          console.log('Found event number match:', eventPattern);
          return imageUrl;
        }
      }
    }
    
    // Try to extract Fight Night number
    const fnMatch = lowerTitle.match(/(fight night|fn)\s*(\d+)/);
    if (fnMatch) {
      const fnNumber = fnMatch[2];
      console.log('Found Fight Night number:', fnNumber);
      
      // Try to find a similar Fight Night image
      for (const [eventPattern, imageUrl] of Object.entries(ufcEventImages)) {
        if (eventPattern.includes(fnNumber)) {
          console.log('Found Fight Night match:', eventPattern);
          return imageUrl;
        }
      }
    }
    
    // Check for main event fighters
    const mainEventFighters = [
      'mcgregor', 'khabib', 'adesanya', 'jones', 'usman', 
      'edwards', 'volkanovski', 'makhachev', 'pereira', 'prochazka'
    ];
    
    for (const fighter of mainEventFighters) {
      if (lowerTitle.includes(fighter)) {
        console.log('Found fighter match:', fighter);
        return ufcEventImages[fighter] || genericUfcImages[0];
      }
    }
    
    // Return a random generic UFC image
    const randomImage = genericUfcImages[Math.floor(Math.random() * genericUfcImages.length)];
    console.log('Using random UFC image');
    return randomImage;
    
  } catch (error) {
    console.error('Error in UFC image finder:', error);
    return genericUfcImages[0];
  }
}

function getUfcBackgroundImage() {
  // Return a random UFC background image
  return ufcBackgroundImages[Math.floor(Math.random() * ufcBackgroundImages.length)] ||
         'https://dmxg5wxfqgb4u.cloudfront.net/styles/background_image/s3/2024-04/UF300_Background_0.jpg';
}

module.exports = { findUfcEventImage, getUfcBackgroundImage };
