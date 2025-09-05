export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
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
