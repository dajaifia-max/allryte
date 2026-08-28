import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createFetchHandler } from './fetch-app.mjs';

function isSecureRequest(request, config) {
  if (request.socket.encrypted) return true;
  if (!config.trustProxy) return false;
  return request.headers['x-forwarded-proto'] === 'https';
}

function toWebRequest(request, config) {
  const protocol = isSecureRequest(request, config) ? 'https' : 'http';
  const url = new URL(request.url || '/', `${protocol}://internal.invalid`);
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  return new Request(url, {
    method: request.method || 'GET',
    headers,
  });
}

async function sendNodeResponse(response, webResponse) {
  const headers = Object.fromEntries(webResponse.headers);
  const payload = Buffer.from(await webResponse.arrayBuffer());
  headers['Content-Length'] = String(payload.byteLength);
  response.writeHead(webResponse.status, headers);
  response.end(payload);
}

/**
 * Node's HTTP adapter. The application logic itself lives in fetch-app.mjs so
 * other hosts can reuse it without importing Node modules.
 */
export function createRequestHandler(config, { logger = () => {} } = {}) {
  const fetchHandler = createFetchHandler(config, {
    logger,
    assetLoader: async (filename) => {
      const body = await readFile(join(config.projectRoot, filename));
      return new Response(body);
    },
  });

  return async function requestHandler(request, response) {
    const webResponse = await fetchHandler(toWebRequest(request, config));
    await sendNodeResponse(response, webResponse);
  };
}
