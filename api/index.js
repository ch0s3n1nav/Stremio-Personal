const ALLDEBRID_API_KEY = process.env.ALLDEBRID_API_KEY || '';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

const STATUS_URL = 'https://api.alldebrid.com/v4.1/magnet/status';
const FILES_URL = 'https://api.alldebrid.com/v4/magnet/files';

const UFC_LOGO = 'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png';
const UFC_BACKGROUND = 'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg';

const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i;
const UFC_TERMS = /(\bUFC\b|\bMMA\b|Ultimate[ ._-]?Fighting[ ._-]?Championship|Fight[ ._-]?Night)/i;

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const host = req.headers.host || 'localhost';
  const url = new URL('http://' + host + (req.url || '/'));
  const path = url.pathname;

  try {
    if (path === '/' || path === '') return root(res);
    if (path === '/manifest.json') return manifest(res);
    if (path === '/configure') return configure(res);
    if (path === '/debug-env') return debugEnv(res);
    if (path === '/test-alldebrid') return testAllDebrid(res);
    if (path === '/debug-alldebrid-files') return debugAllDebridFiles(res);
    if (path === '/test-alldebrid-files') return testAllDebridFiles(res);

    const catalog = path.match(/^\/catalog\/movie\/([^/]+)\.json$/);
    if (catalog) return catalogHandler(res, catalog[1], url.searchParams);

    const meta = path.match(/^\/meta\/movie\/(.+)\.json$/);
    if (meta) return metaHandler(res, decodeURIComponent(meta[1]));

    const stream = path.match(/^\/stream\/movie\/(.+)\.json$/);
    if (stream) return streamHandler(res, decodeURIComponent(stream[1]));

    return res.status(404).json({ error: 'Endpoint not found', path: path });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

function setCors(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function root(res) {
  return res.json({
    message: "Nav's UFC AllDebrid Stremio Addon",
    endpoints: {
      manifest: '/manifest.json',
      configure: '/configure',
      catalog: '/catalog/movie/ufc-events.json',
      meta: '/meta/movie/{id}.json',
      stream: '/stream/movie/{id}.json',
      debug: '/debug-env',
      testAllDebrid: '/test-alldebrid',
      debugAllDebridFiles: '/debug-alldebrid-files',
      testAllDebridFiles: '/test-alldebrid-files'
    }
  });
}

function manifest(res) {
  return res.json({
    id: 'com.stremio.navsufcalldebrid',
    version: '3.0.0',
    name: "Nav's UFC AllDebrid",
    description: 'Shows UFC fights stored in your AllDebrid cloud and streams them directly in Stremio.',
    logo: UFC_LOGO,
    background: UFC_BACKGROUND,
    types: ['movie'],
    catalogs: [{
      type: 'movie',
      id: 'ufc-events',
      name: 'UFC',
      extra: [{ name: 'search', isRequired: false }]
    }],
    resources: ['catalog', 'meta', 'stream'],
    idPrefixes: ['ad_'],
    behaviorHints: { configurable: false, configurationRequired: false }
  });
}

function configure(res) {
  return res.json({
    type: 'configure',
    name: "Nav's UFC AllDebrid",
    description: 'No configuration is required. The addon uses the AllDebrid API key stored securely in Vercel.',
    logo: UFC_LOGO,
    background: UFC_BACKGROUND,
    types: ['movie'],
    settings: []
  });
}

function debugEnv(res) {
  return res.json({
    ALLDEBRID_API_KEY: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
    TMDB_API_KEY: TMDB_API_KEY ? 'SET' : 'NOT SET',
    node: process.version,
    timestamp: new Date().toISOString()
  });
}

async function testAllDebrid(res) {
  try {
    requireKey();
    const data = await apiRequest(STATUS_URL, { status: 'ready' });
    const magnets = getMagnetsFromResponse(data);
    return res.status(200).json({
      success: true,
      apiKey: 'SET',
      readyMagnets: magnets.length,
      sampleMagnets: magnets.slice(0, 10).map(summarizeMagnet)
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      apiKey: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
      error: error.message
    });
  }
}

async function debugAllDebridFiles(res) {
  try {
    requireKey();
    const statusData = await apiRequest(STATUS_URL, { status: 'ready' });
    const magnets = getMagnetsFromResponse(statusData);
    const selected = magnets.slice(0, 3);
    const samples = [];

    for (const magnet of selected) {
      let response;
      try {
        response = await apiRequest(FILES_URL, { id: [magnet.id] });
      } catch (error) {
        samples.push({ magnet: summarizeMagnet(magnet), filesRequestError: error.message });
        continue;
      }

      samples.push({
        magnet: summarizeMagnet(magnet),
        responseSummary: summarizeObject(response),
        dataSummary: summarizeObject(response && response.data),
        magnetContainerSummary: summarizeMagnetContainer(response && response.data),
        discoveredEntries: discoverFileEntries(response)
      });
    }

    return res.status(200).json({
      success: true,
      readyMagnetCount: magnets.length,
      readyMagnetIds: magnets.slice(0, 20).map(function (m) { return m.id; }),
      samples: samples
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      apiKey: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
      error: error.message
    });
  }
}

async function testAllDebridFiles(res) {
  try {
    requireKey();
    const result = await getUfcFiles();
    return res.status(200).json({
      success: true,
      ufcFilesFound: result.length,
      files: result.slice(0, 20).map(function (file) {
        return {
          name: file.name,
          magnetId: file.magnetId,
          path: file.path,
          size: file.size,
          hasLink: !!file.link
        };
      })
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      apiKey: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
      error: error.message
    });
  }
}

async function catalogHandler(res, catalogType, searchParams) {
  if (catalogType !== 'ufc-events') return res.status(404).json({ metas: [] });

  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const files = await getUfcFiles();
  const filtered = (search ? files.filter(function (f) { return f.name.toLowerCase().includes(search); }) : files).slice(0, 100);

  return res.json({
    metas: filtered.map(function (item) {
      return {
        id: item.id,
        type: 'movie',
        name: cleanTitle(item.name),
        poster: UFC_LOGO,
        posterShape: 'regular',
        background: UFC_BACKGROUND,
        description: 'UFC fight stored in AllDebrid: ' + cleanTitle(item.name),
        releaseInfo: extractYear(item.name) || undefined,
        genres: ['UFC', 'MMA', 'Fighting', 'Sports']
      };
    })
  });
}

async function metaHandler(res, id) {
  const parsed = parseFileId(id);
  if (!parsed) return res.status(400).json({ error: 'Invalid AllDebrid file ID' });

  const file = await findFile(parsed.magnetId, parsed.filePath);
  if (!file) return res.status(404).json({ error: 'File not found in AllDebrid' });

  return res.json({
    meta: {
      id: id,
      type: 'movie',
      name: cleanTitle(file.name),
      poster: UFC_LOGO,
      posterShape: 'regular',
      description: 'UFC fight stored in your AllDebrid cloud: ' + cleanTitle(file.name),
      background: UFC_BACKGROUND,
      genres: ['UFC', 'MMA', 'Fighting', 'Sports'],
      runtime: '180 min',
      year: extractYear(file.name) || undefined
    }
  });
}

async function streamHandler(res, id) {
  const parsed = parseFileId(id);
  if (!parsed) return res.status(400).json({ streams: [], error: 'Invalid AllDebrid file ID' });

  const file = await findFile(parsed.magnetId, parsed.filePath);
  if (!file || !file.link) {
    return res.status(404).json({ streams: [], error: 'AllDebrid download link not found' });
  }

  return res.json({
    streams: [{
      id: id,
      title: cleanTitle(file.name),
      name: 'AllDebrid',
      description: 'Streamed from your AllDebrid cloud',
      thumbnail: UFC_LOGO,
      url: file.link,
      behaviorHints: {
        notWebReady: false,
        bingeGroup: 'alldebrid-ufc-' + parsed.magnetId
      }
    }]
  });
}

async function getUfcFiles() {
  requireKey();
  const magnets = getReadyMagnets(await apiRequest(STATUS_URL, { status: 'ready' }));
  if (!magnets.length) return [];

  const results = [];
  for (let i = 0; i < magnets.length; i += 20) {
    const batch = magnets.slice(i, i + 20);
    const data = await apiRequest(FILES_URL, { id: batch.map(function (m) { return m.id; }) });
    const returned = getMagnetsFromFilesResponse(data);

    for (const magnet of returned) {
      const source = magnets.find(function (m) { return String(m.id) === String(magnet.id); });
      const entries = extractAllFiles(magnet);

      for (const file of entries) {
        if (!file.name) continue;
        if (!VIDEO_EXTENSIONS.test(file.name)) continue;
        if (!UFC_TERMS.test(file.name)) continue;
        if (!file.link) continue;

        results.push({
          id: makeFileId(magnet.id, file.path),
          name: file.name,
          path: file.path,
          link: file.link,
          size: file.size || 0,
          magnetId: magnet.id,
          completionDate: source && source.completionDate ? source.completionDate : 0
        });
      }
    }
  }

  results.sort(function (a, b) { return Number(b.completionDate) - Number(a.completionDate); });
  return results;
}

async function getReadyMagnets(statusData) {
  const magnets = getMagnetsFromResponse(statusData);
  return magnets.filter(function (m) {
    if (!m || !m.id) return false;
    if (m.statusCode === undefined || m.statusCode === null) return true;
    return Number(m.statusCode) === 4;
  });
}

async function findFile(magnetId, wantedPath) {
  requireKey();
  const data = await apiRequest(FILES_URL, { id: [Number(magnetId)] });
  const magnets = getMagnetsFromFilesResponse(data);
  const magnet = magnets.find(function (m) { return String(m.id) === String(magnetId); });
  if (!magnet) return null;

  const files = extractAllFiles(magnet);
  return files.find(function (f) { return f.path === wantedPath; }) || null;
}

function getMagnetsFromResponse(data) {
  if (!data || !data.data) return [];
  if (Array.isArray(data.data.magnets)) return data.data.magnets;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.data.items)) return data.data.items;
  if (Array.isArray(data.data.results)) return data.data.results;
  return [];
}

