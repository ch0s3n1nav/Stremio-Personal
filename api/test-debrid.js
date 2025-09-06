export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // This is a test endpoint to check Real-Debrid connectivity
  try {
    // For now, we'll simulate API response
    // Replace this with actual Real-Debrid API call later
    
    const testData = {
      status: "success",
      message: "API test endpoint is working",
      timestamp: new Date().toISOString(),
      nextStep: "Add Real-Debrid API key to test actual connectivity"
    };
    
    res.json(testData);
    
  } catch (error) {
    res.json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
