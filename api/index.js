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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const host = req.headers.host || 'localhost';
  const requestUrl = 'http://' + host + (req.url || '/');
  const url = new URL(requestUrl);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

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
      return handleTestAllDebrid(res);
    }

    if (pathname === '/debug-alldebrid-connection') {
      return handleDebugAllDebridConnection(res);
    }

    if (pathname === '/debug-alldebrid-files') {
      return handleDebugAllDebridFiles(res);
    }

    if (pathname === '/test-alldebrid-files') {
      return handleTestAllDebridFiles(res);
    }

    const catalogMatch = pathname.match(/^\/catalog\/movie\/([^/]+)\.json$/);

    if (catalogMatch) {
      return await handleCatalog(
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
      debugAllDebridConnection: '/debug-alldebrid-connection',
      debugAllDebridFiles: '/debug-alldebrid-files',
      testAllDebridFiles: '/test-alldebrid-files'
    }
  });
}

function handleManifest(res) {
  return res.json({
    id: 'com.stremio.navsufcalldebrid',
    version: '3.2.0',
    name: "Nav's UFC AllDebrid",
    description: 'Shows UFC fights stored in your AllDebrid cloud and streams them directly in Stremio.',
    logo: UFC_LOGO,
    background: UFC_BACKGROUND,
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
    logo: UFC_LOGO,
    background: UFC_BACKGROUND,
    types: [
      'movie'
    ],
    settings: []
  });
}

function handleDebugEnv(res) {
  return res.json({
    ALLDEBRID_API_KEY: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
    TMDB_API_KEY: TMDB_API_KEY ? 'SET' : 'NOT SET',
    node: process.version,
    timestamp: new Date().toISOString()
  });
}

async function handleTestAllDebrid(res) {
  try {
    requireKey();

    const data = await allDebridRequest(
      STATUS_URL,
      {
        status: 'ready'
      }
    );

    const magnets = getMagnetsFromResponse(data);

    return res.status(200).json({
      success: true,
      apiKey: 'SET',
      readyMagnets: magnets.length,
      sampleMagnets: magnets
        .slice(0, 10)
        .map(summarizeMagnet)
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      apiKey: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
      error: error.message
    });
  }
}

async function handleDebugAllDebridConnection(res) {
  const result = {
    success: true,
    apiKey: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    const pingUrl = 'https://api.alldebrid.com/v4/ping';

    const response = await fetch(
      pingUrl,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Navs-UFC-AllDebrid/3.2'
        }
      }
    );

    const text = await response.text();

    result.tests.unauthenticatedPing = {
      url: pingUrl,
      method: 'GET',
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      server: response.headers.get('server'),
      cfRay: response.headers.get('cf-ray'),
      cfCacheStatus: response.headers.get('cf-cache-status'),
      responseStart: text.slice(0, 300)
    };

  } catch (error) {
    result.tests.unauthenticatedPing = {
      error: error.message
    };
  }

  try {
    requireKey();

    const response = await fetch(
      STATUS_URL,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + ALLDEBRID_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'Navs-UFC-AllDebrid/3.2'
        },
        body: 'status=ready'
      }
    );

    const text = await response.text();

    let parsed = null;

    try {
      parsed = JSON.parse(text);
    } catch (_) {
      parsed = null;
    }

    result.tests.authenticatedStatus = {
      url: STATUS_URL,
      method: 'POST',
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      server: response.headers.get('server'),
      cfRay: response.headers.get('cf-ray'),
      cfCacheStatus: response.headers.get('cf-cache-status'),
      responseJsonStatus: parsed && parsed.status ? parsed.status : null,
      responseError: parsed && parsed.error
        ? {
            code: parsed.error.code || null,
            message: parsed.error.message || null
          }
        : null,
      responseStart: text.slice(0, 300)
    };

  } catch (error) {
    result.tests.authenticatedStatus = {
      error: error.message
    };
  }

  return res.status(200).json(result);
}

