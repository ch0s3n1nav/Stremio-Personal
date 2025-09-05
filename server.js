const express = require('express');
const cors = require('cors');
const { addonBuilder } = require('stremio-addon-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage for user tokens
const userTokens = {};

// Save Real-Debrid token
app.post('/api/save-token', (req, res) => {
    const { userId, rdToken } = req.body;
    if (!userId || !rdToken) {
        return res.status(400).json({ error: 'User ID and token required' });
    }
    userTokens[userId] = rdToken;
    res.json({ success: true, message: 'Token saved successfully' });
});

// Get user's UFC events
app.get('/api/ufc-events/:userId', (req, res) => {
    const rdToken = userTokens[req.params.userId];
    if (!rdToken) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Sample UFC data - in real implementation, fetch from Real-Debrid
    const ufcEvents = [
        {
            id: "ufc291",
            title: "UFC 291: Poirier vs. Gaethje 2",
            date: "July 29, 2023",
            size: "12.5 GB",
            image: "https://via.placeholder.com/300x180/222/ff0000?text=UFC+291",
            type: "PPV"
        }
    ];
    
    res.json(ufcEvents);
});

// Get all user's debrid content
app.get('/api/debrid-content/:userId', (req, res) => {
    const rdToken = userTokens[req.params.userId];
    if (!rdToken) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Sample data - in real implementation, fetch from Real-Debrid
    const debridContent = [
        {
            id: "content1",
            title: "Sample Movie",
            date: "2023-01-01",
            size: "5.2 GB",
            image: "https://via.placeholder.com/300x180/222/3498db?text=Movie",
            type: "movie"
        }
    ];
    
    res.json(debridContent);
});

// Stremio addon manifest
app.get('/manifest.json', (req, res) => {
    const manifest = {
        id: "org.lacuna.realdebrid",
        version: "1.0.0",
        name: "Nav's Real-Debrid Cloud",
        description: "Access your Real-Debrid cloud content in Stremio",
        resources: ["stream", "catalog"],
        types: ["movie", "series"],
        idPrefixes: ["rd"],
        catalogs: [
            {
                type: "movie",
                id: "ufc-events",
                name: "UFC Events",
                extra: [{ name: "search", isRequired: false }]
            },
            {
                type: "movie", 
                id: "debrid-content",
                name: "All Debrid Content",
                extra: [{ name: "search", isRequired: false }]
            }
        ]
    };
    res.json(manifest);
});

// Stremio catalog handler (for UFC events)
app.get('/catalog/movie/ufc-events.json', (req, res) => {
    const metas = [
        {
            id: "ufc291",
            type: "movie",
            name: "UFC 291: Poirier vs. Gaethje 2",
            poster: "https://via.placeholder.com/300x180/222/ff0000?text=UFC+291",
            posterShape: "poster"
        }
    ];
    res.json({ metas });
});

// Stremio catalog handler (for all debrid content)
app.get('/catalog/movie/debrid-content.json', (req, res) => {
    const metas = [
        {
            id: "content1",
            type: "movie",
            name: "Sample Movie",
            poster: "https://via.placeholder.com/300x180/222/3498db?text=Movie",
            posterShape: "poster"
        }
    ];
    res.json({ metas });
});

// Stremio stream handler
app.get('/stream/:type/:id.json', (req, res) => {
    const { type, id } = req.params;
    
    // In a real implementation, fetch stream from Real-Debrid
    const streams = [{
        title: "Stream",
        url: `https://your-real-debrid-stream.com/${id}`,
        name: "Stream"
    }];
    
    res.json({ streams });
});

// Export the app for serverless environments
module.exports = app;

// Start server if not in Netlify environment
if (process.env.NETLIFY_DEV !== 'true') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}