function getMagnetsFromFilesResponse(data) {
  if (!data || !data.data) return [];
  if (Array.isArray(data.data.magnets)) return data.data.magnets;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.data.items)) return data.data.items;
  if (Array.isArray(data.data.results)) return data.data.results;
  return [];
}

function extractAllFiles(magnet) {
  const roots = [];
  if (!magnet || typeof magnet !== 'object') return [];

  if (Array.isArray(magnet.files)) roots.push({ entries: magnet.files, parent: '' });
  if (Array.isArray(magnet.links)) roots.push({ entries: magnet.links, parent: '' });
  if (Array.isArray(magnet.items)) roots.push({ entries: magnet.items, parent: '' });

  const output = [];
  for (const root of roots) walkEntries(root.entries, root.parent, output);

  if (!output.length && Array.isArray(magnet.files)) {
    for (const item of magnet.files) {
      if (item && (item.l || item.link) && (item.n || item.name)) {
        output.push(normalizeFile(item, ''));
      }
    }
  }

  return dedupeFiles(output);
}

function walkEntries(entries, parent, output) {
  if (!Array.isArray(entries)) return;

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;

    const name = entry.n || entry.name || entry.filename || entry.path || '';
    const currentPath = parent && name ? parent + '/' + name : (name || parent);
    const children = entry.e || entry.entries || entry.children || entry.files;

    if (Array.isArray(children)) {
      walkEntries(children, currentPath, output);
      continue;
    }

    if (entry.l || entry.link || entry.url || entry.download) {
      output.push(normalizeFile(entry, parent));
    }
  }
}

