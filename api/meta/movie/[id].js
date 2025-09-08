const { REAL_DEBRID_API_KEY, TMDB_API_KEY } = process.env;

// UFC images
const ufcLogo = 'https://i.imgur.com/Hz4oI65.png';
const ufcBackground = 'https://img.real-debrid.com/?text=UFC&width=800&height=450&bg=000000&color=FF0000';

// Pre-defined TMDB images for common content
const tmdbImages = {
  'the penguin': {
    poster: 'https://image.tmdb.org/t/p/w500/5R4Q6xQS8QaSYDcMh6OIUfdgqXy.jpg',
    background: 'https://image.tmdb.org/t/p/w1280/fuvkygOr5GQFL0FeZLoWXh2hNd2.jpg'
  },
  'justice league': {
    poster: 'https://image.tmdb.org/t/p/w500/9rtrRGeRnL0JKtu9IMBWsmlmmZz.jpg',
    background: 'https://image.tmdb.org/t/p/w1280/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg'
  },
  'batman v superman': {
    poster: 'https://image.tmdb.org/t/p/w500/5UsK3grJvtQrtzEgqNlDljJW96w.jpg',
    background: 'https://image.tmdb.org/t/p/w1280/6iUNJZymJBMXXriQrc7
