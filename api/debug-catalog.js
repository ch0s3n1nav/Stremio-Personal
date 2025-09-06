export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  console.log('Debug catalog request:', req.query);
  
  // Simulate successful response with debug info
  const debugResponse = {
    debug: {
      timestamp: new Date().toISOString(),
      query: req.query,
      status: "catalog_working"
    },
    metas: [
      {
        id: "debug_test_1",
        type: "movie",
        name: "DEBUG: Test Movie 1",
        poster: "https://via.placeholder.com/300x450/333/fff?text=DEBUG+1",
        description: "This is a debug test movie"
      },
      {
        id: "debug_test_2",
        type: "movie",
        name: "DEBUG: Test Movie 2", 
        poster: "https://via.placeholder.com/300x450/666/fff?text=DEBUG+2",
        description: "Another debug test movie"
      }
    ]
  };
  
  res.json(debugResponse);
}
