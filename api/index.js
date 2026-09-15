const ALLDEBRID_API_KEY = process.env.ALLDEBRID_API_KEY || '';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

const ALLDEBRID_STATUS_URL =
  'https://api.alldebrid.com/v4.1/magnet/status';

const ALLDEBRID_FILES_URL =
  'https://api.alldebrid.com/v4/magnet/files';

const ALLDEBRID_UNLOCK_URL =
  'https://api.alldebrid.com/v4/link/unlock';

const ALLDEBRID_DELAYED_URL =
  'https://api.alldebrid.com/v4/link/delayed';

const ALLDEBRID_STREAMING_URL =
  'https://api.alldebrid.com/v4/link/streaming';

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
 * AllDebrid API helper
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

  if (
    data?.status?.code &&
    data.status.code !== 200
  ) {
    throw new Error(
      `AllDebrid API error (${data.status.code}): ${
        data.status.message || 'Unknown error'
      }`
    );
  }

  return data;
}

/*
 * Get ready magnets
 */
async function getReadyMagnets() {
  const body = new URLSearchParams();

  body.append('status', 'ready');

  const data = await allDebridRequest(
    ALLDEBRID_STATUS_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }
  );

  return data?.data?.magnets || [];
}

/*
 * Flatten AllDebrid's nested file tree
 */
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

    if (Array.isArray(node.e)) {
      result.push(
        ...flattenFiles(node.e, nodePath)
      );

      continue;
    }

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

/*
 * Get files for magnets
 */
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
        'Content-Type':
          'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }
  );

  return data?.data?.magnets || [];
}

/*
 * Check whether a file is a video
 */
function isVideoFile(fileName) {
  return /\.(mp4|mkv|avi|mov|m4v|webm|ts|m2ts)$/i.test(
    fileName || ''
  );
}

/*
 * Check whether a filename is UFC/MMA related
 */
function isUfcFile(name) {
  const value = String(name || '').toLowerCase();

  return (
    value.includes('ufc') ||
    value.includes(
      'ultimate fighting championship'
    ) ||
    value.includes('mma') ||
    value.includes('fight night')
  );
}

/*
 * Get UFC files from all ready magnets
 */
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
      item =>
        String(item.id) === String(magnetId)
    );

    const magnetName =
      originalMagnet?.filename ||
      magnet.filename ||
      '';

    const files = flattenFiles(
      magnet.files ||
      magnet.file ||
      []
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

/*
 * Create Stremio file ID
 */
function makeFileId(magnetId, filePath) {
  return `ad_${magnetId}_${base64UrlEncode(
    filePath
  )}`;
}

/*
 * Decode Stremio file ID
 */
function parseFileId(id) {
  if (!id || !id.startsWith('ad_')) {
    return null;
  }

  const value = id.substring(3);
  const separator = value.indexOf('_');

  if (separator === -1) {
    return null;
  }

  const magnetId = value.substring(
    0,
    separator
  );

  const encodedPath = value.substring(
    separator + 1
  );

  if (!magnetId || !encodedPath) {
    return null;
  }

  return {
    magnetId,
    filePath: base64UrlDecode(encodedPath)
  };
}

/*
 * Find a specific file inside an AllDebrid magnet
 */
async function findFile(
  magnetId,
  filePath
) {
  const magnets = await getMagnetFiles([
    magnetId
  ]);

  const magnet = magnets.find(
    item =>
      String(item.id) === String(magnetId)
  );

  if (!magnet) {
    return null;
  }

  const files = flattenFiles(
    magnet.files ||
    magnet.file ||
    []
  );

  return (
    files.find(
      file => file.path === filePath
    ) ||
    files.find(
      file => file.name === filePath
    ) ||
    null
  );
}

/*
 * Convert AllDebrid's private /f/ link
 * into the real downloadable /dl/ link.
 *
 * AllDebrid documents /link/unlock as the
 * endpoint for this conversion.
 */
async function unlockAllDebridLink(
  privateLink
) {
  const body = new URLSearchParams();

  body.append('link', privateLink);

  const data = await allDebridRequest(
    ALLDEBRID_UNLOCK_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }
  );

const result = data?.data;

if (!result) {
  throw new Error(
    `AllDebrid unlock response: status=${data?.status || 'unknown'}, ` +
    `error=${data?.error?.code || data?.error?.message || 'none'}, ` +
    `keys=${Object.keys(data || {}).join(',')}`
  );
}

  /*
   * Normal case:
   * AllDebrid immediately gives us the
   * real debrid.it download URL.
   */
  if (result.link) {
    return result.link;
  }

  /*
   * Sometimes AllDebrid needs a little
   * time to generate the link.
   */
  if (result.delayed) {
    const delayedId = result.delayed;

    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise(resolve =>
        setTimeout(resolve, 5000)
      );

      const delayedBody =
        new URLSearchParams();

      delayedBody.append(
        'id',
        String(delayedId)
      );

      const delayedData =
        await allDebridRequest(
          ALLDEBRID_DELAYED_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded'
            },
            body:
              delayedBody.toString()
          }
        );

      const delayedResult =
        delayedData?.data;

      if (delayedResult?.link) {
        return delayedResult.link;
      }
    }

    throw new Error(
      'AllDebrid took too long to generate the download link'
    );
  }

  throw new Error(
    'AllDebrid did not provide a downloadable link'
  );
}

