export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { type, id } = req.query;
  
  console.log('Stream request:', { type, id });
  
  // Sample stream response - this should eventually come from Real-Debrid
  const streams = [{
    title: "HD Stream",
    name: "Direct Stream",
    url: `https://real-debrid.com/d/${id}`, // This would be the actual Real-Debrid link
    behaviorHints: {
      notWebReady: true, // Important for debrid services
      bingeGroup: `ufc-${id}`
    }
  }];
  
  res.json({ streams });
}
