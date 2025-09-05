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
  
  // Handle different catalog requests
  if (type === 'movie' && id === 'debrid-cloud') {
    const debridContent = [
      {
        id: "rd_file_1",
        type: "movie",
        name: "UFC 291: Poirier vs. Gaethje 2",
        poster: "https://via.placeholder.com/300x450/222/ff0000?text=UFC+291",
        description: "July 29, 2023 - BMF Title Fight"
      },
      {
        id: "rd_file_2", 
        type: "movie",
        name: "UFC 290: Volkanovski vs. Rodriguez",
        poster: "https://via.placeholder.com/300x450/222/ff0000?text=UFC+290",
        description: "July 8, 2023 - Title Fight"
      }
    ];
    return res.json({ metas: debridContent });
  }
  
  // Return empty if no matching catalog
  res.json({ metas: [] });
}
