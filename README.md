Nav's UFC AllDebrid - clean rebuild

This project intentionally contains only the AllDebrid implementation.
Real-Debrid and TorBox code/data have been removed.

Vercel environment variables required:
- ALLDEBRID_API_KEY
- TMDB_API_KEY (optional; retained for future metadata use)

Important test endpoints after deployment:
- /debug-env
- /test-alldebrid
- /debug-alldebrid-files
- /test-alldebrid-files
- /catalog/movie/ufc-events.json

The diagnostic endpoint does not return the AllDebrid API key or direct download URLs.
