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
        },
        {
            id: "ufc290",
            title: "UFC 290: Volkanovski vs. Rodríguez",
            date: "July 8, 2023",
            size: "10.2 GB",
            image: "https://via.placeholder.com/300x180/222/ff0000?text=UFC+290",
            type: "PPV"
        }
    ];
    
    res.json(ufcEvents);
});

// Stremio addon manifest
app.get('/manifest.json', (req, res) => {
    const manifest = {
        id: "org.lacuna.realdebrid",
        version: "1.0.0",
        name: "Nav's UFC Real-Debrid Cloud",
        description: "Access your UFC events from Real-Debrid cloud in Stremio",
        resources: ["stream"],
        types: ["movie", "series"],
        idPrefixes: ["rd"],
        catalogs: []
    };
    res.json(manifest);
});

// Stremio stream handler
app.get('/stream/:type/:id.json', (req, res) => {
    const { type, id } = req.params;
    
    // In a real implementation, fetch stream from Real-Debrid
    const streams = [{
        title: "UFC Event Stream",
        url: `https://your-real-debrid-stream.com/${id}`,
        name: "UFC"
    }];
    
    res.json({ streams });
});

// Export the app for serverless environments
module.exports = app;