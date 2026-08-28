export function getPortalStatus(config) {
  if (!config.portalEnabled || !config.portalUrl) {
    return {
      available: false,
      mode: 'external-handoff',
      message: 'The secure patient portal is not connected yet. Please call the clinic for assistance.',
    };
  }

  return {
    available: true,
    mode: 'external-handoff',
    message: 'The secure patient portal is available.',
  };
}

export function getPortalRedirect(config) {
  if (!config.portalEnabled || !config.portalUrl) return null;

  // This URL is server-controlled and validated against PORTAL_ALLOWED_HOSTS.
  // Never append patient identifiers or browser-provided redirect targets here.
  return config.portalUrl.href;
}