async function handleDebugAllDebridFiles(res) {
  try {
    requireKey();

    const statusData = await allDebridRequest(
      STATUS_URL,
      {
        status: 'ready'
      }
    );

    const magnets = getReadyMagnets(statusData);

    if (!magnets.length) {
      return res.status(200).json({
        success: true,
        readyMagnetCount: 0,
        message: 'No Ready magnets were returned by AllDebrid.'
      });
    }

    const magnet = magnets[0];
    const magnetId = magnet.id;

    const tests = [];

    tests.push(
      await testFilesRequest(
        'POST_id_array',
        'POST',
        magnetId,
        'array'
      )
    );

    tests.push(
      await testFilesRequest(
        'POST_id_single',
        'POST',
        magnetId,
        'single'
      )
    );

    tests.push(
      await testFilesRequest(
        'GET_id_array',
        'GET',
        magnetId,
        'array'
      )
    );

    tests.push(
      await testFilesRequest(
        'GET_id_single',
        'GET',
        magnetId,
        'single'
      )
    );

    return res.status(200).json({
      success: true,
      readyMagnetCount: magnets.length,
      testedMagnet: summarizeMagnet(magnet),
      tests: tests
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      apiKey: ALLDEBRID_API_KEY ? 'SET' : 'NOT SET',
      error: error.message
    });
  }
}

async function testFilesRequest(
  testName,
  method,
  magnetId,
  parameterMode
) {
  requireKey();

  let requestUrl = FILES_URL;
  let body = null;

  if (method === 'POST') {
    const params = new URLSearchParams();

    if (parameterMode === 'array') {
      params.append(
        'id[]',
        String(magnetId)
      );
    } else {
      params.append(
        'id',
        String(magnetId)
      );
    }

    body = params.toString();

  } else {
    const parameterName =
      parameterMode === 'array'
        ? 'id[]'
        : 'id';

    requestUrl =
      FILES_URL +
      '?' +
      encodeURIComponent(parameterName) +
      '=' +
      encodeURIComponent(String(magnetId));
  }

  try {
    const response = await fetch(
      requestUrl,
      {
        method: method,
        headers: {
          Authorization: 'Bearer ' + ALLDEBRID_API_KEY,
          Accept: 'application/json',
          'User-Agent': 'Navs-UFC-AllDebrid/3.2',
          ...(method === 'POST'
            ? {
                'Content-Type':
                  'application/x-www-form-urlencoded'
              }
            : {})
        },
        body: body
      }
    );

    const text = await response.text();

    let parsed = null;

    try {
      parsed = JSON.parse(text);
    } catch (_) {
      parsed = null;
    }

    const result = {
      test: testName,
      method: method,
      parameterMode: parameterMode,
      url: FILES_URL,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      server: response.headers.get('server'),
      cfRay: response.headers.get('cf-ray'),
      cfCacheStatus: response.headers.get('cf-cache-status'),
      responseJsonStatus:
        parsed && parsed.status
          ? parsed.status
          : null,
      responseError:
        parsed && parsed.error
          ? {
              code: parsed.error.code || null,
              message: parsed.error.message || null
            }
          : null,
      responseDataKeys:
        parsed && parsed.data && typeof parsed.data === 'object'
          ? Object.keys(parsed.data).slice(0, 30)
          : [],
      responseStart:
        text.slice(0, 500)
    };

    if (
      parsed &&
      parsed.status === 'success'
    ) {
      result.parsedStructure =
        summarizeFileResponse(parsed);
    }

    return result;

  } catch (error) {
    return {
      test: testName,
      method: method,
      parameterMode: parameterMode,
      url: FILES_URL,
      error: error.message
    };
  }
}

function summarizeFileResponse(data) {
  const result = {
    topLevelKeys: Object.keys(data || {}),
    dataKeys: [],
    magnetsType: null,
    magnetsCount: 0,
    firstMagnet: null
  };

  if (
    data &&
    data.data &&
    typeof data.data === 'object'
  ) {
    result.dataKeys =
      Object.keys(data.data).slice(0, 30);

    const magnets =
      data.data.magnets;

    if (Array.isArray(magnets)) {
      result.magnetsType = 'array';
      result.magnetsCount = magnets.length;

      if (magnets.length) {
        result.firstMagnet =
          summarizeFileMagnet(
            magnets[0]
          );
      }

    } else if (
      magnets &&
      typeof magnets === 'object'
    ) {
      result.magnetsType = 'object';
      result.magnetsCount =
        Object.keys(magnets).length;

      const firstKey =
        Object.keys(magnets)[0];

      if (firstKey) {
        result.firstMagnet =
          summarizeFileMagnet(
            magnets[firstKey]
          );
      }
    }
  }

  return result;
}

