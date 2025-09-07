// In your catalog mapping function, change the ID generation:
return {
  id: `rd_movie_${torrent.id}_${encodeURIComponent(torrent.filename)}`,
  type: 'movie',
  name: title,
  // ... rest of properties
};
