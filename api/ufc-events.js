export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json');
  
  // This will eventually connect to Real-Debrid
  const ufcEvents = [
    {
      id: "ufc291",
      name: "UFC 291: Poirier vs. Gaethje 2",
      poster: "https://via.placeholder.com/300x450/222/ff0000?text=UFC+291"
    }
  ];
  
  response.status(200).json({ metas: ufcEvents });
}
