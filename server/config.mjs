import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuntimeConfig } from './runtime-config.mjs';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

function readPort(value) {
  const port = Number(value ?? 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

export function loadConfig(environment = process.env) {
  const runtimeConfig = loadRuntimeConfig(environment);
  const trustProxy = environment.TRUST_PROXY === 'true';
  if (!['true', 'false', '', undefined].includes(environment.TRUST_PROXY)) {
    throw new Error(`Expected true or false, received ${environment.TRUST_PROXY}`);
  }

  return Object.freeze({
    ...runtimeConfig,
    port: readPort(environment.PORT),
    projectRoot: PROJECT_ROOT,
    trustProxy,
  });
}