function summarizeFileMagnet(magnet) {
  if (!magnet || typeof magnet !== 'object') {
    return {
      type: typeof magnet
    };
  }

  const result = {
    keys: Object.keys(magnet).slice(0, 50)
  };

  if (magnet.id !== undefined) {
    result.id = magnet.id;
  }

  if (magnet.filename) {
    result.filename = magnet.filename;
  }

  if (magnet.name) {
    result.name = magnet.name;
  }

  if (Array.isArray(magnet.files)) {
    result.filesType = 'array';
    result.filesCount = magnet.files.length;

    if (magnet.files.length) {
      result.firstFile =
        summarizeFileEntry(
          magnet.files[0]
        );
    }
  }

  if (Array.isArray(magnet.links)) {
    result.linksType = 'array';
    result.linksCount = magnet.links.length;

    if (magnet.links.length) {
      result.firstLink =
        summarizeFileEntry(
          magnet.links[0]
        );
    }
  }

  return result;
}

function summarizeFileEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return {
      type: typeof entry
    };
  }

  const result = {
    keys: Object.keys(entry).slice(0, 40)
  };

  if (entry.n) {
    result.name = entry.n;
  }

  if (entry.name) {
    result.name = entry.name;
  }

  if (entry.filename) {
    result.filename = entry.filename;
  }

  if (entry.s !== undefined) {
    result.size = entry.s;
  }

  if (entry.size !== undefined) {
    result.size = entry.size;
  }

  if (entry.l) {
    result.hasDownloadLink = true;
    result.downloadLinkKey = 'l';
  } else if (entry.link) {
    result.hasDownloadLink = true;
    result.downloadLinkKey = 'link';
  } else if (entry.url) {
    result.hasDownloadLink = true;
    result.downloadLinkKey = 'url';
  } else {
    result.hasDownloadLink = false;
  }

  if (Array.isArray(entry.e)) {
    result.childrenKey = 'e';
    result.childrenCount = entry.e.length;

    if (entry.e.length) {
      result.firstChild =
        summarizeFileEntry(
          entry.e[0]
        );
    }
  }

  if (Array.isArray(entry.files)) {
    result.childrenKey = 'files';
    result.childrenCount = entry.files.length;

    if (entry.files.length) {
      result.firstChild =
        summarizeFileEntry(
          entry.files[0]
        );
    }
  }

  return result;
}

