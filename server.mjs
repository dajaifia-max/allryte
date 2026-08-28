import { createServer } from 'node:http';
import { createRequestHandler } from './server/app.mjs';
import { loadConfig } from './server/config.mjs';

const config = loadConfig();
const logger = (entry) => process.stdout.write(`${JSON.stringify(entry)}\n`);
const server = createServer({ maxHeaderSize: 16_384 }, createRequestHandler(config, { logger }));

server.headersTimeout = 10_000;
server.requestTimeout = 15_000;
server.keepAliveTimeout = 5_000;

server.listen(config.port, '0.0.0.0', () => {
  logger({
    level: 'info',
    event: 'server_started',
    origin: config.publicOrigin.origin,
    portalEnabled: config.portalEnabled,
  });
});

function shutdown(signal) {
  logger({ level: 'info', event: 'server_stopping', signal });
  server.close((error) => {
    process.exitCode = error ? 1 : 0;
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
