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
  console.log('Catalog request:', { type, id });

  // Handle UFC Events catalog
  if (type === 'movie' && id === 'ufc-events') {
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
    return res.json(ufcEvents);
  }

  // Handle Debrid Cloud catalog
  if (type === 'movie' && id === 'debrid-cloud') {
    const debridContent = {
      metas: [
        {
          id: "rd_movie1",
          type: "movie",
          name: "The Matrix (1999)",
          poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
          posterShape: "poster",
          description: "A computer hacker learns from mysterious rebels",
          releaseInfo: "1999",
          runtime: "136 min"
        },
        {
          id: "rd_series1",
          type: "series",
          name: "Game of Thrones S01",
          poster: "https://image.tmdb.org/t/p/w500/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg",
          posterShape: "poster",
          description: "Nine noble families fight for control of Westeros",
          releaseInfo: "2011",
          runtime: "60 min"
        }
      ]
    };
    return res.json(debridContent);
  }

  // Return empty if no matching catalog
  res.json({ metas: [] });
}
