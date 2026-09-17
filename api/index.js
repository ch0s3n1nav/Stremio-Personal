const ALLDEBRID_API_KEY = process.env.ALLDEBRID_API_KEY || '';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

const STATUS_URL = 'https://api.alldebrid.com/v4.1/magnet/status';
const FILES_URL = 'https://api.alldebrid.com/v4/magnet/files';

const UFC_LOGO = 'https://i.imgur.com/8QwFZ5Y.png';
const UFC_BACKGROUND = 'https://i.imgur.com/4zW9YqM.jpeg';

const VIDEO_EXTENSIONS = /\.(mp4|mkv|avi|mov|m4v|ts|webm)$/i;

const UFC_TERMS = [
  'ufc',
  'ultimate fighting championship',
  'fight night',
  'ufc fight night',
  'ufc on espn',
  'ufc on abc',
  'ufc on fox',
  'ufc on fx',
  'ufc 3',
  'ufc 4',
  'ufc 5',
  'ufc 6',
  'ufc 7',
  'ufc 8',
  'ufc 9'
];

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(text);
}

function cleanTitle(name) {
  if (!name) {
    return 'UFC';
  }

  let title = String(name);

  title = title.replace(/\.[a-z0-9]{2,5}$/i, '');
  title = title.replace(/[._]+/g, ' ');
  title = title.replace(/\s+/g, ' ');
  title = title.trim();

  return title;
}

function looksLikeUfc(name) {
  if (!name) {
    return false;
  }

  const value = String(name).toLowerCase();

  for (let i = 0; i < UFC_TERMS.length; i++) {
    if (value.indexOf(UFC_TERMS[i]) !== -1) {
      return true;
    }
  }

  return false;
}

function looksLikeVideo(name) {
  if (!name) {
    return false;
  }

  return VIDEO_EXTENSIONS.test(String(name));
}

function encodeBase64Url(value) {
  return Buffer.from(String(value), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value) {
  let input = String(value)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  while (input.length % 4 !== 0) {
    input += '=';
  }

  return Buffer.from(input, 'base64').toString('utf8');
}

function makeFileId(magnetId, fileName) {
  return 'ad_' + String(magnetId) + '_' + encodeBase64Url(fileName);
}

function parseFileId(id) {
  if (!id || typeof id !== 'string') {
    return null;
  }

  if (id.indexOf('ad_') !== 0) {
    return null;
  }

  const remainder = id.substring(3);
  const separator = remainder.indexOf('_');

  if (separator === -1) {
    return null;
  }

  const magnetId = remainder.substring(0, separator);
  const encodedName = remainder.substring(separator + 1);

  if (!magnetId || !encodedName) {
    return null;
  }

  let fileName;

  try {
    fileName = decodeBase64Url(encodedName);
  } catch (error) {
    return null;
  }

  return {
    magnetId: magnetId,
    fileName: fileName
  };
}

async function readResponseBody(response) {
  const text = await response.text();

  let json = null;

  try {
    json = JSON.parse(text);
  } catch (error) {
    json = null;
  }

  return {
    text: text,
    json: json
  };
}

async function allDebridRequest(url, params) {
  if (!ALLDEBRID_API_KEY) {
    throw new Error('ALLDEBRID_API_KEY is not configured');
  }

  const body = new URLSearchParams();

  const keys = Object.keys(params || {});

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = params[key];

    if (Array.isArray(value)) {
      for (let j = 0; j < value.length; j++) {
        body.append(key + '[]', String(value[j]));
      }
    } else if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + ALLDEBRID_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'Stremio-UFC-AllDebrid/1.0'
    },
    body: body.toString()
  });

  const result = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      'AllDebrid HTTP ' +
      response.status +
      ': ' +
      result.text.substring(0, 500)
    );
  }

  if (!result.json) {
    throw new Error(
      'AllDebrid returned non-JSON response: ' +
      result.text.substring(0, 500)
    );
  }

  if (result.json.status !== 'success') {
    const error = result.json.error || {};

    throw new Error(
      'AllDebrid API error ' +
      (error.code || 'UNKNOWN') +
      ': ' +
      (error.message || 'Unknown error')
    );
  }

  return result.json;
}

function getMagnetsFromResponse(response) {
  if (!response || !response.data) {
    return [];
  }

  if (Array.isArray(response.data.magnets)) {
    return response.data.magnets;
  }

  if (response.data.magnets && typeof response.data.magnets === 'object') {
    return Object.values(response.data.magnets);
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data.items)) {
    return response.data.items;
  }

  if (Array.isArray(response.data.results)) {
    return response.data.results;
  }

  return [];
}

