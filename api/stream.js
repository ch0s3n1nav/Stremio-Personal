export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;
  console.log('Stream request:', { type, id });

  // For content from your debrid cloud (starts with rd_)
  if (id && id.startsWith('rd_')) {
    const streams = [{
      title: "Real-Debrid Cloud Stream",
      name: "Debrid Cloud",
      url: `https://real-debrid.com/stream/${id}`,
      behaviorHints: {
        notWebReady: true,
        bingeGroup: `deb-${id}`
      }
    }];
    return res.json({ streams });
  }

  // Return empty streams if no match
  res.json({ streams: [] });
}
