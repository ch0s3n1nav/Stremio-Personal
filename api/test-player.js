const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Set CORS headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!id) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Real-Debrid File Test</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            .file-list { margin: 20px 0; }
            .file-item { padding: 10px; border: 1px solid #ddd; margin: 5px 0; cursor: pointer; }
            .file-item:hover { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>Real-Debrid File Test</h1>
          <p>No file ID provided. Please provide an ID parameter.</p>
          <p>Example: /test-player?id=rd_movie_12345_filename.mkv</p>
        </body>
        </html>
      `);
    }

    // Extract torrent ID and filename from the ID
    const parts = id.split('_');
    const torrentId = parts[2]; // Third part is the torrent ID
    const filename = parts.slice(3).join('_');
    const decodedFilename = decodeURIComponent(filename);

    console.log('Testing file access for:', { id, torrentId, decodedFilename });

    // Fetch torrent info to get download links
    let streamUrl = '';
    let errorMessage = '';

    try {
      const response = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
        headers: {
          'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
        }
      });

      if (response.ok) {
        const torrentInfo = await response.json();
        if (torrentInfo.links && torrentInfo.links.length > 0) {
          streamUrl = torrentInfo.links[0];
          console.log('Found stream URL:', streamUrl);
        } else {
          errorMessage = 'No download links found for this torrent';
        }
      } else {
        errorMessage = `Real-Debrid API error: ${response.status} ${response.statusText}`;
      }
    } catch (apiError) {
      errorMessage = `API Error: ${apiError.message}`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Player: ${decodedFilename}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 20px; }
          .player-container { margin: 20px 0; }
          video { width: 100%; max-width: 800px; border: 2px solid #333; }
          .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .error { background: #ffe6e6; color: #d00; padding: 15px; border-radius: 5px; }
          .success { background: #e6ffe6; color: #0d0; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Testing File: ${decodedFilename}</h1>
        
        ${errorMessage ? `
          <div class="error">
            <h3>Error:</h3>
            <p>${errorMessage}</p>
            <p>Torrent ID: ${torrentId}</p>
            <p>Filename: ${decodedFilename}</p>
          </div>
        ` : ''}
        
        ${streamUrl ? `
          <div class="success">
            <h3>Success! Found stream URL</h3>
            <p>URL: ${streamUrl}</p>
            <p>Now testing playback...</p>
          </div>
          
          <div class="player-container">
            <h3>Video Player Test</h3>
            <video controls>
              <source src="${streamUrl}" type="video/mp4">
              <source src="${streamUrl}" type="video/x-matroska">
              Your browser does not support the video tag.
            </video>
            <p>If the video doesn't play, it may require authentication.</p>
          </div>
          
          <div class="info">
            <h3>Alternative Test Links:</h3>
            <p><a href="${streamUrl}" target="_blank">Open Direct Link</a> (may download instead of play)</p>
            <p><a href="/stream/movie/${id}.json">View Stream JSON</a> (Stremio format)</p>
          </div>
        ` : ''}
        
        ${!streamUrl && !errorMessage ? `
          <div class="error">
            <p>Could not retrieve stream information. The torrent may not be ready or accessible.</p>
          </div>
        ` : ''}
        
        <div class="info">
          <h3>Debug Information:</h3>
          <p>Full ID: ${id}</p>
          <p>Torrent ID: ${torrentId}</p>
          <p>Filename: ${decodedFilename}</p>
          <p>API Key: ${REAL_DEBRID_API_KEY ? 'Configured' : 'Missing'}</p>
        </div>
      </body>
      </html>
    `;

    res.send(html);

  } catch (error) {
    console.error('Error in test player:', error);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body>
        <h1>Error Testing File</h1>
        <p>${error.message}</p>
      </body>
      </html>
    `);
  }
};
