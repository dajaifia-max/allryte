import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
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
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
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

function securityHeaders(config, requestId) {
  const headers = {
    'Content-Security-Policy': contentSecurityPolicy(config.production),
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Request-ID': requestId,
  };
  if (config.production) {
    headers['Strict-Transport-Security'] = 'max-age=31536000';
  }
  return headers;
}

function send(response, status, headers, body = '') {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  response.writeHead(status, {
    ...headers,
    'Content-Length': payload.byteLength,
  });
  response.end(payload);
}

function sendJson(response, status, headers, value) {
  send(response, status, {
    ...headers,
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  }, JSON.stringify(value));
}

function isSecureRequest(request, config) {
  if (request.socket.encrypted) return true;
  if (!config.trustProxy) return false;
  return request.headers['x-forwarded-proto'] === 'https';
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

export function createRequestHandler(config, { logger = () => {} } = {}) {
  return async function requestHandler(request, response) {
    const requestId = randomUUID();
    const startedAt = performance.now();
    const headers = securityHeaders(config, requestId);
    let status = 500;
    let pathname = '/';

    try {
      if (!request.url || request.url.length > 2048) {
        status = 414;
        return send(response, status, headers, 'Request URI too long');
      }

      const parsed = new URL(request.url, 'http://internal.invalid');
      pathname = parsed.pathname;

      if (config.enforceHttps && !isSecureRequest(request, config)) {
        const destination = new URL(`${parsed.pathname}${parsed.search}`, config.publicOrigin);
        status = 308;
        return send(response, status, {
          ...headers,
          'Cache-Control': 'no-store',
          Location: destination.href,
        });
      }

      if (pathname === '/healthz') {
        if (!['GET', 'HEAD'].includes(request.method)) {
          status = 405;
          return send(response, status, { ...headers, Allow: 'GET, HEAD' });
        }
        status = 200;
        return sendJson(response, status, headers, { status: 'ok' });
      }

      if (pathname === '/api/portal/status') {
        if (!['GET', 'HEAD'].includes(request.method)) {
          status = 405;
          return send(response, status, { ...headers, Allow: 'GET, HEAD' });
        }
        status = 200;
        return sendJson(response, status, headers, getPortalStatus(config));
      }

      if (pathname === '/api/portal/launch') {
        if (!['GET', 'HEAD'].includes(request.method)) {
          status = 405;
          return send(response, status, { ...headers, Allow: 'GET, HEAD' });
        }
        const destination = getPortalRedirect(config);
        if (!destination) {
          status = 503;
          return sendJson(response, status, headers, {
            error: 'portal_unavailable',
            message: 'The secure patient portal is not connected yet. Please call the clinic for assistance.',
          });
        }
        status = 303;
        return send(response, status, {
          ...headers,
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
          return send(response, status, { ...headers, 'Cache-Control': 'no-store' }, 'Not found');
        }
        status = 200;
        return send(response, status, {
          ...headers,
          'Cache-Control': 'public, max-age=3600',
          'Content-Type': 'text/plain; charset=utf-8',
        }, body);
      }

      if (!['GET', 'HEAD'].includes(request.method)) {
        status = 405;
        return send(response, status, { ...headers, Allow: 'GET, HEAD' });
      }

      const filename = publicPath(pathname);
      if (!filename) {
        status = 404;
        return send(response, status, { ...headers, 'Cache-Control': 'no-store' }, 'Not found');
      }

      const body = await readFile(join(config.projectRoot, filename));
      const isHtml = extname(filename) === '.html';
      status = 200;
      return send(response, status, {
        ...headers,
        'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=3600',
        'Content-Type': MIME_TYPES.get(extname(filename)) || 'application/octet-stream',
      }, request.method === 'HEAD' ? '' : body);
    } catch (error) {
      status = 500;
      logger({ level: 'error', event: 'request_error', requestId, method: request.method, path: pathname });
      return send(response, status, {
        ...headers,
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      }, 'Internal server error');
    } finally {
      logger({
        level: 'info',
        event: 'request_complete',
        requestId,
        method: request.method,
        path: pathname,
        status,
        durationMs: Math.round(performance.now() - startedAt),
      });
    }
  };
}
