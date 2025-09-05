const express = require('express');
const cors = require('cors');
const { addonBuilder } = require('stremio-addon-sdk');

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Add proper headers to all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

// Your existing routes here...

// Stremio addon manifest - with proper content type
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
    
    // Set proper content type
    res.setHeader('Content-Type', 'application/json');
    res.json(manifest);
});

// Export the app for serverless environments
module.exports = app;