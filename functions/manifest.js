// functions/manifest.js
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify({
      id: "org.lacuna.realdebrid",
      version: "1.0.0",
      name: "Nav's Real-Debrid Cloud",
      description: "Access your Real-Debrid cloud content in Stremio",
      resources: ["stream", "catalog"],
      types: ["movie", "series"],
      idPrefixes: ["rd"],
      catalogs: [
        {
          type: "movie",
          id: "ufc-events",
          name: "UFC Events",
          extra: [{ name: "search", isRequired: false }]
        },
        {
          type: "movie", 
          id: "debrid-content",
          name: "All Debrid Content",
          extra: [{ name: "search", isRequired: false }]
        }
      ],
      background: "https://i.imgur.com/6ofFUPt.png",
      logo: "https://i.imgur.com/6ofFUPt.png"
    })
  };
};
