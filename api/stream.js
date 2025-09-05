export default async function handler(req, res) {
  // Add these CORS headers at the top
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { type, id } = req.query;
  
  const streams = [{
    title: "Real-Debrid Stream",
    name: "Direct Stream", 
    url: `https://real-debrid.com/stream/${id}`,
    behaviorHints: {
      notWebReady: true
    }
  }];
  
  res.json({ streams });
}
