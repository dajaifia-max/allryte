import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { afterEach, test } from 'node:test';
import { createRequestHandler } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

function testConfig(overrides = {}) {
  return loadConfig({
    NODE_ENV: 'development',
    PORT: '8787',
    PUBLIC_ORIGIN: 'http://127.0.0.1:8787',
    ENFORCE_HTTPS: 'false',
    TRUST_PROXY: 'false',
    PORTAL_ENABLED: 'false',
    ...overrides,
  });
}

async function startServer(config) {
  const server = createServer(createRequestHandler(config));
  servers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

test('rejects insecure or unapproved portal destinations', () => {
  assert.throws(() => testConfig({
    PORTAL_ENABLED: 'true',
    PORTAL_URL: 'http://portal.example.com/login',
    PORTAL_ALLOWED_HOSTS: 'portal.example.com',
  }), /HTTPS/);

  assert.throws(() => testConfig({
    PORTAL_ENABLED: 'true',
    PORTAL_URL: 'https://lookalike.example/login',
    PORTAL_ALLOWED_HOSTS: 'portal.example.com',
  }), /listed/);
});

test('serves the site with browser security headers', async () => {
  const origin = await startServer(testConfig());
  const response = await fetch(`${origin}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
});

test('fails closed when the portal is not configured', async () => {
  const origin = await startServer(testConfig());
  const response = await fetch(`${origin}/api/portal/launch`, { redirect: 'manual' });
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(payload.error, 'portal_unavailable');
});

test('redirects only to the exact server-configured portal URL', async () => {
  const config = testConfig({
    PORTAL_ENABLED: 'true',
    PORTAL_URL: 'https://portal.example.com/patient/login?clinic=allryte',
    PORTAL_ALLOWED_HOSTS: 'portal.example.com',
  });
  const origin = await startServer(config);
  const response = await fetch(
    `${origin}/api/portal/launch?next=https://attacker.example`,
    { redirect: 'manual' }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://portal.example.com/patient/login?clinic=allryte');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('uses the configured public origin for HTTPS redirects', async () => {
  const config = testConfig({
    PUBLIC_ORIGIN: 'https://www.allryte.example',
    ENFORCE_HTTPS: 'true',
    TRUST_PROXY: 'false',
  });
  const origin = await startServer(config);
  const response = await fetch(`${origin}/portal.html?source=test`, {
    headers: { 'X-Forwarded-Proto': 'https' },
    redirect: 'manual',
  });

  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://www.allryte.example/portal.html?source=test');
});

test('does not expose backend, environment, or documentation files', async () => {
  const origin = await startServer(testConfig());
  for (const path of [
    '/server.mjs',
    '/.env',
    '/package.json',
    '/docs/SECURE-PORTAL-HANDOFF.md',
    '/..%2fserver.mjs',
  ]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 404, path);
  }
});
