export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, id } = req.query;

  try {
    if (type === 'movie' && id === 'ufc-events') {
      // Import and return UFC events
      const ufcHandler = await import('./movie/ufc-events.js');
      return ufcHandler.default(req, res);
    }
    else if (type === 'movie' && id === 'debrid-cloud') {
      // Import and return all debrid content
      const cloudHandler = await import('./movie/debrid-cloud.js');
      return cloudHandler.default(req, res);
    }
    
    // Return empty if no matching catalog
    res.json({ metas: [] });
    
  } catch (error) {
    console.error('Catalog error:', error);
    res.json({ metas: [] });
  }
}
