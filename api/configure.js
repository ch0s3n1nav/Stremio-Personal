const { REAL_DEBRID_API_KEY } = process.env;

module.exports = async (req, res) => {
  try {
    // Test the API connection
    const testResponse = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
      headers: {
        'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`
      }
    });

    const apiStatus = testResponse.ok ? 'connected' : 'error';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Real-Debrid Plugin Configuration</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          .status { padding: 15px; margin: 15px 0; border-radius: 5px; }
          .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
          .test-links { margin-top: 30px; }
          .test-links a { display: block; margin: 10px 0; color: #007bff; text-decoration: none; }
          .test-links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Real-Debrid Plugin Configuration</h1>
        
        ${REAL_DEBRID_API_KEY ? 
          `<div class="status success">API Key is configured successfully!</div>` : 
          `<div class="status error">API Key is missing. Please set REAL_DEBRID_API_KEY environment variable in Vercel.</div>`
        }
        
        <div class="status ${apiStatus === 'connected' ? 'success' : 'error'}">
          API Connection: ${apiStatus === 'connected' ? 'Successful' : 'Failed - Check your API key'}
        </div>
        
        <div class="status info">
          <p>This plugin provides access to your Real-Debrid cloud files in Stremio.</p>
          <p>Username: ch0s3n1</p>
          <p>WebDAV URL: https://dav.real-debrid.com/</p>
        </div>

        <div class="test-links">
          <h2>Test Links:</h2>
          <a href="/catalog/movie/debrid-cloud.json">All Cloud Movies</a>
          <a href="/catalog/movie/ufc-events.json">UFC Movies</a>
          <a href="/catalog/series/debrid-cloud.json">All Cloud Series</a>
          <a href="/catalog/series/ufc-events.json">UFC Series</a>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Real-Debrid Plugin Configuration</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          .error { background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; border: 1px solid #f5c6cb; }
        </style>
      </head>
      <body>
        <h1>Real-Debrid Plugin Configuration</h1>
        <div class="error">
          <p>Error testing API connection: ${error.message}</p>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
};