function getReadyMagnets(magnets) {
  return magnets.filter(function(magnet) {
    if (!magnet) {
      return false;
    }

    if (String(magnet.status || '').toLowerCase() === 'ready') {
      return true;
    }

    if (Number(magnet.statusCode) === 4) {
      return true;
    }

    return false;
  });
}

function extractAllFiles(node, magnetId, currentPath, output) {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      extractAllFiles(node[i], magnetId, currentPath, output);
    }

    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  const nodeName =
    node.n ||
    node.name ||
    node.filename ||
    node.fileName ||
    '';

  let nextPath = currentPath || '';

  if (nodeName) {
    if (nextPath) {
      nextPath = nextPath + '/' + String(nodeName);
    } else {
      nextPath = String(nodeName);
    }
  }

  const link =
    node.l ||
    node.link ||
    node.url ||
    node.download ||
    '';

  if (link) {
    output.push({
      magnetId: String(magnetId),
      name: String(nodeName || nextPath || 'UFC file'),
      path: nextPath,
      size: Number(node.s || node.size || 0),
      link: String(link)
    });
  }

  const childKeys = [
    'e',
    'entries',
    'children',
    'files',
    'items'
  ];

  for (let i = 0; i < childKeys.length; i++) {
    const key = childKeys[i];

    if (node[key]) {
      extractAllFiles(
        node[key],
        magnetId,
        nextPath,
        output
      );
    }
  }
}

async function getUfcFiles() {
  const statusResponse = await allDebridRequest(
    STATUS_URL,
    {}
  );

  const allMagnets = getMagnetsFromResponse(statusResponse);
  const readyMagnets = getReadyMagnets(allMagnets);

  if (!readyMagnets.length) {
    return [];
  }

  const files = [];

  const batchSize = 25;

  for (let start = 0; start < readyMagnets.length; start += batchSize) {
    const batch = readyMagnets.slice(
      start,
      start + batchSize
    );

    const ids = batch.map(function(magnet) {
      return magnet.id;
    });

    const fileResponse = await allDebridRequest(
      FILES_URL,
      {
        id: ids
      }
    );

    const returnedMagnets = getMagnetsFromResponse(fileResponse);

    for (let i = 0; i < returnedMagnets.length; i++) {
      const magnet = returnedMagnets[i];

      if (!magnet) {
        continue;
      }

      const magnetId = magnet.id;

      if (!magnet.files) {
        continue;
      }

      extractAllFiles(
        magnet.files,
        magnetId,
        '',
        files
      );
    }
  }

  return files.filter(function(file) {
    return looksLikeUfc(file.name) && looksLikeVideo(file.name);
  });
}

function uniqueFiles(files) {
  const seen = {};
  const result = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const key =
      String(file.magnetId) +
      '|' +
      String(file.path || file.name);

    if (seen[key]) {
      continue;
    }

    seen[key] = true;
    result.push(file);
  }

  return result;
}

function makeCatalogItem(file) {
  const id = makeFileId(
    file.magnetId,
    file.path || file.name
  );

  const title = cleanTitle(file.name);

  return {
    id: id,
    type: 'movie',
    name: title,
    poster: UFC_LOGO,
    background: UFC_BACKGROUND,
    logo: UFC_LOGO,
    description: title
  };
}

function makeMeta(file) {
  const id = makeFileId(
    file.magnetId,
    file.path || file.name
  );

  const title = cleanTitle(file.name);

  return {
    id: id,
    type: 'movie',
    name: title,
    poster: UFC_LOGO,
    background: UFC_BACKGROUND,
    logo: UFC_LOGO,
    description: title,
    genres: ['UFC', 'MMA'],
    videos: [
      {
        id: id,
        title: title,
        name: title,
        released: new Date().toISOString()
      }
    ]
  };
}

