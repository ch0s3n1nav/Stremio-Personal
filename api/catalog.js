export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { type, id, extra } = req.query;
  
  // Sample data - this will be replaced with Real-Debrid API call
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
    },
    {
      id: "rd_file_3",
      type: "movie",
      name: "Movie Example",
      poster: "https://via.placeholder.com/300x450/222/3498db?text=Movie",
      description: "Sample movie from your cloud"
    }
  ];
  
  res.json({ metas: debridContent });
}
