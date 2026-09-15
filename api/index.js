const { ALLDEBRID_API_KEY, TMDB_API_KEY } = process.env;

const ALLDEBRID_STATUS_URL = 'https://api.alldebrid.com/v4.1/magnet/status';
const ALLDEBRID_FILES_URL = 'https://api.alldebrid.com/v4/magnet/files';
const ALLDEBRID_SERVICE_URL = 'https://alldebrid.com/service.php';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const ufcLogo = 'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png';
const ufcBackground = 'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg';

const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i;
const UFC_TERMS = /(\bUFC\b|\bMMA\b|Ultimate[ ._-]?Fighting[ ._-]?Championship|Fight[ ._-]?Night)/i;

module.exports = async (req, res) => {
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

    if (pathname === '/test-alldebrid-service') {
      return await handleTestAllDebridService(res);
    }

    if (pathname === '/test-tmdb-simple') {
      return await handleTestTmdbSimple(res);
    }

    if (pathname === '/test-tmdb-direct') {
      return await handleTestTmdbDirect(res);
    }

    if (pathname === '/test-tmdb-inception') {
      return await handleTestTmdbInception(res);
    }

    const catalogMatch = pathname.match(/^\/catalog\/movie\/([^/]+)\.json$/);

    if (catalogMatch) {
      return await handleCatalog(
        req,
        res,
        catalogMatch[1],
        searchParams
      );
    }

    const metaMatch = pathname.match(/^\/meta\/movie\/(.+)\.json$/);

    if (metaMatch) {
      return await handleMeta(
        res,
        decodeURIComponent(metaMatch[1])
      );
    }

    const streamMatch = pathname.match(/^\/stream\/movie\/(.+)\.json$/);

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
      testAllDebridService: '/test-alldebrid-service'
    }
  });
}


function handleManifest(res) {
  return res.json({
    id: 'com.stremio.navsufcalldebrid',
    version: '2.1.4',
    name: "Nav's UFC AllDebrid",
    description: 'Shows UFC fights stored in your AllDebrid cloud and streams them directly in Stremio.',
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
    description: 'No configuration is required. This addon uses the AllDebrid API key stored securely in Vercel.',
    logo: ufcLogo,
    background: ufcBackground,
    types: ['movie'],
    settings: []
  });
}


