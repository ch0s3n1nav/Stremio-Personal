export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { type, id } = req.query;
  
  if (type === 'movie' && id === 'ufc-events') {
    const ufcEvents = [
      {
        id: "ufc291",
        type: "movie",
        name: "UFC 291: Poirier vs. Gaethje 2",
        poster: "https://via.placeholder.com/300x450/222/ff0000?text=UFC+291",
        description: "UFC 291: Poirier vs. Gaethje 2 - BMF Title Fight"
      }
    ];
    return res.json({ metas: ufcEvents });
  }
  
  res.json({ metas: [] });
}
