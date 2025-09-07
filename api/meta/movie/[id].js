const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Extract ID from the request
    const id = req.query.id;
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

    // Extract the original title from the ID
    // Our IDs are formatted like: rd_movie_abc123 or rd_ufc_abc123
    const titleFromId = id.replace(/^rd_(movie|ufc)_/, '').replace(/_/g, ' ');
    
    let title = decodeURIComponent(titleFromId);
    
    // If title is still a hash, create a friendly name
    if (title.length === 32 || title.length === 40 || /^[0-9a-f]+$/i.test(title)) {
      title = 'Real-Debrid Content';
    }

    // Create proper meta response - NOTE: The response should be { meta: {...} } not { metas: [...] }
    const meta = {
      id: id,
      type: 'movie',
      name: title,
      poster: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`,
      posterShape: 'regular',
      description: `Content from your Real-Debrid cloud storage`,
      background: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=800&height=450`,
      logo: `https://img.real-debrid.com/?text=RealDebrid&width=300&height=100`,
      genres: ['Real-Debrid', 'Cloud'],
      runtime: '120 min',
      releaseInfo: new Date().toISOString().split('T')[0],
      imdbRating: '8.0',
      director: ['Real-Debrid'],
      cast: ['Your Content'],
      // Add more required fields
      year: new Date().getFullYear().toString(),
      // Important: Add video information for the stream handler to work
      videos: [
        {
          id: id + '_video',
          title: title,
          released: new Date().toISOString(),
          thumbnail: `https://img.real-debrid.com/?text=${encodeURIComponent(title)}&width=300&height=450`
        }
      ]
    };

    console.log('Returning meta for ID:', id);
    res.json({ meta: meta }); // Note: { meta: {...} } not { metas: [...] }
  } catch (error) {
    console.error('Error in meta handler:', error);
    // Fallback response with proper format
    res.json({
      meta: {
        id: req.query.id || 'unknown',
        type: 'movie',
        name: 'Real-Debrid Content',
        poster: 'https://img.real-debrid.com/?text=Real-Debrid&width=300&height=450',
        posterShape: 'regular',
        description: 'Content from your Real-Debrid cloud storage',
        year: new Date().getFullYear().toString()
      }
    });
  }
};
