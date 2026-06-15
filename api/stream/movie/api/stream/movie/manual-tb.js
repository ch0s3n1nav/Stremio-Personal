module.exports = async (req, res) => {
  const { id } = req.query;

  const filename = decodeURIComponent(id.replace('manual_tb_', ''));

  // Load manual file list
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), 'api', 'data', 'torbox-manual.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const manual = JSON.parse(raw);

  const entry = manual.files.find(f => f.url.includes(filename));

  if (!entry) {
    return res.json({ streams: [] });
  }

  return res.json({
    streams: [
      {
        name: "TorBox",
        url: entry.url
      }
    ]
  });
};
