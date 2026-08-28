import { getPortalRedirect, getPortalStatus } from './portal.mjs';

const STATIC_FILES = new Set([
  'index.html',
  'allpsi.css',
  'allpsi.js',
  'theme-init.js',
  'logo.png',
  'logo-symmetrical.png',
  'logo-symmetrical-smile.png',
  'logo-symmetrical-jubilant.png',
  'about.html',
  'allpsi.html',
  'contact.html',
  'faq.html',
  'portal.html',
  'services.html',
]);

const MIME_TYPES = new Map([
  ['css', 'text/css; charset=utf-8'],
  ['html', 'text/html; charset=utf-8'],
  ['js', 'text/javascript; charset=utf-8'],
  ['png', 'image/png'],
]);

function contentSecurityPolicy(production) {
  const directives = [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-src https://www.google.com",
    "media-src 'none'",
    "worker-src 'none'",
    "manifest-src 'self'",
  ];
  if (production) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export function securityHeaders(config, requestId) {
  const headers = new Headers({
    'Content-Security-Policy': contentSecurityPolicy(config.production),
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Request-ID': requestId,
  });
  if (config.production) {
    headers.set('Strict-Transport-Security', 'max-age=31536000');
  }
  return headers;
}

function makeHeaders(baseHeaders, extraHeaders = undefined) {
  const headers = new Headers(baseHeaders);
  for (const [name, value] of new Headers(extraHeaders)) headers.set(name, value);
  return headers;
}

function send(status, baseHeaders, body = null, extraHeaders = undefined) {
  return new Response(body, {
    status,
    headers: makeHeaders(baseHeaders, extraHeaders),
  });
}

function sendJson(status, baseHeaders, value, method) {
  return send(status, baseHeaders, method === 'HEAD' ? null : JSON.stringify(value), {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
}

function publicPath(pathname) {
  if (pathname === '/') return 'index.html';
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/') || decoded.includes('\\') || decoded.includes('\0')) return null;
  const filename = decoded.slice(1);
  if (filename.includes('/') || !STATIC_FILES.has(filename)) return null;
  return filename;
}

function securityText(config) {
  if (!config.securityContact) return null;
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  return `Contact: ${config.securityContact}\nExpires: ${expires}\nPreferred-Languages: en\n`;
}

function requestId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function timerNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

/**
 * Creates a host-neutral Fetch API application.
 *
 * `assetLoader` is the only hosting seam. It receives an allowlisted filename
 * and must return a Response, or null when the asset is unavailable.
 */
export function createFetchHandler(config, { assetLoader = async () => null, logger = () => {} } = {}) {
  return async function fetchHandler(request) {
    const id = requestId();
    const startedAt = timerNow();
    const headers = securityHeaders(config, id);
    let status = 500;
    let pathname = '/';

    try {
      if (!request?.url || request.url.length > 4096) {
        status = 414;
        return send(status, headers, 'Request URI too long');
      }

      const parsed = new URL(request.url);
      pathname = parsed.pathname;

      if (config.enforceHttps && parsed.protocol !== 'https:') {
        const destination = new URL(`${parsed.pathname}${parsed.search}`, config.publicOrigin);
        status = 308;
        return send(status, headers, null, {
          'Cache-Control': 'no-store',
          Location: destination.href,
        });
      }

      if (pathname === '/healthz') {
        if (!['GET', 'HEAD'].includes(request.method)) {
          status = 405;
          return send(status, headers, null, { Allow: 'GET, HEAD' });
        }
        status = 200;
        return sendJson(status, headers, { status: 'ok' }, request.method);
      }

      if (pathname === '/api/portal/status') {
        if (!['GET', 'HEAD'].includes(request.method)) {
          status = 405;
          return send(status, headers, null, { Allow: 'GET, HEAD' });
        }
        status = 200;
        return sendJson(status, headers, getPortalStatus(config), request.method);
      }

      if (pathname === '/api/portal/launch') {
        if (!['GET', 'HEAD'].includes(request.method)) {
          status = 405;
          return send(status, headers, null, { Allow: 'GET, HEAD' });
        }
        const destination = getPortalRedirect(config);
        if (!destination) {
          status = 503;
          return sendJson(status, headers, {
            error: 'portal_unavailable',
            message: 'The secure patient portal is not connected yet. Please call the clinic for assistance.',
          }, request.method);
        }
        status = 303;
        return send(status, headers, null, {
          'Cache-Control': 'no-store',
          Location: destination,
          Pragma: 'no-cache',
          'Referrer-Policy': 'no-referrer',
        });
      }

      if (pathname === '/.well-known/security.txt') {
        const body = securityText(config);
        if (!body) {
          status = 404;
          return send(status, headers, 'Not found', { 'Cache-Control': 'no-store' });
        }
        status = 200;
        return send(status, headers, request.method === 'HEAD' ? null : body, {
          'Cache-Control': 'public, max-age=3600',
          'Content-Type': 'text/plain; charset=utf-8',
        });
      }

      if (!['GET', 'HEAD'].includes(request.method)) {
        status = 405;
        return send(status, headers, null, { Allow: 'GET, HEAD' });
      }

      const filename = publicPath(pathname);
      if (!filename) {
        status = 404;
        return send(status, headers, 'Not found', { 'Cache-Control': 'no-store' });
      }

      const asset = await assetLoader(filename, request);
      if (!(asset instanceof Response) || !asset.ok) {
        status = 404;
        return send(status, headers, 'Not found', { 'Cache-Control': 'no-store' });
      }

      const extension = filename.slice(filename.lastIndexOf('.') + 1);
      const assetHeaders = new Headers(asset.headers);
      for (const [name] of headers) assetHeaders.delete(name);
      assetHeaders.set('Cache-Control', extension === 'html' ? 'no-cache' : 'public, max-age=3600');
      if (!assetHeaders.has('Content-Type')) {
        assetHeaders.set('Content-Type', MIME_TYPES.get(extension) || 'application/octet-stream');
      }

      status = asset.status;
      return send(
        status,
        headers,
        request.method === 'HEAD' ? null : asset.body,
        assetHeaders
      );
    } catch {
      status = 500;
      logger({ level: 'error', event: 'request_error', requestId: id, method: request?.method, path: pathname });
      return send(status, headers, 'Internal server error', {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      });
    } finally {
      logger({
        level: 'info',
        event: 'request_complete',
        requestId: id,
        method: request?.method,
        path: pathname,
        status,
        durationMs: Math.round(timerNow() - startedAt),
      });
    }
  };
}
