const http = require('http');

const PORT = Number(process.env.META_CAPI_PORT || 3002);
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const META_PIXEL_ID = process.env.META_PIXEL_ID || '';
const META_API_VERSION = process.env.META_API_VERSION || 'v20.0';
const ALLOWED_ORIGINS = (process.env.META_ALLOWED_ORIGINS || 'http://localhost:3001,https://your-domain.com')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function sendMetaCapiEvent(payload) {
  if (!META_ACCESS_TOKEN || !META_PIXEL_ID) {
    return Promise.resolve({ ok: false, error: 'Missing META_ACCESS_TOKEN or META_PIXEL_ID' });
  }

  const apiUrl = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`;

  return fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [payload] }),
  })
    .then(async (response) => {
      const text = await response.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      return {
        ok: response.ok,
        status: response.status,
        body: json || text,
      };
    })
    .catch((error) => ({ ok: false, error: error.message }));
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error('Request payload too large'));
      }
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });

    req.on('error', reject);
  });
}

function setCorsHeaders(res, origin) {
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'meta-capi' }));
    return;
  }

  if (req.url !== '/api/meta/capi' || req.method !== 'POST') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Not found' }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const {
      pixel_id,
      event_name,
      event_time,
      event_id,
      action_source = 'website',
      custom_data,
      user_data,
    } = body || {};

    if (!event_name || !event_id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'event_name and event_id are required' }));
      return;
    }

    const payload = {
      event_name,
      event_time: event_time || Math.floor(Date.now() / 1000),
      event_id,
      action_source,
      event_source_url: body.event_source_url || '',
      custom_data: custom_data || {},
      user_data: user_data || {
        em: [],
        ph: [],
        fn: [],
        ln: [],
        ge: [],
        db: [],
        ct: [],
        st: [],
        zp: [],
        country: [],
      },
    };

    const result = await sendMetaCapiEvent({
      ...payload,
      ...(pixel_id ? { pixel_id } : {}),
    });

    res.writeHead(result.ok ? 200 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Meta CAPI server listening on http://localhost:${PORT}`);
});
