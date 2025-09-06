export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { action } = req.query;
  
  try {
    if (action === 'test') {
      // Test without API key first
      const testResponse = {
        status: "ready_for_api_key",
        message: "API endpoint is ready. Add your Real-Debrid API key to test actual connectivity.",
        timestamp: new Date().toISOString()
      };
      return res.json(testResponse);
    }

    // For now, simulate Real-Debrid response
    // Replace this with actual API call once we confirm the endpoint works
    
    const simulatedResponse = {
      status: "success",
      message: "Simulated Real-Debrid response",
      data: {
        files: [
          {
            id: "rd_ufc291",
            filename: "UFC.291.Poirier.vs.Gaethje.2.2023.1080p.WEB.H264.mp4",
            filesize: 4523561234,
            created: "2023-07-30T14:32:10Z"
          },
          {
            id: "rd_ufc290", 
            filename: "UFC.290.Volkanovski.vs.Rodriguez.2023.1080p.WEB.H264.mp4",
            filesize: 4123456789,
            created: "2023-07-09T10:15:30Z"
          }
        ],
        total_count: 2,
        simulated: true
      }
    };

    res.json(simulatedResponse);

  } catch (error) {
    res.json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
