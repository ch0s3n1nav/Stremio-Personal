const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Extract ID from the request - Vercel passes it differently
    const id = req.query.id || (req.url ? req.url.split('/').pop().replace('.json', '') : '');
    console.log('Meta request for ID:', id);
    
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // For now, return basic metadata without API call
    const title = decodeURIComponent(id.replace(/rd_(movie|ufc)_/, '').replace(/_/g, ' '));
    
    const meta = {
      id: id,
      type: 'movie',
      name: title || 'Real-Debrid Content',
      poster: `https://img.real-debrid.com/?text=${encodeURIComponent(title || 'Real-Debrid')}&width=300&height=450`,
      posterShape: 'regular',
      description: `From your Real-Debrid cloud: ${title || 'Your content'}`,
      genres: ['Real-Debrid', 'Cloud'],
      runtime: '120 min',
      released: new Date().toISOString().split('T')[0]
    };

    console.log('Returning meta for:', title);
    res.json({ meta });
  } catch (error) {
    console.error('Error in meta handler:', error);
    // Fallback response
    res.json({
      meta: {
        id: req.query.id || 'unknown',
        type: 'movie',
        name: 'Real-Debrid Content',
        poster: 'https://img.real-debrid.com/?text=Real-Debrid&width=300&height=450',
        posterShape: 'regular',
        description: 'Content from your Real-Debrid cloud storage'
      }
    });
  }
};
