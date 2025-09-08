const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Get ID from query parameter
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    console.log('Stream request for ID:', id);
    
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Check if we have the API key
    if (!REAL_DEBRID_API_KEY || REAL_DEBRID_API_KEY === 'SET') {
      return res.status(500).json({ 
        error: 'Real-Debrid API key not configured' 
      });
    }

    // Extract the Real-Debrid ID from our custom ID format
    // Format: rd_type_realDebridId_filename.ext
    const parts = id.split('_');
    if (parts.length < 3) {
      return res.status(400).json({ 
        error: 'Invalid ID format. Expected: rd_type_id_filename' 
      });
    }

    const rdId = parts[2]; // The Real-Debrid ID is the third part
    console.log('Real-Debrid ID extracted:', rdId);

    // Get the streaming link from Real-Debrid
    const unrestrictUrl = 'https://api.real-debrid.com/rest/1.0/unrestrict/link';
    
    const response = await fetch(unrestrictUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `link=${encodeURIComponent(`https://real-debrid.com/d/${rdId}`)}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Real-Debrid API error:', response.status, errorText);
      
      return res.status(502).json({ 
        error: `Real-Debrid API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (!data.download) {
      return res.status(502).json({ 
        error: 'No download link received from Real-Debrid' 
      });
    }

    console.log('Real-Debrid unrestrict successful:', data.download);
    
    // Return the stream information in Stremio format
    res.json({
      streams: [
        {
          id: `rd_stream_${rdId}`,
          title: `Real-Debrid Stream`,
          name: "Real-Debrid",
          description: "High-quality stream from your Real-Debrid cloud",
          thumbnail: "https://i.imgur.com/Hz4oI65.png", // UFC logo as placeholder
          url: data.download,
          behaviorHints: {
            // These hints help Stremio handle the stream properly
            notWebReady: false,
            bingeGroup: `rd_${rdId}`
          }
        }
      ]
    });

  } catch (error) {
    console.error('Error in stream handler:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