function normalizeFile(entry, parent) {
  const name = entry.n || entry.name || entry.filename || 'Unknown file';
  let path = entry.path || '';
  if (!path) path = parent ? parent + '/' + name : name;

  return {
    name: name,
    path: path,
    link: entry.l || entry.link || entry.url || entry.download || null,
    size: Number(entry.s || entry.size || entry.bytes || 0) || 0
  };
}

function dedupeFiles(files) {
  const seen = new Set();
  return files.filter(function (file) {
    const key = file.path + '|' + (file.link || '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeMagnet(magnet) {
  if (!magnet || typeof magnet !== 'object') return magnet;
  return {
    id: magnet.id,
    statusCode: magnet.statusCode,
    status: magnet.status,
    name: magnet.name || magnet.filename || null,
    completionDate: magnet.completionDate || null,
    keys: Object.keys(magnet).slice(0, 30)
  };
}

function summarizeObject(value) {
  if (!value || typeof value !== 'object') return { type: typeof value, value: value };
  return { keys: Object.keys(value).slice(0, 50) };
}

function summarizeMagnetContainer(data) {
  if (!data || typeof data !== 'object') return { type: typeof data };
  const out = {};
  for (const key of Object.keys(data).slice(0, 20)) {
    const value = data[key];
    if (Array.isArray(value)) {
      out[key] = { type: 'array', length: value.length, first: value.length ? summarizeEntry(value[0]) : null };
    } else if (value && typeof value === 'object') {
      out[key] = { type: 'object', keys: Object.keys(value).slice(0, 30) };
    } else {
      out[key] = { type: typeof value };
    }
  }
  return out;
}

function discoverFileEntries(response) {
  const found = [];
  const visited = new Set();

  function scan(value, location, depth) {
    if (depth > 5 || value === null || value === undefined) return;
    if (typeof value !== 'object') return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      if (value.length) scan(value[0], location + '[0]', depth + 1);
      return;
    }

    const keys = Object.keys(value);
    const hasName = !!(value.n || value.name || value.filename);
    const hasLink = !!(value.l || value.link || value.url || value.download);
    const hasChildren = Array.isArray(value.e) || Array.isArray(value.files) || Array.isArray(value.entries) || Array.isArray(value.children);

    if (hasName || hasLink || hasChildren) {
      found.push({
        location: location,
        keys: keys.slice(0, 30),
        name: value.n || value.name || value.filename || null,
        hasLink: hasLink,
        linkKey: value.l ? 'l' : (value.link ? 'link' : (value.url ? 'url' : (value.download ? 'download' : null))),
        hasChildren: hasChildren,
        childKey: Array.isArray(value.e) ? 'e' : (Array.isArray(value.files) ? 'files' : (Array.isArray(value.entries) ? 'entries' : (Array.isArray(value.children) ? 'children' : null)))
      });
    }

    for (const key of keys) {
      if (key === 'l' || key === 'link' || key === 'url' || key === 'download') continue;
      scan(value[key], location + '.' + key, depth + 1);
      if (found.length >= 30) return;
    }
  }

  scan(response, 'root', 0);
  return found.slice(0, 30);
}

function summarizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry;
  const result = { keys: Object.keys(entry).slice(0, 30) };
  if (entry.n || entry.name || entry.filename) result.name = entry.n || entry.name || entry.filename;
  if (entry.l || entry.link || entry.url || entry.download) result.hasLink = true;
  return result;
}

async function apiRequest(endpoint, fields) {
  requireKey();
  const body = new URLSearchParams();

  for (const key of Object.keys(fields || {})) {
    const value = fields[key];
    if (Array.isArray(value)) {
      for (const item of value) body.append(key + '[]', String(item));
    } else if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + ALLDEBRID_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: body.toString()
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error('AllDebrid returned non-JSON HTTP ' + response.status + ': ' + text.slice(0, 200));
  }

  if (!response.ok || data.status !== 'success') {
    const message = data && data.error && data.error.message ? data.error.message : 'AllDebrid API returned HTTP ' + response.status;
    throw new Error(message);
  }

  return data;
}

function requireKey() {
  if (!ALLDEBRID_API_KEY) throw new Error('ALLDEBRID_API_KEY is not configured in Vercel.');
}

function makeFileId(magnetId, filePath) {
  return 'ad_' + magnetId + '_' + base64UrlEncode(filePath);
}

function parseFileId(id) {
  const match = String(id).match(/^ad_(\d+)_(.+)$/);
  if (!match) return null;
  try {
    return { magnetId: match[1], filePath: base64UrlDecode(match[2]) };
  } catch (_) {
    return null;
  }
}

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const padding = (4 - (value.length % 4)) % 4;
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function cleanTitle(filename) {
  return String(filename)
    .replace(VIDEO_EXTENSIONS, '')
    .replace(/[_\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYear(value) {
  const match = String(value).match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}
