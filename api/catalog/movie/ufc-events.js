export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Your UFC events - in real implementation, fetch from Real-Debrid API
  const ufcEvents = {
    metas: [
      {
        id: "rd_ufc291",
        type: "movie",
        name: "UFC 291: Poirier vs. Gaethje 2",
        poster: "https://image.tmdb.org/t/p/w500/ujSGUZQpyrv2jqKWaPdMrL2MNmM.jpg",
        posterShape: "poster",
        description: "July 29, 2023 - BMF Title Fight",
        releaseInfo: "2023-07-29",
        runtime: "120 min"
      },
      {
        id: "rd_ufc290",
        type: "movie",
        name: "UFC 290: Volkanovski vs. Rodriguez",
        poster: "https://image.tmdb.org/t/p/w500/5YXpZUlWGj53V8TLpy9gqAeudkH.jpg",
        posterShape: "poster",
        description: "July 8, 2023 - Title Fight",
        releaseInfo: "2023-07-08", 
        runtime: "115 min"
      },
      {
        id: "rd_ufc289",
        type: "movie",
        name: "UFC 289: Nunes vs. Aldana",
        poster: "https://image.tmdb.org/t/p/w500/r7XhWgWwLcTMQauAvs7fFfYS25p.jpg",
        posterShape: "poster",
        description: "June 10, 2023 - Title Fight",
        releaseInfo: "2023-06-10",
        runtime: "125 min"
      }
    ]
  };

  res.json(ufcEvents);
}
