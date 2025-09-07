const { findUfcEventImage, getUfcBackgroundImage } = require('./utils/ufcImageFinder');

module.exports = async (req, res) => {
  try {
    const testTitle = "UFC Fight Night 258 Imavov vs Borralho";
    
    const poster = findUfcEventImage(testTitle);
    const background = getUfcBackgroundImage(testTitle);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({
      testTitle: testTitle,
      poster: poster,
      background: background,
      message: "UFC Image Finder Test"
    });
  } catch (error) {
    res.json({ error: error.message });
  }
};