async function handleTestAllDebridFiles(res) {
  try {
    requireKey();

    const result =
      await getUfcFiles();

    return res.status(200).json({
      success: true,
      ufcFilesFound: result.length,
      files: result
        .slice(0, 20)
        .map(function (file) {
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

  const files =
    await getUfcFiles();

  let filtered =
    files;

  if (search) {
    filtered =
      files.filter(function (item) {
        return item.name
          .toLowerCase()
          .includes(search);
      });
  }

  filtered =
    filtered.slice(0, 100);

  return res.json({
    metas:
      filtered.map(function (item) {
        const title =
          cleanTitle(item.name);

        return {
          id: item.id,
          type: 'movie',
          name: title,
          poster: UFC_LOGO,
          posterShape: 'regular',
          background: UFC_BACKGROUND,
          description:
            'UFC fight stored in AllDebrid: ' +
            title,
          releaseInfo:
            extractYear(item.name) ||
            undefined,
          genres: [
            'UFC',
            'MMA',
            'Fighting',
            'Sports'
          ]
        };
      })
  });
}

async function handleMeta(
  res,
  id
) {
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
      id: id,
      type: 'movie',
      name: title,
      poster: UFC_LOGO,
      posterShape: 'regular',
      description:
        'UFC fight stored in your AllDebrid cloud: ' +
        title,
      background: UFC_BACKGROUND,
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

async function handleStream(
  res,
  id
) {
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
        'AllDebrid download link not found'
    });
  }

  return res.json({
    streams: [
      {
        id: id,
        title:
          cleanTitle(file.name),
        name:
          'AllDebrid',
        description:
          'Streamed from your AllDebrid cloud',
        thumbnail:
          UFC_LOGO,
        url:
          file.link,
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

async function getUfcFiles() {
  requireKey();

  const statusData =
    await allDebridRequest(
      STATUS_URL,
      {
        status: 'ready'
      }
    );

  const magnets =
    getReadyMagnets(
      statusData
    );

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
        FILES_URL,
        {
          id:
            batch.map(
              function (magnet) {
                return magnet.id;
              }
            )
        }
      );

    const returned =
      getMagnetsFromFilesResponse(
        data
      );

    for (
      const magnet
      of returned
    ) {
      const source =
        magnets.find(
          function (item) {
            return (
              String(item.id) ===
              String(magnet.id)
            );
          }
        );

      const entries =
        extractAllFiles(
          magnet
        );

      for (
        const file
        of entries
      ) {
        if (!file.name) {
          continue;
        }

        if (
          !VIDEO_EXTENSIONS.test(
            file.name
          )
        ) {
          continue;
        }

        if (
          !UFC_TERMS.test(
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
          size:
            file.size || 0,
          magnetId:
            magnet.id,
          completionDate:
            source &&
            source.completionDate
              ? source.completionDate
              : 0
        });
      }
    }
  }

  results.sort(
    function (a, b) {
      return (
        Number(
          b.completionDate
        ) -
        Number(
          a.completionDate
        )
      );
    }
  );

  return results;
}

function getReadyMagnets(
  statusData
) {
  const magnets =
    getMagnetsFromResponse(
      statusData
    );

  return magnets.filter(
    function (magnet) {
      if (
        !magnet ||
        !magnet.id
      ) {
        return false;
      }

      if (
        magnet.statusCode ===
          undefined ||
        magnet.statusCode ===
          null
      ) {
        return true;
      }

      return (
        Number(
          magnet.statusCode
        ) === 4
      );
    }
  );
}

async function findFile(
  magnetId,
  wantedPath
) {
  requireKey();

  const data =
    await allDebridRequest(
      FILES_URL,
      {
        id: [
          Number(magnetId)
        ]
      }
    );

  const magnets =
    getMagnetsFromFilesResponse(
      data
    );

  const magnet =
    magnets.find(
      function (item) {
        return (
          String(item.id) ===
          String(magnetId)
        );
      }
    );

  if (!magnet) {
    return null;
  }

  const files =
    extractAllFiles(
      magnet
    );

  return (
    files.find(
      function (file) {
        return (
          file.path ===
          wantedPath
        );
      }
    ) ||
    null
  );
}

function getMagnetsFromResponse(
  data
) {
  if (
    !data ||
    !data.data
  ) {
    return [];
  }

  if (
    Array.isArray(
      data.data.magnets
    )
  ) {
    return data.data.magnets;
  }

  if (
    data.data.magnets &&
    typeof data.data.magnets === 'object'
  ) {
    return Object.keys(
      data.data.magnets
    ).map(
      function (key) {
        return data.data.magnets[key];
      }
    );
  }

  if (
    Array.isArray(
      data.data
    )
  ) {
    return data.data;
  }

  if (
    Array.isArray(
      data.data.items
    )
  ) {
    return data.data.items;
  }

  if (
    Array.isArray(
      data.data.results
    )
  ) {
    return data.data.results;
  }

  return [];
}

function getMagnetsFromFilesResponse(
  data
) {
  return getMagnetsFromResponse(
    data
  );
}

function extractAllFiles(
  magnet
) {
  if (
    !magnet ||
    typeof magnet !== 'object'
  ) {
    return [];
  }

  const output = [];

  if (
    Array.isArray(
      magnet.files
    )
  ) {
    walkEntries(
      magnet.files,
      '',
      output
    );
  }

  if (
    Array.isArray(
      magnet.links
    )
  ) {
    walkEntries(
      magnet.links,
      '',
      output
    );
  }

  if (
    Array.isArray(
      magnet.items
    )
  ) {
    walkEntries(
      magnet.items,
      '',
      output
    );
  }

  return dedupeFiles(
    output
  );
}

function walkEntries(
  entries,
  parent,
  output
) {
  if (
    !Array.isArray(entries)
  ) {
    return;
  }

  for (
    const entry
    of entries
  ) {
    if (
      !entry ||
      typeof entry !== 'object'
    ) {
      continue;
    }

    const name =
      entry.n ||
      entry.name ||
      entry.filename ||
      '';

    const currentPath =
      entry.path
        ? entry.path
        : (
            parent && name
              ? parent +
                '/' +
                name
              : (
                  name ||
                  parent
                )
          );

    const children =
      entry.e ||
      entry.entries ||
      entry.children ||
      entry.files;

    if (
      Array.isArray(children)
    ) {
      walkEntries(
        children,
        currentPath,
        output
      );
      continue;
    }

    const link =
      entry.l ||
      entry.link ||
      entry.url ||
      entry.download ||
      null;

    if (
      link &&
      name
    ) {
      output.push({
        name:
          name,
        path:
          currentPath,
        link:
          link,
        size:
          Number(
            entry.s ||
            entry.size ||
            entry.bytes ||
            0
          ) || 0
      });
    }
  }
}

function dedupeFiles(
  files
) {
  const seen =
    new Set();

  return files.filter(
    function (file) {
      const key =
        file.path +
        '|' +
        file.link;

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);
      return true;
    }
  );
}

function summarizeMagnet(
  magnet
) {
  if (
    !magnet ||
    typeof magnet !== 'object'
  ) {
    return magnet;
  }

  return {
    id:
      magnet.id,
    statusCode:
      magnet.statusCode,
    status:
      magnet.status,
    name:
      magnet.name ||
      magnet.filename ||
      null,
    completionDate:
      magnet.completionDate ||
      null,
    keys:
      Object.keys(
        magnet
      ).slice(
        0,
        30
      )
  };
}

async function allDebridRequest(
  endpoint,
  fields
) {
  requireKey();

  const body =
    new URLSearchParams();

  for (
    const key
    of Object.keys(
      fields || {}
    )
  ) {
    const value =
      fields[key];

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
      endpoint,
      {
        method:
          'POST',
        headers: {
          Authorization:
            'Bearer ' +
            ALLDEBRID_API_KEY,
          'Content-Type':
            'application/x-www-form-urlencoded',
          Accept:
            'application/json',
          'User-Agent':
            'Navs-UFC-AllDebrid/3.2'
        },
        body:
          body.toString()
      }
    );

  const text =
    await response.text();

  let data =
    null;

  try {
    data =
      JSON.parse(
        text
      );
  } catch (_) {
    throw new Error(
      'AllDebrid returned non-JSON HTTP ' +
      response.status +
      ': ' +
      text.slice(
        0,
        200
      )
    );
  }

  if (
    !response.ok ||
    data.status !==
      'success'
  ) {
    const message =
      data &&
      data.error &&
      data.error.message
        ? data.error.message
        : (
            'AllDebrid API returned HTTP ' +
            response.status
          );

    throw new Error(
      message
    );
  }

  return data;
}

function requireKey() {
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

  return {
    magnetId:
      match[1],
    filePath:
      base64UrlDecode(
        match[2]
      )
  };
}

function base64UrlEncode(
  value
) {
  return Buffer
    .from(
      String(value),
      'utf8'
    )
    .toString(
      'base64'
    )
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
  let input =
    String(value)
      .replace(
        /-/g,
        '+'
      )
      .replace(
        /_/g,
        '/'
      );

  while (
    input.length % 4
  ) {
    input += '=';
  }

  return Buffer
    .from(
      input,
      'base64'
    )
    .toString(
      'utf8'
    );
}

function cleanTitle(
  filename
) {
  return String(
    filename
  )
    .replace(
      VIDEO_EXTENSIONS,
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
  filename
) {
  const match =
    String(
      filename
    ).match(
      /\b(19|20)\d{2}\b/
    );

  return match
    ? match[0]
    : null;
}