async function findFileById(id) {
  const parsed = parseFileId(id);

  if (!parsed) {
    return null;
  }

  const response = await allDebridRequest(
    FILES_URL,
    {
      id: [parsed.magnetId]
    }
  );

  const magnets = getMagnetsFromResponse(response);

  for (let i = 0; i < magnets.length; i++) {
    const magnet = magnets[i];

    if (!magnet) {
      continue;
    }

    if (String(magnet.id) !== String(parsed.magnetId)) {
      continue;
    }

    const files = [];

    extractAllFiles(
      magnet.files || [],
      magnet.id,
      '',
      files
    );

    for (let j = 0; j < files.length; j++) {
      const file = files[j];

      if (
        String(file.path || file.name) ===
        String(parsed.fileName)
      ) {
        return file;
      }

      if (
        String(file.name) ===
        String(parsed.fileName)
      ) {
        return file;
      }
    }
  }

  return null;
}

function getBaseUrl(req) {
  const forwardedProto =
    req.headers['x-forwarded-proto'];

  const protocol =
    forwardedProto ||
    'https';

  const host =
    req.headers.host ||
    'stremio-debrid.vercel.app';

  return protocol + '://' + host;
}

function manifest() {
  return {
    id: 'com.stremio.navsufcalldebrid',
    version: '1.0.0',
    name: 'Navs UFC AllDebrid',
    description: 'UFC fights from AllDebrid',
    logo: UFC_LOGO,
    background: UFC_BACKGROUND,
    resources: [
      'catalog',
      'meta',
      'stream'
    ],
    types: [
      'movie'
    ],
    idPrefixes: [
      'ad_'
    ],
    catalogs: [
      {
        type: 'movie',
        id: 'ufc-events',
        name: 'UFC Events',
        extra: [
          {
            name: 'skip',
            isRequired: false
          }
        ]
      }
    ]
  };
}

async function handleCatalog(req, res) {
  try {
    const files = uniqueFiles(
      await getUfcFiles()
    );

    const metas = files.map(function(file) {
      return makeCatalogItem(file);
    });

    sendJson(res, 200, {
      metas: metas
    });
  } catch (error) {
    sendJson(res, 500, {
      metas: [],
      error: error.message
    });
  }
}

async function handleMeta(req, res, id) {
  try {
    const file = await findFileById(id);

    if (!file) {
      sendJson(res, 404, {
        meta: null
      });

      return;
    }

    sendJson(res, 200, {
      meta: makeMeta(file)
    });
  } catch (error) {
    sendJson(res, 500, {
      meta: null,
      error: error.message
    });
  }
}

async function handleStream(req, res, id) {
  try {
    const file = await findFileById(id);

    if (!file || !file.link) {
      sendJson(res, 404, {
        streams: []
      });

      return;
    }

    sendJson(res, 200, {
      streams: [
        {
          name: 'AllDebrid',
          title: cleanTitle(file.name),
          url: file.link,
          behaviorHints: {
            bingeGroup: 'ufc'
          }
        }
      ]
    });
  } catch (error) {
    sendJson(res, 500, {
      streams: [],
      error: error.message
    });
  }
}

function handleConfigure(req, res) {
  const baseUrl = getBaseUrl(req);

  sendText(
    res,
    200,
    'Navs UFC AllDebrid\\n\\n' +
    'This addon uses the AllDebrid API key configured in Vercel.\\n\\n' +
    'Manifest URL:\\n' +
    baseUrl +
    '/manifest.json'
  );
}

async function handler(req, res) {
  const url = new URL(
    req.url,
    'http://' + (req.headers.host || 'localhost')
  );

  const pathname = url.pathname;

  if (pathname === '/') {
    sendJson(res, 200, {
      name: 'Navs UFC AllDebrid',
      status: 'online',
      manifest: getBaseUrl(req) + '/manifest.json'
    });

    return;
  }

  if (pathname === '/manifest.json') {
    sendJson(res, 200, manifest());

    return;
  }

  if (pathname === '/configure') {
    handleConfigure(req, res);

    return;
  }

  if (
    pathname === '/catalog/movie/ufc-events.json' ||
    pathname === '/catalog/movie/ufc-events'
  ) {
    await handleCatalog(req, res);

    return;
  }

  if (pathname.indexOf('/meta/movie/') === 0) {
    const id = pathname
      .replace('/meta/movie/', '')
      .replace(/\.json$/, '');

    await handleMeta(req, res, decodeURIComponent(id));

    return;
  }

  if (pathname.indexOf('/stream/movie/') === 0) {
    const id = pathname
      .replace('/stream/movie/', '')
      .replace(/\.json$/, '');

    await handleStream(req, res, decodeURIComponent(id));

    return;
  }

  sendJson(res, 404, {
    error: 'Not found'
  });
}

module.exports = handler;
