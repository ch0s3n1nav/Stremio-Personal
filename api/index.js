```javascript
const { ALLDEBRID_API_KEY, TMDB_API_KEY } = process.env;

const ALLDEBRID_STATUS_URL =
  'https://api.alldebrid.com/v4.1/magnet/status';

const ALLDEBRID_FILES_URL =
  'https://api.alldebrid.com/v4/magnet/files';

const ALLDEBRID_SERVICE_URL =
  'https://alldebrid.com/service.php';

const ufcLogo =
  'https://i.ibb.co/ds3h2ZSS/UFC-LOGO.png';

const ufcBackground =
  'https://i.ibb.co/LD6y2trs/UFC-Nav-Portrait.jpg';

const VIDEO_EXTENSIONS =
  /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|vob|iso|m2ts)$/i;

const UFC_TERMS =
  /(\bUFC\b|\bMMA\b|Ultimate[ ._-]?Fighting[ ._-]?Championship|Fight[ ._-]?Night)/i;


module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const baseUrl =
    'http://' + (req.headers.host || 'localhost');

  const parsedUrl = new URL(req.url, baseUrl);

  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

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

    const catalogMatch =
      pathname.match(/^\/catalog\/movie\/([^/]+)\.json$/);

    if (catalogMatch) {
      return await handleCatalog(
        req,
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
  res.setHeader(
    'Content-Type',
    'application/json'
  );

  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );
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
      testAllDebridService:
        '/test-alldebrid-service'
    }
  });
}


function handleManifest(res) {
  return res.json({
    id: 'com.stremio.navsufcalldebrid',

    version: '2.1.1',

    name: "Nav's UFC AllDebrid",

    description:
      'Shows UFC fights stored in your AllDebrid cloud and streams them directly in Stremio.',

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

    idPrefixes: ['ad_'],

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
      'No configuration is required. This addon uses the AllDebrid API key stored securely in Vercel.',

    logo: ufcLogo,

    background: ufcBackground,

    types: ['movie'],

    settings: []
  });
}


async function handleCatalog(
  req,
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

  const files =
    await getUfcFiles();

  let filtered = files;

  if (search) {
    filtered =
      files.filter(item =>
        item.name
          .toLowerCase()
          .includes(search)
      );
  }

  filtered =
    filtered.slice(0, 100);

  const metas =
    filtered.map(item => ({
      id: item.id,

      type: 'movie',

      name: cleanTitle(item.name),

      poster: ufcLogo,

      posterShape: 'regular',

      background: ufcBackground,

      description:
        `UFC fight stored in AllDebrid: ${cleanTitle(item.name)}`,

      releaseInfo:
        extractYear(item.name) || undefined,

      genres: [
        'UFC',
        'MMA',
        'Fighting',
        'Sports'
      ]
    }));

  return res.json({
    metas
  });
}


async function handleMeta(res, id) {
  const parsed =
    parseFileId(id);

  if (!parsed) {
    return res.status(400).json({
      error:
        'Invalid AllDebrid file ID'
    });
  }

  const file =
    await findFile(
      parsed.magnetId,
      parsed.filePath
    );

  if (!file) {
    return res.status(404).json({
      error:
        'File not found in AllDebrid'
    });
  }

  const title =
    cleanTitle(file.name);

  return res.json({
    meta: {
      id,

      type: 'movie',

      name: title,

      poster: ufcLogo,

      posterShape: 'regular',

      description:
        `UFC fight stored in your AllDebrid cloud: ${title}`,

      background: ufcBackground,

      genres: [
        'UFC',
        'MMA',
        'Fighting',
        'Sports'
      ],

      runtime: '180 min',

      year:
        extractYear(file.name) ||
        undefined
    }
  });
}


/*
 * STREAM HANDLER
 *
 * 1. Decode the Stremio file ID.
 * 2. Find the actual file in AllDebrid.
 * 3. Take its private AllDebrid /f/ link.
 * 4. Send that link to AllDebrid service.php.
 * 5. service.php generates a fresh /dl/ URL.
 * 6. Give that URL to Stremio.
 */

async function handleStream(res, id) {
  const parsed =
    parseFileId(id);

  if (!parsed) {
    return res.status(400).json({
      streams: [],

      error:
        'Invalid AllDebrid file ID'
    });
  }

  const file =
    await findFile(
      parsed.magnetId,
      parsed.filePath
    );

  if (!file || !file.link) {
    return res.status(404).json({
      streams: [],

      error:
        'AllDebrid private file link not found'
    });
  }

  console.log(
    'Generating AllDebrid stream link for:',
    file.name
  );

  console.log(
    'AllDebrid private file:',
    file.link
  );

  const directUrl =
    await generateAllDebridServiceLink(
      file.link
    );

  if (!directUrl) {
    return res.status(502).json({
      streams: [],

      error:
        'AllDebrid did not return a playable download link'
    });
  }

  console.log(
    'Generated AllDebrid direct stream:',
    directUrl
  );

  return res.json({
    streams: [
      {
        id,

        title:
          cleanTitle(file.name),

        name:
          'AllDebrid',

        description:
          'Streamed from your AllDebrid cloud',

        thumbnail:
          ufcLogo,

        url:
          directUrl,

        behaviorHints: {
          notWebReady: false,

          bingeGroup:
            `alldebrid-ufc-${parsed.magnetId}`
        }
      }
    ]
  });
}


/*
 * Ask AllDebrid service.php to generate
 * the actual debrid.it/dl/... link.
 */

async function generateAllDebridServiceLink(
  privateFileLink
) {
  const body =
    new URLSearchParams();

  body.append(
    'link',
    privateFileLink
  );

  body.append(
    'nb',
    '0'
  );

  body.append(
    'json',
    'true'
  );

  body.append(
    'pw',
    ''
  );

  const response =
    await fetch(
      ALLDEBRID_SERVICE_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded; charset=UTF-8',

          'X-Requested-With':
            'XMLHttpRequest',

          'Accept':
            '*/*'
        },

        body:
          body.toString()
      }
    );

  const text =
    await response.text();

  console.log(
    'AllDebrid service.php HTTP status:',
    response.status
  );

  console.log(
    'AllDebrid service.php response:',
    text
  );

  if (!response.ok) {
    throw new Error(
      `AllDebrid service.php returned HTTP ${response.status}`
    );
  }

  let data;

  try {
    data =
      JSON.parse(text);
  } catch (error) {
    throw new Error(
      'AllDebrid service.php returned invalid JSON'
    );
  }

  if (data.error) {
    throw new Error(
      `AllDebrid service.php error: ${data.error}`
    );
  }

  if (!data.link) {
    throw new Error(
      'AllDebrid service.php response did not contain a link'
    );
  }

  const directUrl =
    String(data.link)
      .replace(/\\\//g, '/');

  if (
    !/^https?:\/\/[^/]+\/dl\//i
      .test(directUrl)
  ) {
    throw new Error(
      'AllDebrid returned an unexpected link format'
    );
  }

  return directUrl;
}


/*
 * Diagnostic endpoint.
 *
 * Tests service.php from Vercel using
 * the same method that worked in Chrome.
 */

async function handleTestAllDebridService(
  res
) {
  try {
    const testPrivateFile =
      'https://alldebrid.com/f/3TO0YfFNbrSxYR1gubi52XoOhnsH5XzUBfRtzG7LZ1E';

    const directUrl =
      await generateAllDebridServiceLink(
        testPrivateFile
      );

    return res.json({
      success: true,

      privateFile:
        testPrivateFile,

      generatedLink:
        directUrl,

      message:
        'AllDebrid service.php successfully generated a direct link.'
    });

  } catch (error) {
    console.error(
      'AllDebrid service test failed:',
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error.message
    });
  }
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
      magnets.slice(i, i + 20);

    const data =
      await allDebridRequest(
        ALLDEBRID_FILES_URL,
        {
          ids:
            batch.map(
              m => m.id
            )
        }
      );

    const returnedMagnets =
      data?.data?.magnets || [];

    for (
      const magnet of returnedMagnets
    ) {
      const sourceMagnet =
        magnets.find(
          m =>
            String(m.id) ===
            String(magnet.id)
        );

      const files =
        flattenFiles(
          magnet.files || [],
          ''
        );

      for (
        const file of files
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

        if (!file.link) {
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

          magnetId:
            magnet.id,

          completionDate:
            sourceMagnet?.completionDate ||
            0
        });
      }
    }
  }

  results.sort(
    (a, b) =>
      Number(b.completionDate) -
      Number(a.completionDate)
  );

  return results;
}


async function getReadyMagnets() {
  const data =
    await allDebridRequest(
      ALLDEBRID_STATUS_URL,
      {
        status:
          'ready'
      }
    );

  const magnets =
    data?.data?.magnets || [];

  return magnets.filter(
    m =>
      m &&
      m.id &&
      Number(m.statusCode) === 4
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
        ids: [
          Number(magnetId)
        ]
      }
    );

  const magnets =
    data?.data?.magnets || [];

  const magnet =
    magnets.find(
      m =>
        String(m.id) ===
        String(magnetId)
    );

  if (!magnet) {
    return null;
  }

  const files =
    flattenFiles(
      magnet.files || [],
      ''
    );

  return (
    files.find(
      file =>
        file.path ===
        wantedPath
    ) || null
  );
}


function flattenFiles(
  entries,
  parentPath
) {
  const output = [];

  for (
    const entry of
      Array.isArray(entries)
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
        ? `${parentPath}/${entry.n}`
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
    const [key, value] of
      Object.entries(
        fields || {}
      )
  ) {
    if (
      Array.isArray(value)
    ) {
      for (
        const item of value
      ) {
        body.append(
          `${key}[]`,
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
        method:
          'POST',

        headers: {
          Authorization:
            `Bearer ${ALLDEBRID_API_KEY}`,

          'Content-Type':
            'application/x-www-form-urlencoded'
        },

        body:
          body.toString()
      }
    );

  let data;

  try {
    data =
      await response.json();

  } catch (_) {
    throw new Error(
      `AllDebrid returned a non-JSON response (${response.status})`
    );
  }

  if (
    !response.ok ||
    data.status !== 'success'
  ) {
    const message =
      data?.error?.message ||
      `AllDebrid API returned HTTP ${response.status}`;

    throw new Error(
      message
    );
  }

  return data;
}


async function handleTestAllDebrid(
  res
) {
  try {
    requireAllDebridKey();

    const data =
      await allDebridRequest(
        ALLDEBRID_STATUS_URL,
        {
          status:
            'ready'
        }
      );

    const magnets =
      data?.data?.magnets || [];

    return res.json({
      success: true,

      apiKey:
        'SET',

      readyMagnets:
        magnets.length,

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

      error:
        error.message
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
  year = null
) {
  if (!TMDB_API_KEY) {
    return null;
  }

  try {
    let url =
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;

    if (year) {
      url +=
        `&year=${year}`;
    }

    const response =
      await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    return (
      data.results?.[0] ||
      null
    );

  } catch (_) {
    return null;
  }
}


async function handleTestTmdbSimple(
  res
) {
  if (!TMDB_API_KEY) {
    return res.status(500).json({
      error:
        'TMDB_API_KEY not configured'
    });
  }

  try {
    const response =
      await fetch(
        `https://api.themoviedb.org/3/movie/550?api_key=${TMDB_API_KEY}`
      );

    if (!response.ok) {
      throw new Error(
        `TMDB API responded with ${response.status}`
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

      error:
        error.message
    });
  }
}


