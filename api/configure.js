const { REAL_DEBRID_API_KEY } = process.env;

module.exports = (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Real-Debrid Plugin Configuration</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <h1>Real-Debrid Plugin Configuration</h1>
      ${REAL_DEBRID_API_KEY ? 
        `<div class="status success">API Key is configured successfully!</div>` : 
        `<div class="status error">API Key is missing. Please set REAL_DEBRID_API_KEY environment variable in Vercel.</div>`
      }
      <p>This plugin provides access to your Real-Debrid cloud files in Stremio.</p>
      <p>You don't need to configure anything here. The plugin will automatically show your UFC content and all cloud files.</p>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
