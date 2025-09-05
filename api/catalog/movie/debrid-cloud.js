export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // All your debrid cloud content - in real implementation, fetch from Real-Debrid API
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
      },
      {
        id: "rd_documentary1",
        type: "movie",
        name: "Planet Earth II",
        poster: "https://image.tmdb.org/t/p/w500/6aXPC7cW1AI1QcC5q7kVjbbp8Aq.jpg",
        posterShape: "poster",
        description: "Wildlife documentary series",
        releaseInfo: "2016",
        runtime: "240 min"
      }
    ]
  };

  res.json(debridContent);
}
