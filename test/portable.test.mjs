import assert from 'node:assert/strict';
import test from 'node:test';
import { createFetchHandler } from '../server/fetch-app.mjs';
import { loadRuntimeConfig } from '../server/runtime-config.mjs';
import worker from '../worker.mjs';

function portableConfig(overrides = {}) {
  return loadRuntimeConfig({
    NODE_ENV: 'production',
    PUBLIC_ORIGIN: 'https://www.allryte.example',
    ENFORCE_HTTPS: 'true',
    PORTAL_ENABLED: 'false',
    ...overrides,
  });
}

test('runtime-neutral handler serves assets with the same security headers', async () => {
  const handler = createFetchHandler(portableConfig(), {
    assetLoader: async (filename) => filename === 'index.html'
      ? new Response('<!doctype html><title>Allryte</title>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
      : null,
  });

  const response = await handler(new Request('https://www.allryte.example/'));

  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<!doctype html><title>Allryte</title>');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(response.headers.get('cache-control'), 'no-cache');
});

test('edge adapter preserves the validated portal handoff', async () => {
  const response = await worker.fetch(
    new Request('https://www.allryte.example/api/portal/launch?next=https://attacker.example'),
    {
      NODE_ENV: 'production',
      PUBLIC_ORIGIN: 'https://www.allryte.example',
      ENFORCE_HTTPS: 'true',
      PORTAL_ENABLED: 'true',
      PORTAL_URL: 'https://portal.example.com/patient/login?clinic=allryte',
      PORTAL_ALLOWED_HOSTS: 'portal.example.com',
      LOG_REQUESTS: 'false',
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://portal.example.com/patient/login?clinic=allryte');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('edge adapter can use a host-provided static asset binding', async () => {
  const response = await worker.fetch(new Request('https://www.allryte.example/allpsi.css'), {
    NODE_ENV: 'production',
    PUBLIC_ORIGIN: 'https://www.allryte.example',
    ENFORCE_HTTPS: 'true',
    PORTAL_ENABLED: 'false',
    LOG_REQUESTS: 'false',
    ASSETS: {
      fetch: async () => new Response('body { color: green; }', {
        headers: { 'Content-Type': 'text/css; charset=utf-8' },
      }),
    },
  });

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'body { color: green; }');
  assert.match(response.headers.get('content-type'), /text\/css/);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
});
