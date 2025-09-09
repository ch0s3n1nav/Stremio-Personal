module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ufcLogo = 'https://i.imgur.com/Hz4oI65.png';
  const ufcBackground = 'https://i.imgur.com/GkrHvhe.jpeg'; // Updated to your portrait image

  const metas = [
    {
      id: "rd_ufc_001_UFC.300.mkv",
      type: "movie",
      name: "UFC 300: Historic Event",
      poster: ufcLogo,
      posterShape: "regular",
      background: ufcBackground // This will show as the front page image
    },
    {
      id: "rd_ufc_002_UFC.299.mkv",
      type: "movie", 
      name: "UFC 299: O'Malley vs Vera 2",
      poster: ufcLogo,
      posterShape: "regular",
      background: ufcBackground
    },
    {
      id: "rd_ufc_003_UFC.298.mkv",
      type: "movie",
      name: "UFC 298: Volkanovski vs Topuria",
      poster: ufcLogo,
      posterShape: "regular",
      background: ufcBackground
    }
  ];

  res.json({ metas });
};
