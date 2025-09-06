const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    if (!REAL_DEBRID_API_KEY) {
      throw new Error('Real-Debrid API key is not configured');
    }

    // For now, return sample UFC data
    const sampleData = {
      metas: [
        {
          id: "rd_ufc_1",
          type: "movie",
          name: "UFC Event 1",
          poster: "https://img.real-debrid.com/ufc1.jpg",
          posterShape: "poster"
        },
        {
          id: "rd_ufc_2",
          type: "movie",
          name: "UFC Event 2",
          poster: "https://img.real-debrid.com/ufc2.jpg",
          posterShape: "poster"
        }
      ]
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(sampleData);
  } catch (error) {
    console.error('Error in UFC events catalog:', error);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Failed to fetch UFC content',
      details: error.message 
    });
  }
};
