export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, id } = req.query;
  
  try {
    let streams = [];
    
    // For content from your debrid cloud (starts with rd_)
    if (id && id.startsWith('rd_')) {
      streams = [{
        title: "Real-Debrid Cloud Stream",
        name: "Debrid Cloud",
        url: `https://real-debrid.com/stream/${id}`,
        behaviorHints: {
          notWebReady: true,
          bingeGroup: `deb-${id}`
        }
      }];
    }
    
    res.json({ streams });
    
  } catch (error) {
    console.error('Stream error:', error);
    res.json({ streams: [] });
  }
}
