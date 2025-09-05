export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html');
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Nav's Real-Debrid Configuration</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .config-box { border: 1px solid #ddd; padding: 20px; border-radius: 5px; background: white; }
        input, button { padding: 10px; margin: 10px 0; width: 100%; box-sizing: border-box; }
        button { background: #d20a0a; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="config-box">
        <h2>Nav's Real-Debrid Cloud Configuration</h2>
        <p>Enter your Real-Debrid API key to access your cloud content:</p>
        <input type="password" placeholder="Real-Debrid API Key" id="apiKey">
        <button onclick="saveConfig()">Save Configuration</button>
        <p><small>Your API key is stored locally and only used to access your Real-Debrid account.</small></p>
      </div>
      <script>
        function saveConfig() {
          const apiKey = document.getElementById('apiKey').value;
          if (apiKey) {
            localStorage.setItem('rdApiKey', apiKey);
            alert('API key saved successfully!');
          } else {
            alert('Please enter your API key');
          }
        }
      </script>
    </body>
    </html>
  `);
}
