export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { type, id } = req.query;
  
  // Sample stream response
  const streams = [{
    title: "UFC 291 Stream",
    url: `https://real-debrid-stream.com/${id}`,
    name: "HD Stream"
  }];
  
  res.json({ streams });
}
