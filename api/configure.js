import { setConfig, getConfig } from './config.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    // Handle configuration save
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.json({
        status: "error",
        message: "API key is required"
      });
    }

    // Test the API key first
    try {
      const testResponse = await fetch('https://api.real-debrid.com/rest/1.0/user', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (testResponse.status === 401) {
        return res.json({
          status: "error",
          message: "Invalid API key. Please check your Real-Debrid API key."
        });
      }

      if (!testResponse.ok) {
        throw new Error(`API test failed: ${testResponse.status}`);
      }

      // Save the valid API key
      setConfig({ apiKey });
      
      res.json({
        status: "success",
        message: "API key configured successfully!",
        configured: true
      });

    } catch (error) {
      res.json({
        status: "error",
        message: error.message
      });
    }

  } else if (req.method === 'GET') {
    // Return current configuration
    const config = getConfig();
    res.json(config);
    
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