async function handleCatalog(req, res, catalogType, searchParams) {
  if (catalogType !== 'ufc-events') {
    return res.status(404).json({
      metas: []
    });
  }

  const search = (
    searchParams.get('search') || ''
  ).trim().toLowerCase();

  const files = await getUfcFiles();

  let filtered = files;

  if (search) {
    filtered = files.filter(function(item) {
      return item.name.toLowerCase().includes(search);
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
      description: 'UFC fight stored in AllDebrid: ' + title,
      releaseInfo: extractYear(item.name) || undefined,
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


async function handleMeta(res, id) {
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
      description: 'UFC fight stored in your AllDebrid cloud: ' + title,
      background: ufcBackground,
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


async function handleStream(res, id) {
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

  if (!file || !file.link) {
    return res.status(404).json({
      streams: [],
      error: 'AllDebrid file link not found'
    });
  }

  console.log(
    'Generating AllDebrid service link for:',
    file.name
  );

  let directLink;

  try {
    directLink = await generateAllDebridServiceLink(
      file.link
    );
  } catch (error) {
    console.error(
      'AllDebrid service.php error:',
      error
    );

    return res.status(500).json({
      streams: [],
      error: 'Could not generate AllDebrid download link',
      message: error.message
    });
  }

  if (!directLink) {
    return res.status(500).json({
      streams: [],
      error: 'AllDebrid did not return a download link'
    });
  }

  return res.json({
    streams: [
      {
        id: id,
        title: cleanTitle(file.name),
        name: 'AllDebrid',
        description: 'Streamed from your AllDebrid cloud',
        thumbnail: ufcLogo,
        url: directLink,

        behaviorHints: {
          notWebReady: false,
          bingeGroup: 'alldebrid-ufc-' + parsed.magnetId
        }
      }
    ]
  });
}


/*
 * This is the important part.
 *
 * AllDebrid's website service.php can generate a direct
 * debrid.it download URL from an AllDebrid /f/ file URL.
 *
 * We are using the GET format used by older working
 * AllDebrid integrations:
 *
 * service.php?link=...&nb=0&json=true&pw=
 */
async function generateAllDebridServiceLink(fileLink) {
  if (!fileLink) {
    throw new Error('No AllDebrid file link supplied');
  }

  const serviceUrl = new URL(
    ALLDEBRID_SERVICE_URL
  );

  serviceUrl.searchParams.set(
    'link',
    fileLink
  );

  serviceUrl.searchParams.set(
    'nb',
    '0'
  );

  serviceUrl.searchParams.set(
    'json',
    'true'
  );

  serviceUrl.searchParams.set(
    'pw',
    ''
  );

  console.log(
    'Calling AllDebrid service.php using GET'
  );

  const response = await fetch(
    serviceUrl.toString(),
    {
      method: 'GET',

      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0'
      }
    }
  );

  const text = await response.text();

  console.log(
    'AllDebrid service.php HTTP status:',
    response.status
  );

  console.log(
    'AllDebrid service.php response preview:',
    text.substring(0, 500)
  );

  if (!response.ok) {
    throw new Error(
      'AllDebrid service.php returned HTTP ' +
      response.status
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error(
      'AllDebrid service.php returned a non-JSON response (' +
      response.status +
      '). Response started with: ' +
      text.substring(0, 200)
    );
  }

  if (!data) {
    throw new Error(
      'AllDebrid service.php returned an empty response'
    );
  }

  if (data.error) {
    throw new Error(
      'AllDebrid service.php error: ' +
      data.error
    );
  }

  if (!data.link) {
    throw new Error(
      'AllDebrid service.php returned JSON but no download link'
    );
  }

  const directLink = String(
    data.link
  ).replace(/\\\//g, '/');

  if (
    directLink.indexOf('debrid.it/dl/') === -1 &&
    directLink.indexOf('/dl/') === -1
  ) {
    throw new Error(
      'AllDebrid returned an unexpected link: ' +
      directLink
    );
  }

  return directLink;
}


/*
 * Test endpoint for service.php.
 *
 * This uses the first UFC video file found in the
 * AllDebrid account and attempts to generate a direct
 * download URL.
 */
async function handleTestAllDebridService(res) {
  try {
    requireAllDebridKey();

    const files = await getUfcFiles();

    if (!files.length) {
      return res.status(404).json({
        success: false,
        error: 'No UFC video files were found in AllDebrid.'
      });
    }

    const file = files[0];

    if (!file.link) {
      return res.status(404).json({
        success: false,
        error: 'The UFC file was found but it has no AllDebrid file link.'
      });
    }

    const directLink =
      await generateAllDebridServiceLink(
        file.link
      );

    return res.json({
      success: true,
      filename: file.name,
      allDebridFileLink: file.link,
      directLink: directLink
    });

  } catch (error) {
    console.error(
      'Test AllDebrid service error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


async function getUfcFiles() {
  requireAllDebridKey();

  const magnets = await getReadyMagnets();

  if (!magnets.length) {
    return [];
  }

  const results = [];

  /*
   * IMPORTANT:
   * AllDebrid expects the parameter as id[].
   * Our allDebridRequest function creates id[]
   * when the property is called "id".
   *
   * Do NOT change this to "ids".
   */
  for (let i = 0; i < magnets.length; i += 20) {
    const batch = magnets.slice(
      i,
      i + 20
    );

    const data = await allDebridRequest(
      ALLDEBRID_FILES_URL,
      {
        id: batch.map(function(m) {
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

    for (const magnet of returnedMagnets) {
      const sourceMagnet = magnets.find(
        function(m) {
          return String(m.id) === String(magnet.id);
        }
      );

      const files = flattenFiles(
        magnet.files || [],
        ''
      );

      for (const file of files) {
        if (!file.name) {
          continue;
        }

        if (!UFC_TERMS.test(file.name)) {
          continue;
        }

        if (!VIDEO_EXTENSIONS.test(file.name)) {
          continue;
        }

        if (!file.link) {
          continue;
        }

        results.push({
          id: makeFileId(
            magnet.id,
            file.path
          ),

          name: file.name,
          path: file.path,
          link: file.link,
          magnetId: magnet.id,

          completionDate:
            sourceMagnet &&
            sourceMagnet.completionDate
              ? sourceMagnet.completionDate
              : 0
        });
      }
    }
  }

  results.sort(function(a, b) {
    return Number(b.completionDate) -
      Number(a.completionDate);
  });

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

  return magnets.filter(function(m) {
    return (
      m &&
      m.id &&
      Number(m.statusCode) === 4
    );
  });
}


async function findFile(
  magnetId,
  wantedPath
) {
  requireAllDebridKey();

  /*
   * IMPORTANT:
   * The AllDebrid API parameter is id[],
   * not ids[].
   */
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
    magnets.find(function(m) {
      return String(m.id) ===
        String(magnetId);
    });

  if (!magnet) {
    return null;
  }

  const files = flattenFiles(
    magnet.files || [],
    ''
  );

  return files.find(function(file) {
    return file.path === wantedPath;
  }) || null;
}


function normaliseArray(value) {
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
    const entry of Array.isArray(entries)
      ? entries
      : []
  ) {
    if (!entry || !entry.n) {
      continue;
    }

    const currentPath =
      parentPath
        ? parentPath + '/' + entry.n
        : entry.n;

    if (Array.isArray(entry.e)) {
      output.push(
        ...flattenFiles(
          entry.e,
          currentPath
        )
      );
    } else {
      output.push({
        name: entry.n,
        path: currentPath,
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
    of Object.entries(fields || {})
  ) {
    if (Array.isArray(value)) {
      for (
        const item of value
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
            'application/x-www-form-urlencoded'
        },

        body:
          body.toString()
      }
    );

  let data;

  try {
    data = await response.json();
  } catch (_) {
    throw new Error(
      'AllDebrid returned a non-JSON response (' +
      response.status +
      ')'
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

    throw new Error(message);
  }

  return data;
}


async function handleTestAllDebrid(res) {
  try {
    requireAllDebridKey();

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

    return res.json({
      success: true,
      apiKey: 'SET',
      readyMagnets: magnets.length,
      message:
        'AllDebrid connection is working.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      apiKey:
        ALLDEBRID_API_KEY
          ? 'SET'
          : 'NOT SET',
      error: error.message
    });
  }
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


async function searchTMDB(
  title,
  year
) {
  if (!TMDB_API_KEY) {
    return null;
  }

  try {
    let url =
      'https://api.themoviedb.org/3/search/movie' +
      '?api_key=' +
      TMDB_API_KEY +
      '&query=' +
      encodeURIComponent(title);

    if (year) {
      url += '&year=' + year;
    }

    const response =
      await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    return (
      data.results &&
      data.results[0]
    ) || null;

  } catch (_) {
    return null;
  }
}


async function handleTestTmdbSimple(res) {
  if (!TMDB_API_KEY) {
    return res.status(500).json({
      error:
        'TMDB_API_KEY not configured'
    });
  }

  try {
    const response =
      await fetch(
        'https://api.themoviedb.org/3/movie/550' +
        '?api_key=' +
        TMDB_API_KEY
      );

    if (!response.ok) {
      throw new Error(
        'TMDB API responded with ' +
        response.status
      );
    }

    const data =
      await response.json();

    return res.json({
      success: true,
      movieTitle:
        data.title ||
        'Unknown'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


async function handleTestTmdbDirect(res) {
  if (!TMDB_API_KEY) {
    return res.status(500).json({
      error:
        'TMDB_API_KEY not configured'
    });
  }

  try {
    const response =
      await fetch(
        'https://api.themoviedb.org/3/search/movie' +
        '?api_key=' +
        TMDB_API_KEY +
        '&query=Inception'
      );

    if (!response.ok) {
      throw new Error(
        'TMDB API responded with ' +
        response.status
      );
    }

    const data =
      await response.json();

    return res.json({
      success: true,
      resultsCount:
        data.results
          ? data.results.length
          : 0,

      movieTitle:
        data.results &&
        data.results[0]
          ? data.results[0].title
          : 'No results'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


async function handleTestTmdbInception(res) {
  if (!TMDB_API_KEY) {
    return res.status(500).json({
      error:
        'TMDB_API_KEY not configured'
    });
  }

  try {
    const response =
      await fetch(
        'https://api.themoviedb.org/3/search/movie' +
        '?api_key=' +
        TMDB_API_KEY +
        '&query=Inception' +
        '&year=2010'
      );

    if (!response.ok) {
      throw new Error(
        'TMDB API responded with ' +
        response.status
      );
    }

    const data =
      await response.json();

    return res.json({
      success: true,

      searchQuery:
        'Inception',

      year: 2010,

      resultsCount:
        data.results
          ? data.results.length
          : 0,

      results:
        (data.results || [])
          .slice(0, 3)
          .map(function(r) {
            return {
              title: r.title,
              id: r.id
            };
          })
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
    base64UrlEncode(filePath)
  );
}


function parseFileId(id) {
  const match =
    String(id).match(
      /^ad_(\d+)_(.+)$/
    );

  if (!match) {
    return null;
  }

  try {
    return {
      magnetId: match[1],
      filePath:
        base64UrlDecode(
          match[2]
        )
    };

  } catch (_) {
    return null;
  }
}


function base64UrlEncode(value) {
  return Buffer
    .from(
      value,
      'utf8'
    )
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}


function base64UrlDecode(value) {
  const padded =
    value.replace(
      /-/g,
      '+'
    ).replace(
      /_/g,
      '/'
    ) +
    '='.repeat(
      (4 - (value.length % 4)) % 4
    );

  return Buffer
    .from(
      padded,
      'base64'
    )
    .toString('utf8');
}


function cleanTitle(name) {
  if (!name) {
    return 'UFC Fight';
  }

  return String(name)
    .replace(/\.[^.]+$/, '')
    .replace(/[._]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function extractYear(name) {
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
