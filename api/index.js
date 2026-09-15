```javascript
const { ALLDEBRID_API_KEY, TMDB_API_KEY } = process.env;

const ALLDEBRID_STATUS_URL = 'https://api.alldebrid.com/v4.1/magnet/status';
const ALLDEBRID_FILES_URL = 'https://api.alldebrid.com/v4/magnet/files';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const ufcLogo = 'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png';
const ufcBackground = 'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg';

const VIDEO_EXTENSIONS =
  /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i;

const UFC_TERMS =
  /(\bUFC\b|\bMMA\b|Ultimate[ ._-]?Fighting[ ._-]?Championship|Fight[ ._-]?Night)/i;


module.exports = async function(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const requestUrl = new URL(
    req.url,
    'http://' + (req.headers.host || 'localhost')
  );

  const pathname = requestUrl.pathname;
  const searchParams = requestUrl.searchParams;

  try {
    if (pathname === '/' || pathname === '') {
      return handleRoot(res);
    }

    if (pathname === '/manifest.json') {
      return handleManifest(res);
    }

    if (pathname === '/configure') {
      return handleConfigure(res);
    }

    if (pathname === '/debug-env') {
      return handleDebugEnv(res);
    }

    if (pathname === '/test-alldebrid') {
      return await handleTestAllDebrid(res);
    }

    if (pathname === '/test-alldebrid-files') {
      return await handleTestAllDebridFiles(res);
    }

    if (pathname === '/test-alldebrid-service') {
      return res.status(410).json({
        success: false,
        error:
          'service.php is no longer used. The addon uses AllDebrid API file links directly.'
      });
    }

    const catalogMatch =
      pathname.match(/^\/catalog\/movie\/([^/]+)\.json$/);

    if (catalogMatch) {
      return await handleCatalog(
        res,
        catalogMatch[1],
        searchParams
      );
    }

    const metaMatch =
      pathname.match(/^\/meta\/movie\/(.+)\.json$/);

    if (metaMatch) {
      return await handleMeta(
        res,
        decodeURIComponent(metaMatch[1])
      );
    }

    const streamMatch =
      pathname.match(/^\/stream\/movie\/(.+)\.json$/);

    if (streamMatch) {
      return await handleStream(
        res,
        decodeURIComponent(streamMatch[1])
      );
    }

    return res.status(404).json({
      error: 'Endpoint not found',
      path: pathname
    });

  } catch (error) {
    console.error('API error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};


function setCors(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}


function handleRoot(res) {
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
      testAllDebridFiles: '/test-alldebrid-files'
    }
  });
}


function handleManifest(res) {
  return res.json({
    id: 'com.stremio.navsufcalldebrid',
    version: '2.3.0',
    name: "Nav's UFC AllDebrid",

    description:
      'Shows UFC fights stored in your AllDebrid cloud and streams them using the links returned by AllDebrid.',

    logo: ufcLogo,
    background: ufcBackground,

    types: ['movie'],

    catalogs: [
      {
        type: 'movie',
        id: 'ufc-events',
        name: 'UFC',

        extra: [
          {
            name: 'search',
            isRequired: false
          }
        ]
      }
    ],

    resources: [
      'catalog',
      'meta',
      'stream'
    ],

    idPrefixes: [
      'ad_'
    ],

    behaviorHints: {
      configurable: false,
      configurationRequired: false
    }
  });
}


function handleConfigure(res) {
  return res.json({
    type: 'configure',
    name: "Nav's UFC AllDebrid",

    description:
      'No configuration is required. The addon uses the AllDebrid API key stored securely in Vercel.',

    logo: ufcLogo,
    background: ufcBackground,

    types: ['movie'],
    settings: []
  });
}


async function handleCatalog(
  res,
  catalogType,
  searchParams
) {
  if (catalogType !== 'ufc-events') {
    return res.status(404).json({
      metas: []
    });
  }

  const search =
    (searchParams.get('search') || '')
      .trim()
      .toLowerCase();

  const files = await getUfcFiles();

  let filtered = files;

  if (search) {
    filtered = files.filter(function(item) {
      return item.name
        .toLowerCase()
        .includes(search);
    });
  }

  filtered = filtered.slice(0, 100);

  const metas = filtered.map(function(item) {
    const title = cleanTitle(item.name);

    return {
      id: item.id,
      type: 'movie',
      name: title,

      poster: ufcLogo,
      posterShape: 'regular',
      background: ufcBackground,

      description:
        'UFC fight stored in AllDebrid: ' +
        title,

      releaseInfo:
        extractYear(item.name) || undefined,

      genres: [
        'UFC',
        'MMA',
        'Fighting',
        'Sports'
      ]
    };
  });

  return res.json({
    metas: metas
  });
}


async function handleMeta(
  res,
  id
) {
  const parsed = parseFileId(id);

  if (!parsed) {
    return res.status(400).json({
      error: 'Invalid AllDebrid file ID'
    });
  }

  const file = await findFile(
    parsed.magnetId,
    parsed.filePath
  );

  if (!file) {
    return res.status(404).json({
      error: 'File not found in AllDebrid'
    });
  }

  const title = cleanTitle(file.name);

  return res.json({
    meta: {
      id: id,
      type: 'movie',
      name: title,

      poster: ufcLogo,
      posterShape: 'regular',
      background: ufcBackground,

      description:
        'UFC fight stored in your AllDebrid cloud: ' +
        title,

      genres: [
        'UFC',
        'MMA',
        'Fighting',
        'Sports'
      ],

      runtime: '180 min',
      year: extractYear(file.name) || undefined
    }
  });
}


async function handleStream(
  res,
  id
) {
  const parsed = parseFileId(id);

  if (!parsed) {
    return res.status(400).json({
      streams: [],
      error: 'Invalid AllDebrid file ID'
    });
  }

  const file = await findFile(
    parsed.magnetId,
    parsed.filePath
  );

  if (!file) {
    return res.status(404).json({
      streams: [],
      error: 'File not found in AllDebrid'
    });
  }

  if (!file.link) {
    return res.status(404).json({
      streams: [],
      error:
        'AllDebrid returned the file but no download link was found'
    });
  }

  console.log(
    'Using AllDebrid file link directly:',
    file.name
  );

  console.log(
    'AllDebrid link:',
    file.link
  );

  return res.json({
    streams: [
      {
        id: id,

        title: cleanTitle(file.name),

        name: 'AllDebrid',

        description:
          'Streamed directly using the link returned by AllDebrid',

        thumbnail: ufcLogo,

        url: file.link,

        behaviorHints: {
          notWebReady: false,

          bingeGroup:
            'alldebrid-ufc-' +
            parsed.magnetId
        }
      }
    ]
  });
}


/*
 * Diagnostic endpoint.
 *
 * This directly tests the AllDebrid API and returns:
 * - HTTP status
 * - content type
 * - response body
 * - whether the API key is present
 *
 * The API key itself is NEVER returned.
 */
```javascript
async function handleTestAllDebrid(res) {
  try {
    if (!ALLDEBRID_API_KEY) {
      return res.status(200).json({
        success: false,
        apiKey: 'NOT SET',
        error: 'ALLDEBRID_API_KEY is not configured in Vercel.'
      });
    }

    const body = new URLSearchParams();
    body.append('status', 'ready');

    let response;

    try {
      response = await fetch(
        ALLDEBRID_STATUS_URL,
        {
          method: 'POST',
          headers: {
            Authorization:
              'Bearer ' + ALLDEBRID_API_KEY,

            'Content-Type':
              'application/x-www-form-urlencoded',

            Accept:
              'application/json'
          },
          body: body.toString()
        }
      );
    } catch (fetchError) {
      return res.status(200).json({
        success: false,
        apiKey: 'SET',
        stage: 'FETCH',
        error: fetchError.message
      });
    }

    let responseText = '';

    try {
      responseText = await response.text();
    } catch (textError) {
      return res.status(200).json({
        success: false,
        apiKey: 'SET',
        stage: 'READ_RESPONSE',
        httpStatus: response.status,
        error: textError.message
      });
    }

    let json = null;

    try {
      json = JSON.parse(responseText);
    } catch (_) {
      json = null;
    }

    return res.status(200).json({
      success:
        response.ok &&
        json !== null &&
        json.status === 'success',

      apiKey: 'SET',

      httpStatus:
        response.status,

      responseIsJson:
        json !== null,

      responseBody:
        json !== null
          ? json
          : responseText.substring(0, 2000)
    });

  } catch (error) {
    console.error(
      'AllDebrid diagnostic error:',
      error
    );

    return res.status(200).json({
      success: false,
      apiKey: 'SET',
      stage: 'DIAGNOSTIC',
      error: error.message
    });
  }
}
```
function diagnoseAllDebridResponse(
  httpStatus,
  json,
  text
) {
  if (
    json &&
    json.status === 'success'
  ) {
    return 'AllDebrid API authentication and request are working.';
  }

  if (
    json &&
    json.error
  ) {
    return {
      type: 'ALLDEBRID_API_ERROR',
      code:
        json.error.code || null,
      message:
        json.error.message || null
    };
  }

  if (httpStatus === 401) {
    return 'AllDebrid rejected the authentication credentials with HTTP 401.';
  }

  if (httpStatus === 403) {
    return (
      'AllDebrid rejected the request with HTTP 403. ' +
      'The response body above should reveal whether this is an IP/API-key/account restriction.'
    );
  }

  if (httpStatus >= 400) {
    return (
      'AllDebrid rejected the request with HTTP ' +
      httpStatus +
      '.'
    );
  }

  if (
    text &&
    text.toLowerCase().includes('cloudflare')
  ) {
    return 'The request appears to be receiving a Cloudflare response rather than the normal AllDebrid API response.';
  }

  return 'Unexpected AllDebrid response. Inspect the response body above.';
}


async function handleTestAllDebridFiles(res) {
  try {
    requireAllDebridKey();

    const magnets =
      await getReadyMagnets();

    if (!magnets.length) {
      return res.status(404).json({
        success: false,
        error:
          'No ready AllDebrid magnets were found.'
      });
    }

    const files =
      await getUfcFiles();

    if (!files.length) {
      return res.status(404).json({
        success: false,
        error:
          'Ready magnets were found, but no UFC video files were found.'
      });
    }

    const file = files[0];

    return res.json({
      success: true,

      filename:
        file.name,

      magnetId:
        file.magnetId,

      path:
        file.path,

      size:
        file.size,

      link:
        file.link,

      linkType:
        file.link
          ? getLinkType(file.link)
          : 'NONE'
    });

  } catch (error) {
    console.error(
      'AllDebrid file test error:',
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message
    });
  }
}


function getLinkType(link) {
  const value =
    String(link).toLowerCase();

  if (value.includes('/dl/')) {
    return 'DIRECT_DEBRID_DOWNLOAD';
  }

  if (
    value.includes(
      'alldebrid.com/f/'
    )
  ) {
    return 'ALLDEBRID_FILE_PAGE';
  }

  if (
    value.includes(
      'alldebrid.com'
    )
  ) {
    return 'ALLDEBRID_URL';
  }

  return 'OTHER';
}


async function getUfcFiles() {
  requireAllDebridKey();

  const magnets =
    await getReadyMagnets();

  if (!magnets.length) {
    return [];
  }

  const results = [];

  for (
    let i = 0;
    i < magnets.length;
    i += 20
  ) {
    const batch =
      magnets.slice(
        i,
        i + 20
      );

    const data =
      await allDebridRequest(
        ALLDEBRID_FILES_URL,
        {
          id:
            batch.map(function(m) {
              return m.id;
            })
        }
      );

    const returnedMagnets =
      normaliseArray(
        data &&
        data.data &&
        data.data.magnets
      );

    for (
      const magnet
      of returnedMagnets
    ) {
      const sourceMagnet =
        magnets.find(function(m) {
          return String(m.id) ===
            String(magnet.id);
        });

      const files =
        flattenFiles(
          magnet.files || [],
          ''
        );

      for (
        const file
        of files
      ) {
        if (!file.name) {
          continue;
        }

        if (
          !UFC_TERMS.test(
            file.name
          )
        ) {
          continue;
        }

        if (
          !VIDEO_EXTENSIONS.test(
            file.name
          )
        ) {
          continue;
        }

        results.push({
          id:
            makeFileId(
              magnet.id,
              file.path
            ),

          name:
            file.name,

          path:
            file.path,

          link:
            file.link,

          size:
            file.size,

          magnetId:
            magnet.id,

          completionDate:
            sourceMagnet &&
            sourceMagnet.completionDate
              ? sourceMagnet.completionDate
              : 0
        });
      }
    }
  }

  results.sort(
    function(a, b) {
      return Number(
        b.completionDate
      ) -
      Number(
        a.completionDate
      );
    }
  );

  return results;
}


async function getReadyMagnets() {
  const data =
    await allDebridRequest(
      ALLDEBRID_STATUS_URL,
      {
        status: 'ready'
      }
    );

  const magnets =
    normaliseArray(
      data &&
      data.data &&
      data.data.magnets
    );

  return magnets.filter(
    function(m) {
      return (
        m &&
        m.id &&
        Number(m.statusCode) === 4
      );
    }
  );
}


async function findFile(
  magnetId,
  wantedPath
) {
  requireAllDebridKey();

  const data =
    await allDebridRequest(
      ALLDEBRID_FILES_URL,
      {
        id: [
          Number(magnetId)
        ]
      }
    );

  const magnets =
    normaliseArray(
      data &&
      data.data &&
      data.data.magnets
    );

  const magnet =
    magnets.find(
      function(m) {
        return String(m.id) ===
          String(magnetId);
      }
    );

  if (!magnet) {
    return null;
  }

  const files =
    flattenFiles(
      magnet.files || [],
      ''
    );

  return files.find(
    function(file) {
      return file.path ===
        wantedPath;
    }
  ) || null;
}


function normaliseArray(
  value
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    return Object.values(value);
  }

  return [];
}


function flattenFiles(
  entries,
  parentPath
) {
  const output = [];

  for (
    const entry
    of Array.isArray(entries)
      ? entries
      : []
  ) {
    if (
      !entry ||
      !entry.n
    ) {
      continue;
    }

    const currentPath =
      parentPath
        ? parentPath + '/' + entry.n
        : entry.n;

    if (
      Array.isArray(entry.e)
    ) {
      output.push(
        ...flattenFiles(
          entry.e,
          currentPath
        )
      );
    } else {
      output.push({
        name:
          entry.n,

        path:
          currentPath,

        link:
          entry.l ||
          entry.link ||
          null,

        size:
          entry.s ||
          entry.size ||
          0
      });
    }
  }

  return output;
}


async function allDebridRequest(
  url,
  fields
) {
  const body =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(
      fields || {}
    )
  ) {
    if (
      Array.isArray(value)
    ) {
      for (
        const item
        of value
      ) {
        body.append(
          key + '[]',
          String(item)
        );
      }
    } else if (
      value !== undefined &&
      value !== null
    ) {
      body.append(
        key,
        String(value)
      );
    }
  }

  const response =
    await fetch(
      url,
      {
        method: 'POST',

        headers: {
          Authorization:
            'Bearer ' +
            ALLDEBRID_API_KEY,

          'Content-Type':
            'application/x-www-form-urlencoded',

          Accept:
            'application/json',

          'User-Agent':
            'Navs-UFC-AllDebrid-Stremio/2.3'
        },

        body:
          body.toString()
      }
    );

  const responseText =
    await response.text();

  let data;

  try {
    data =
      JSON.parse(
        responseText
      );
  } catch (_) {
    throw new Error(
      'AllDebrid returned a non-JSON response (' +
      response.status +
      '). Body: ' +
      responseText.substring(0, 500)
    );
  }

  if (
    !response.ok ||
    data.status !== 'success'
  ) {
    let message;

    if (
      data &&
      data.error &&
      data.error.message
    ) {
      message =
        data.error.message;
    } else {
      message =
        'AllDebrid API returned HTTP ' +
        response.status;
    }

    throw new Error(
      message
    );
  }

  return data;
}


function handleDebugEnv(res) {
  return res.json({
    ALLDEBRID_API_KEY:
      ALLDEBRID_API_KEY
        ? 'SET'
        : 'NOT SET',

    TMDB_API_KEY:
      TMDB_API_KEY
        ? 'SET'
        : 'NOT SET',

    NODE_ENV:
      process.env.NODE_ENV ||
      'development',

    timestamp:
      new Date().toISOString()
  });
}


function requireAllDebridKey() {
  if (!ALLDEBRID_API_KEY) {
    throw new Error(
      'ALLDEBRID_API_KEY is not configured in Vercel.'
    );
  }
}


function makeFileId(
  magnetId,
  filePath
) {
  return (
    'ad_' +
    magnetId +
    '_' +
    base64UrlEncode(
      filePath
    )
  );
}


function parseFileId(
  id
) {
  const match =
    String(id).match(
      /^ad_(\d+)_(.+)$/
    );

  if (!match) {
    return null;
  }

  try {
    return {
      magnetId:
        match[1],

      filePath:
        base64UrlDecode(
          match[2]
        )
    };
  } catch (_) {
    return null;
  }
}


function base64UrlEncode(
  value
) {
  return Buffer
    .from(
      value,
      'utf8'
    )
    .toString('base64')
    .replace(
      /\+/g,
      '-'
    )
    .replace(
      /\//g,
      '_'
    )
    .replace(
      /=+$/g,
      ''
    );
}


function base64UrlDecode(
  value
) {
  const padded =
    value
      .replace(
        /-/g,
        '+'
      )
      .replace(
        /_/g,
        '/'
      ) +
    '='.repeat(
      (
        4 -
        (
          value.length % 4
        )
      ) % 4
    );

  return Buffer
    .from(
      padded,
      'base64'
    )
    .toString(
      'utf8'
    );
}


function cleanTitle(
  name
) {
  if (!name) {
    return 'UFC Fight';
  }

  return String(name)
    .replace(
      /\.[^.]+$/,
      ''
    )
    .replace(
      /[._]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function extractYear(
  name
) {
  if (!name) {
    return null;
  }

  const match =
    String(name).match(
      /\b(19|20)\d{2}\b/
    );

  return match
    ? Number(match[0])
    : null;
}
```