/*
 * Main request handler
 */
async function handleRequest(req, res) {
  const path = getPath(req);

  /*
   * Manifest
   */
  if (path === '/manifest.json') {
    return sendJson(
      res,
      200,
      MANIFEST
    );
  }

  /*
 * AllDebrid streaming API diagnostic test
 *
 * This tests whether AllDebrid will allow the
 * Vercel server to request a streaming link.
 */
if (path === '/test-alldebrid-streaming') {
  try {
    const testLink =
      'https://alldebrid.com/f/3TO0YfFNbrSxYR1gubi52XoOhnsH5XzUBfRtzG7LZ1E';

    const body = new URLSearchParams();

    body.append('link', testLink);

    const data = await allDebridRequest(
      ALLDEBRID_STREAMING_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded'
        },
        body: body.toString()
      }
    );

    return sendJson(res, 200, {
      success: true,
      message:
        'AllDebrid streaming API responded.',
      responseKeys:
        Object.keys(data || {}),
      dataKeys:
        Object.keys(data?.data || {}),
      status:
        data?.status || null
    });

  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: error.message
    });
  }
}

/*
 * Test whether Vercel can read an AllDebrid
 * private-file page and find its download link.
 */
if (path === '/test-alldebrid-page') {
  try {
    const testLink =
      'https://alldebrid.com/f/3TO0YfFNbrSxYR1gubi52XoOhnsH5XzUBfRtzG7LZ1E';

    const response = await fetch(testLink, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml'
      }
    });

    const html = await response.text();

    /*
     * Look for the actual AllDebrid download URL.
     */
    const match = html.match(
      /https?:\/\/[^"'\\\s<>]*debrid\.it\/dl\/[^"'\\\s<>]*/i
    );

    return sendJson(res, 200, {
      success: true,
      httpStatus: response.status,
      contentType:
        response.headers.get('content-type'),
      pageLength: html.length,
      containsDownloadLink: !!match,
      downloadHost: match
        ? new URL(match[0]).hostname
        : null
    });

  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: error.message
    });
  }
}
  
  /*
   * AllDebrid connection test
   */
  if (path === '/test-alldebrid') {
    try {
      const magnets =
        await getReadyMagnets();

      return sendJson(res, 200, {
        success: true,
        apiKey: 'SET',
        readyMagnets: magnets.length,
        message:
          'AllDebrid connection is working.'
      });
    } catch (error) {
      return sendJson(res, 500, {
        success: false,
        apiKey:
          ALLDEBRID_API_KEY
            ? 'SET'
            : 'NOT SET',
        error: error.message
      });
    }
  }

  /*
   * UFC catalogue
   */
  if (
    path ===
    '/catalog/movie/ufc-events.json'
  ) {
    try {
      const files =
        await getUfcFiles();

      const url =
        new URL(
          req.url,
          'https://example.com'
        );

      const search =
        url.searchParams.get(
          'search'
        );

      const filteredFiles =
        search
          ? files.filter(file =>
              `${file.fileName} ${file.magnetName}`
                .toLowerCase()
                .includes(
                  search.toLowerCase()
                )
            )
          : files;

      const metas =
        filteredFiles.map(file => ({
          id: makeFileId(
            file.magnetId,
            file.path
          ),
          type: 'movie',
          name: file.fileName,
          description:
            file.magnetName,
          poster:
            'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
          background:
            'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1600',
          releaseInfo:
            file.completionDate
              ? new Date(
                  file.completionDate *
                    1000
                )
                  .getFullYear()
                  .toString()
              : '',
          website:
            'https://www.ufc.com'
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
    path.match(
      /^\/meta\/movie\/([^/]+)\.json$/
    );

  if (metaMatch) {
    try {
      const id =
        decodeURIComponent(
          metaMatch[1]
        );

      const parsed =
        parseFileId(id);

      if (!parsed) {
        return sendJson(res, 404, {
          error:
            'Invalid file ID'
        });
      }

      const file =
        await findFile(
          parsed.magnetId,
          parsed.filePath
        );

      if (!file) {
        return sendJson(res, 404, {
          error:
            'File not found'
        });
      }

      return sendJson(res, 200, {
        meta: {
          id,
          type: 'movie',
          name: file.name,
          description:
            'UFC / MMA event from AllDebrid',
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
    path.match(
      /^\/stream\/movie\/([^/]+)\.json$/
    );

  if (streamMatch) {
    try {
      const id =
        decodeURIComponent(
          streamMatch[1]
        );

      const parsed =
        parseFileId(id);

      if (!parsed) {
        return sendJson(res, 404, {
          streams: []
        });
      }

      const file =
        await findFile(
          parsed.magnetId,
          parsed.filePath
        );

      if (!file || !file.url) {
        return sendJson(res, 404, {
          streams: []
        });
      }

      /*
       * IMPORTANT:
       *
       * file.url is the AllDebrid
       * /f/ private link.
       *
       * We now use AllDebrid's API to
       * unlock it and obtain the actual
       * temporary /dl/ media URL.
       */
      const directUrl =
        await unlockAllDebridLink(
          file.url
        );

      return sendJson(res, 200, {
        streams: [
          {
            name: 'AllDebrid',
            title: file.name,
            url: directUrl
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

if (path === '/test-alldebrid-webdav') {
  try {
    const apiKey = process.env.ALLDEBRID_API_KEY;

    if (!apiKey) {
      return sendJson(res, 500, {
        success: false,
        error: 'ALLDEBRID_API_KEY is not set'
      });
    }

    const auth = Buffer
      .from(`${apiKey}:eeeeee`)
      .toString('base64');

    const filePath =
      '/magnets/UFC.Fight.Night.287.Hooker.vs.Parnasse.Prelims.1080p.WEB-DL.H264.Fight-BB.mp4/UFC.Fight.Night.287.Hooker.vs.Parnasse.Prelims.1080p.WEB-DL.H264.Fight-BB.mp4';

    const response = await fetch(
      `https://webdav.debrid.it${filePath}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Range': 'bytes=0-1023'
        }
      }
    );

    const buffer = await response.arrayBuffer();

    return sendJson(res, 200, {
      success: response.ok || response.status === 206,
      httpStatus: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      contentRange: response.headers.get('content-range'),
      acceptRanges: response.headers.get('accept-ranges'),
      bytesReceived: buffer.byteLength
    });

  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: error.message
    });
  }
}
  
  return sendJson(res, 404, {
    error:
      'Endpoint not found',
    path
  });
}

module.exports = async (
  req,
  res
) => {
  try {
    await handleRequest(
      req,
      res
    );
  } catch (error) {
    sendJson(res, 500, {
      error:
        error.message ||
        'Internal server error'
    });
  }
};
