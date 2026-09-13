const ALLDEBRID_API_KEY = process.env.ALLDEBRID_API_KEY || '';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

const ALLDEBRID_STATUS_URL =
  'https://api.alldebrid.com/v4.1/magnet/status';

const ALLDEBRID_FILES_URL =
  'https://api.alldebrid.com/v4/magnet/files';

const MANIFEST = {
  id: 'com.stremio.navsufcalldebrid',
  version: '1.0.0',
  name: "Nav's UFC AllDebrid",
  description: 'UFC and MMA files from AllDebrid magnets',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie'],
  idPrefixes: ['ad_'],
  catalogs: [
    {
      type: 'movie',
      id: 'ufc-events',
      name: 'UFC Events',
      extra: [
        {
          name: 'search',
          isRequired: false
        }
      ]
    }
  ]
};

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function getPath(req) {
  return (req.url || '').split('?')[0];
}

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  let str = value.replace(/-/g, '+').replace(/_/g, '/');

  while (str.length % 4) {
    str += '=';
  }

  return Buffer.from(str, 'base64').toString('utf8');
}

/*
 * AllDebrid API helper.
 *
 * AllDebrid expects the API key as a Bearer token.
 */
async function allDebridRequest(url, options = {}) {
  if (!ALLDEBRID_API_KEY) {
    throw new Error('ALLDEBRID_API_KEY is not configured');
  }

  const headers = {
    'Authorization': `Bearer ${ALLDEBRID_API_KEY}`,
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `AllDebrid returned a non-JSON response (${response.status})`
    );
  }

  if (!response.ok) {
    const message =
      data?.status?.message ||
      data?.error?.message ||
      data?.error ||
      `HTTP ${response.status}`;

    throw new Error(
      `AllDebrid API error (${response.status}): ${message}`
    );
  }

  if (data?.status?.code && data.status.code !== 200) {
    throw new Error(
      `AllDebrid API error (${data.status.code}): ${
        data.status.message || 'Unknown error'
      }`
    );
  }

  return data;
}

async function getReadyMagnets() {
  const body = new URLSearchParams();

  body.append('status', 'ready');

  const data = await allDebridRequest(
    ALLDEBRID_STATUS_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }
  );

  return data?.data?.magnets || [];
}

function flattenFiles(nodes, currentPath = '') {
  const result = [];

  if (!Array.isArray(nodes)) {
    return result;
  }

  for (const node of nodes) {
    if (!node || !node.n) {
      continue;
    }

    const nodePath = currentPath
      ? `${currentPath}/${node.n}`
      : node.n;

    /*
     * Folder
     */
    if (Array.isArray(node.e)) {
      result.push(
        ...flattenFiles(node.e, nodePath)
      );
      continue;
    }

    /*
     * File
     */
    if (node.l) {
      result.push({
        name: node.n,
        path: nodePath,
        size: node.s || 0,
        url: node.l
      });
    }
  }

  return result;
}

async function getMagnetFiles(magnetIds) {
  if (!magnetIds.length) {
    return [];
  }

  const body = new URLSearchParams();

  for (const id of magnetIds) {
    body.append('id[]', String(id));
  }

  const data = await allDebridRequest(
    ALLDEBRID_FILES_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }
  );

  return data?.data?.magnets || [];
}

function isVideoFile(fileName) {
  return /\.(mp4|mkv|avi|mov|m4v|webm|ts|m2ts)$/i.test(
    fileName || ''
  );
}

function isUfcFile(name) {
  const value = String(name || '').toLowerCase();

  return (
    value.includes('ufc') ||
    value.includes('ultimate fighting championship') ||
    value.includes('mma') ||
    value.includes('fight night')
  );
}

async function getUfcFiles() {
  const magnets = await getReadyMagnets();

  if (!magnets.length) {
    return [];
  }

  const ids = magnets
    .map(magnet => magnet.id)
    .filter(Boolean);

  const magnetFiles = await getMagnetFiles(ids);

  const results = [];

  for (const magnet of magnetFiles) {
    const magnetId = magnet.id;

    const originalMagnet = magnets.find(
      item => String(item.id) === String(magnetId)
    );

    const magnetName =
      originalMagnet?.filename ||
      magnet.filename ||
      '';

    const files = flattenFiles(
      magnet.files || magnet.file || []
    );

    for (const file of files) {
      if (!isVideoFile(file.name)) {
        continue;
      }

      if (
        !isUfcFile(file.name) &&
        !isUfcFile(magnetName)
      ) {
        continue;
      }

      results.push({
        magnetId: String(magnetId),
        magnetName,
        fileName: file.name,
        path: file.path,
        size: file.size,
        url: file.url,
        completionDate:
          originalMagnet?.completionDate || 0
      });
    }
  }

  return results;
}

function makeFileId(magnetId, filePath) {
  return `ad_${magnetId}_${base64UrlEncode(filePath)}`;
}

