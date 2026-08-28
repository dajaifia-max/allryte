function readBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`Expected true or false, received ${value}`);
}

function readOrigin(value, { production, enforceHttps, fallbackOrigin }) {
  const origin = new URL(value || fallbackOrigin || 'http://127.0.0.1:8787');
  if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
    throw new Error('PUBLIC_ORIGIN must contain only a scheme and host');
  }
  if ((production || enforceHttps) && origin.protocol !== 'https:') {
    throw new Error('PUBLIC_ORIGIN must use HTTPS when HTTPS enforcement is enabled');
  }
  if (!['http:', 'https:'].includes(origin.protocol)) {
    throw new Error('PUBLIC_ORIGIN must use HTTP or HTTPS');
  }
  return origin;
}

function readAllowedHosts(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
}

function readPortalUrl(value, allowedHosts) {
  if (!value) throw new Error('PORTAL_URL is required when PORTAL_ENABLED=true');
  const portalUrl = new URL(value);
  if (portalUrl.protocol !== 'https:') {
    throw new Error('PORTAL_URL must use HTTPS');
  }
  if (portalUrl.username || portalUrl.password || portalUrl.hash) {
    throw new Error('PORTAL_URL cannot contain credentials or a fragment');
  }
  if (!allowedHosts.has(portalUrl.hostname.toLowerCase())) {
    throw new Error('PORTAL_URL hostname must be listed in PORTAL_ALLOWED_HOSTS');
  }
  return portalUrl;
}

function readSecurityContact(value) {
  if (!value) return null;
  if (value.startsWith('mailto:')) return value;
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('SECURITY_CONTACT must use mailto: or HTTPS');
  return url.href;
}

/**
 * Runtime-neutral configuration shared by Node, serverless, and edge adapters.
 * Only plain web-platform values are returned so this module can be bundled
 * without Node built-ins.
 */
export function loadRuntimeConfig(environment = {}, { fallbackOrigin } = {}) {
  const production = environment.NODE_ENV === 'production';
  const enforceHttps = readBoolean(environment.ENFORCE_HTTPS, production);
  const publicOrigin = readOrigin(environment.PUBLIC_ORIGIN, {
    production,
    enforceHttps,
    fallbackOrigin,
  });
  const portalEnabled = readBoolean(environment.PORTAL_ENABLED, false);
  const portalAllowedHosts = readAllowedHosts(environment.PORTAL_ALLOWED_HOSTS);

  if (portalEnabled && portalAllowedHosts.size === 0) {
    throw new Error('PORTAL_ALLOWED_HOSTS is required when PORTAL_ENABLED=true');
  }

  return Object.freeze({
    production,
    publicOrigin,
    enforceHttps,
    portalEnabled,
    portalUrl: portalEnabled ? readPortalUrl(environment.PORTAL_URL, portalAllowedHosts) : null,
    securityContact: readSecurityContact(environment.SECURITY_CONTACT),
  });
}
