// UFC event image database - we'll match based on event numbers and names
const ufcEventImages = {
  // UFC numbered events
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
  
  // Fight Night events
  'fight night 240': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-04/FN240_Embedded_01.jpg',
  'fight night 239': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/FN239_Embedded_01.jpg',
  'fight night 238': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/FN238_Embedded_01.jpg',
  
  // Popular named events
  'mcgregor': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2021-07/264_Embedded_01.jpg',
  'khabib': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2020-10/254_Embedded_01.jpg',
  'adesanya': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-04/287_Embedded_01.jpg',
  'jones': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2023-03/285_Embedded_01.jpg',
};

// Generic UFC images for fallback
const genericUfcImages = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/UFC_Logo.svg/1200px-UFC_Logo.svg.png',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-04/UF300_Embedded_01_0.jpg',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-03/299_Embedded_01_0.jpg',
  'https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/2024-02/298_Embedded_01.jpg'
];

function findUfcEventImage(title) {
  try {
    const lowerTitle = title.toLowerCase();
    
    // First, try to find exact event matches
    for (const [eventPattern, imageUrl] of Object.entries(ufcEventImages)) {
      if (lowerTitle.includes(eventPattern)) {
        return imageUrl;
      }
    }
    
    // Try to extract UFC event number
    const ufcMatch = lowerTitle.match(/ufc\s*(\d+)/);
    if (ufcMatch) {
      const eventNumber = `ufc ${ufcMatch[1]}`;
      // Return a generic UFC image with event number
      return `https://img.real-debrid.com/?text=UFC%20${ufcMatch[1]}&width=300&height=450&bg=000000&color=FF0000`;
    }
    
    // Try to extract Fight Night number
    const fnMatch = lowerTitle.match(/(fight night|fn)\s*(\d+)/);
    if (fnMatch) {
      return `https://img.real-debrid.com/?text=Fight%20Night%20${fnMatch[2]}&width=300&height=450&bg=000000&color=FF0000`;
    }
    
    // Check for main event fighters
    const mainEventFighters = [
      'mcgregor', 'khabib', 'adesanya', 'jones', 'usman', 'edwards', 
      'volkanovski', 'makhachev', 'pereira', 'prochazka'
    ];
    
    for (const fighter of mainEventFighters) {
      if (lowerTitle.includes(fighter)) {
        // Return generic UFC image with fighter name
        return `https://img.real-debrid.com/?text=UFC%20${fighter.toUpperCase()}&width=300&height=450&bg=000000&color=FF0000`;
      }
    }
    
    // Return a random generic UFC image
    return genericUfcImages[Math.floor(Math.random() * genericUfcImages.length)];
    
  } catch (error) {
    console.error('Error in UFC image finder:', error);
    return genericUfcImages[0];
  }
}

function getUfcBackgroundImage(title) {
  // Create a themed background for UFC content
  return `https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000`;
}

module.exports = { findUfcEventImage, getUfcBackgroundImage };
