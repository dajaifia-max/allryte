import { createFetchHandler } from './server/fetch-app.mjs';
import { loadRuntimeConfig } from './server/runtime-config.mjs';

function environmentForRequest(environment, request) {
  return {
    NODE_ENV: environment.NODE_ENV || 'production',
    PUBLIC_ORIGIN: environment.PUBLIC_ORIGIN || new URL(request.url).origin,
    ENFORCE_HTTPS: environment.ENFORCE_HTTPS ?? 'true',
    PORTAL_ENABLED: environment.PORTAL_ENABLED,
    PORTAL_URL: environment.PORTAL_URL,
    PORTAL_ALLOWED_HOSTS: environment.PORTAL_ALLOWED_HOSTS,
    SECURITY_CONTACT: environment.SECURITY_CONTACT,
  };
}

function createAssetLoader(assets) {
  if (!assets?.fetch) return async () => null;

  return async (filename, request) => {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = `/${filename}`;
    assetUrl.search = '';
    assetUrl.hash = '';
    return assets.fetch(new Request(assetUrl, { method: 'GET' }));
  };
}

/**
 * Cloudflare Worker / Sites-style adapter.
 *
 * Sites can bind its static asset service as `env.ASSETS`. Other Fetch API
 * hosts can import `createFetchHandler` directly and provide their own asset
 * loader using the same small interface.
 */
export default {
  async fetch(request, environment = {}) {
    const runtimeEnvironment = environmentForRequest(environment, request);
    const config = loadRuntimeConfig(runtimeEnvironment, {
      fallbackOrigin: new URL(request.url).origin,
    });
    const handler = createFetchHandler(config, {
      assetLoader: createAssetLoader(environment.ASSETS),
      logger: environment.LOG_REQUESTS === 'false'
        ? () => {}
        : (entry) => console.info(JSON.stringify(entry)),
    });
    return handler(request);
  },
};
