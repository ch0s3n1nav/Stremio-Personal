const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const configure = {
    type: "configure",
    name: "Nav's Cloud Configuration",
    description: "Configure your Real-Debrid addon by Nav",
    logo: "https://i.imgur.com/Hz4oI65.png",
    background: "https://img.real-debrid.com/?text=Nav%27s+Cloud&width=800&height=450",
    types: ["movie"],
    settings: [
      {
        type: "text",
        key: "realDebridApiKey",
        title: "Real-Debrid API Key",
        required: true
      }
    ]
  };
  
  res.json(configure);
};
