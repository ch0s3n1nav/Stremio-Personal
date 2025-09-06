const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    if (!REAL_DEBRID_API_KEY) {
      throw new Error('Real-Debrid API key is not configured');
    }

    // For now, return sample data until we implement Real-Debrid API integration
    const sampleData = {
      metas: [
        {
          id: "rd_movie_1",
          type: "movie",
          name: "Sample Movie 1",
          poster: "https://img.real-debrid.com/sample1.jpg",
          posterShape: "poster"
        },
        {
          id: "rd_movie_2",
          type: "movie",
          name: "Sample Movie 2",
          poster: "https://img.real-debrid.com/sample2.jpg",
          posterShape: "poster"
        }
      ]
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(sampleData);
  } catch (error) {
    console.error('Error in debrid-cloud catalog:', error);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Failed to fetch cloud content',
      details: error.message 
    });
  }
};
