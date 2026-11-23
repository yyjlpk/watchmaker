const WORKFLOW = 'watchface-preview.yml';
const REPOSITORY = 'yyjlpk/watchmaker';
const INPUT_LIMIT = 3 * 1024 * 1024;
const OUTPUT_LIMIT = 256 * 1024;
const BUILD_TTL = 15 * 60;
const PACKAGE_TTL = 30 * 60;
const SESSION_TTL = 30 * 24 * 60 * 60;
const ACCESS_COOKIE = '__Host-watchmaker-preview';
const ID = '[0-9a-f]{32}';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (data, status = 200) => Response.json(data, { status, headers });
const error = (code, status) => json({ error: code }, status);

function equal(value, expected) {
  if (value.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) {
    difference |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return difference === 0;
}

function authorized(request, secret) {
  return !!secret && secret.length >= 24
    && equal(request.headers.get('Authorization') || '', 'Bearer ' + secret);
}

async function sessionValue(secret, expires) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {
    name: 'HMAC', hash: 'SHA-256',
  }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode('watchmaker-preview-session:' + expires));
  const signature = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return expires + '.' + signature;
}

async function hasSession(request, env) {
  const prefix = ACCESS_COOKIE + '=';
  const cookie = (request.headers.get('Cookie') || '').split(';')
    .map(item => item.trim()).find(item => item.startsWith(prefix));
  if (!cookie) return false;
  const value = cookie.slice(prefix.length);
  const expires = Number(value.split('.')[0]);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  return equal(value, await sessionValue(env.WATCHMAKER_ACCESS_KEY, expires));
}

async function readBounded(request, limit) {
  if (!request.body || Number(request.headers.get('Content-Length')) > limit) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

function configured(env) {
  return Boolean(env.PREVIEW_JOBS && env.GITHUB_ACTIONS_TOKEN
    && env.WATCHMAKER_ACCESS_KEY?.length >= 24 && env.WATCHMAKER_RUNNER_KEY?.length >= 24);
}

async function enqueue(request, env) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return error('access', 403);
  const firstLogin = authorized(request, env.WATCHMAKER_ACCESS_KEY);
  if (!firstLogin && !await hasSession(request, env)) return error('access', 401);
  const source = await readBounded(request, INPUT_LIMIT);
  if (!source) return error('size', 413);
  if (source[0] !== 80 || source[1] !== 75 || source[2] !== 3 || source[3] !== 4) {
    return error('project', 400);
  }

  const id = crypto.randomUUID().replaceAll('-', '');
  await env.PREVIEW_JOBS.put('source/' + id, source, { expirationTtl: BUILD_TTL });
  try {
    const dispatch = await fetch('https://api.github.com/repos/' + REPOSITORY
      + '/actions/workflows/' + WORKFLOW + '/dispatches', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.GITHUB_ACTIONS_TOKEN,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'watchmaker-worker',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: env.PREVIEW_ACTIONS_REF || 'main', inputs: { job_id: id } }),
      signal: AbortSignal.timeout(15000),
    });
    if (dispatch.ok) {
      const response = json({ id }, 202);
      if (firstLogin) {
        const expires = Math.floor(Date.now() / 1000) + SESSION_TTL;
        const value = await sessionValue(env.WATCHMAKER_ACCESS_KEY, expires);
        response.headers.set('Set-Cookie', ACCESS_COOKIE + '=' + value
          + '; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=' + SESSION_TTL);
      }
      return response;
    }
    console.error('GitHub dispatch returned', dispatch.status);
  } catch (cause) {
    console.error('GitHub dispatch failed', cause.name);
  }
  await env.PREVIEW_JOBS.delete('source/' + id);
  return error('dispatch', 502);
}

async function runner(request, env, id) {
  if (!authorized(request, env.WATCHMAKER_RUNNER_KEY)) return error('access', 401);
  const kv = env.PREVIEW_JOBS;
  if (request.method === 'GET') {
    const source = await kv.get('source/' + id, 'stream');
    return source ? new Response(source, { headers: { ...headers, 'Content-Type': 'application/zip' } })
      : error('missing', 404);
  }
  if (request.method !== 'PUT') return error('method', 405);

  const key = 'result/' + id;
  if (request.headers.get('Content-Type') === 'application/json') {
    const body = await readBounded(request, 512);
    if (!body) return error('size', 413);
    const result = JSON.parse(new TextDecoder().decode(body));
    if (result.status !== 'failed') return error('result', 400);
    await kv.put(key, JSON.stringify({ status: 'failed' }), { expirationTtl: PACKAGE_TTL });
    return new Response(null, { status: 204, headers });
  }

  const bytes = await readBounded(request, OUTPUT_LIMIT);
  if (!bytes) return error('size', 413);
  if (request.headers.get('Content-Type') !== 'image/png'
    || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) {
    return error('result', 400);
  }

  const options = { expirationTtl: PACKAGE_TTL };
  await kv.put('qr/' + id, bytes, options);
  await kv.put(key, JSON.stringify({ status: 'ready', expiresAt: Date.now() + 1000 * PACKAGE_TTL }), options);
  return new Response(null, { status: 204, headers });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/watchface-preview/config' && request.method === 'GET') {
      const enabled = configured(env);
      return json({ enabled, authenticated: enabled && await hasSession(request, env) });
    }
    if (!pathname.startsWith('/api/watchface-preview') && !pathname.startsWith('/p/')) {
      return env.ASSETS.fetch(request);
    }
    if (!configured(env)) return error('unavailable', 503);
    try {
      if (pathname === '/api/watchface-preview' && request.method === 'POST') {
        return await enqueue(request, env);
      }
      const job = new RegExp('^/api/watchface-preview/(' + ID + ')$').exec(pathname);
      if (job && request.method === 'GET') {
        return json(await env.PREVIEW_JOBS.get('result/' + job[1], 'json') || { status: 'pending' });
      }
      const runnerRoute = new RegExp('^/api/watchface-preview/runner/(' + ID + ')$').exec(pathname);
      if (runnerRoute) return await runner(request, env, runnerRoute[1]);
      const asset = new RegExp('^/p/(' + ID + ')\\.png$').exec(pathname);
      if (asset && request.method === 'GET') {
        const data = await env.PREVIEW_JOBS.get('qr/' + asset[1], 'stream');
        return data ? new Response(data, { headers: {
          ...headers,
          'Content-Type': 'image/png',
        } }) : error('expired', 404);
      }
      return error('missing', 404);
    } catch (cause) {
      console.error('Watchface preview request failed', cause.name);
      return error('internal', 500);
    }
  },
};