async function handleTestTmdbDirect(
  res
) {
  if (!TMDB_API_KEY) {
    return res.status(500).json({
      error:
        'TMDB_API_KEY not configured'
    });
  }

  try {
    const response =
      await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=Inception`
      );

    if (!response.ok) {
      throw new Error(
        `TMDB API responded with ${response.status}`
      );
    }

    const data =
      await response.json();

    return res.json({
      success: true,

      resultsCount:
        data.results?.length ||
        0,

      movieTitle:
        data.results?.[0]?.title ||
        'No results'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,

      error:
        error.message
    });
  }
}


async function handleTestTmdbInception(
  res
) {
  if (!TMDB_API_KEY) {
    return res.status(500).json({
      error:
        'TMDB_API_KEY not configured'
    });
  }

  try {
    const response =
      await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=Inception&year=2010`
      );

    if (!response.ok) {
      throw new Error(
        `TMDB API responded with ${response.status}`
      );
    }

    const data =
      await response.json();

    return res.json({
      success: true,

      searchQuery:
        'Inception',

      year:
        2010,

      resultsCount:
        data.results?.length ||
        0,

      results:
        (data.results || [])
          .slice(0, 3)
          .map(r => ({
            title:
              r.title,

            id:
              r.id
          }))
    });

  } catch (error) {
    return res.status(500).json({
      success: false,

      error:
        error.message
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
    `ad_${magnetId}_${base64UrlEncode(filePath)}`
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
      (4 -
        (value.length % 4)) %
        4
    );

  return Buffer
    .from(
      padded,
      'base64'
    )
    .toString('utf8');
}


function cleanTitle(
  filename
) {
  return filename
    .replace(
      VIDEO_EXTENSIONS,
      ''
    )
    .replace(
      /[_\.]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function extractYear(
  value
) {
  const match =
    String(value).match(
      /\b(19|20)\d{2}\b/
    );

  return match
    ? match[0]
    : null;
}
```