function parseFileId(id) {
  if (!id || !id.startsWith('ad_')) {
    return null;
  }

  const value = id.substring(3);
  const separator = value.indexOf('_');

  if (separator === -1) {
    return null;
  }

  const magnetId = value.substring(0, separator);
  const encodedPath = value.substring(separator + 1);

  if (!magnetId || !encodedPath) {
    return null;
  }

  return {
    magnetId,
    filePath: base64UrlDecode(encodedPath)
  };
}

async function findFile(magnetId, filePath) {
  const magnets = await getMagnetFiles([magnetId]);

  const magnet = magnets.find(
    item => String(item.id) === String(magnetId)
  );

  if (!magnet) {
    return null;
  }

  const files = flattenFiles(
    magnet.files || magnet.file || []
  );

  return (
    files.find(file => file.path === filePath) ||
    files.find(file => file.name === filePath) ||
    null
  );
}

async function handleRequest(req, res) {
  const path = getPath(req);

  /*
   * Manifest
   */
  if (path === '/manifest.json') {
    return sendJson(res, 200, MANIFEST);
  }

  /*
   * AllDebrid connection test
   */
  if (path === '/test-alldebrid') {
    try {
      const magnets = await getReadyMagnets();

      return sendJson(res, 200, {
        success: true,
        apiKey: 'SET',
        readyMagnets: magnets.length,
        message: 'AllDebrid connection is working.'
      });
    } catch (error) {
      return sendJson(res, 500, {
        success: false,
        apiKey: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
        error: error.message
      });
    }
  }

  /*
   * UFC catalogue
   */
  if (path === '/catalog/movie/ufc-events.json') {
    try {
      const files = await getUfcFiles();

      const metas = files.map(file => ({
        id: makeFileId(file.magnetId, file.path),
        type: 'movie',
        name: file.fileName,
        description: file.magnetName,
        poster:
          'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
        background:
          'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1600',
        releaseInfo: file.completionDate
          ? new Date(file.completionDate * 1000)
              .getFullYear()
              .toString()
          : '',
        website: 'https://www.ufc.com'
      }));

      return sendJson(res, 200, {
        metas
      });
    } catch (error) {
      return sendJson(res, 500, {
        metas: [],
        error: error.message
      });
    }
  }

  /*
   * Meta
   */
  const metaMatch =
    path.match(/^\/meta\/movie\/([^/]+)\.json$/);

  if (metaMatch) {
    try {
      const id = decodeURIComponent(metaMatch[1]);
      const parsed = parseFileId(id);

      if (!parsed) {
        return sendJson(res, 404, {
          error: 'Invalid file ID'
        });
      }

      const file = await findFile(
        parsed.magnetId,
        parsed.filePath
      );

      if (!file) {
        return sendJson(res, 404, {
          error: 'File not found'
        });
      }

      return sendJson(res, 200, {
        meta: {
          id,
          type: 'movie',
          name: file.name,
          description: 'UFC / MMA event from AllDebrid',
          poster:
            'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
          background:
            'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1600'
        }
      });
    } catch (error) {
      return sendJson(res, 500, {
        error: error.message
      });
    }
  }

  /*
   * Stream
   */
  const streamMatch =
    path.match(/^\/stream\/movie\/([^/]+)\.json$/);

  if (streamMatch) {
    try {
      const id = decodeURIComponent(streamMatch[1]);
      const parsed = parseFileId(id);

      if (!parsed) {
        return sendJson(res, 404, {
          streams: []
        });
      }

      const file = await findFile(
        parsed.magnetId,
        parsed.filePath
      );

      if (!file || !file.url) {
        return sendJson(res, 404, {
          streams: []
        });
      }

      return sendJson(res, 200, {
        streams: [
          {
            name: 'AllDebrid',
            title: file.name,
            url: file.url
          }
        ]
      });
    } catch (error) {
      return sendJson(res, 500, {
        streams: [],
        error: error.message
      });
    }
  }

  /*
   * Simple search support
   */
  if (
    path === '/catalog/movie/ufc-events.json' &&
    req.url.includes('search=')
  ) {
    try {
      const query =
        new URL(req.url, 'https://example.com')
          .searchParams
          .get('search') || '';

      const files = await getUfcFiles();

      const filtered = files.filter(file =>
        `${file.fileName} ${file.magnetName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );

      return sendJson(res, 200, {
        metas: filtered.map(file => ({
          id: makeFileId(file.magnetId, file.path),
          type: 'movie',
          name: file.fileName,
          description: file.magnetName
        }))
      });
    } catch (error) {
      return sendJson(res, 500, {
        metas: [],
        error: error.message
      });
    }
  }

  return sendJson(res, 404, {
    error: 'Endpoint not found',
    path
  });
}

module.exports = async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || 'Internal server error'
    });
  }
};
