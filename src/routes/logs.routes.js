import { pollLogger } from '../../utils/logBuffer.js';
import { getAllProviderStatuses } from '../../utils/providerStatus.js';

export default async function logsRoutes(fastify, opts) {
  fastify.get('/logs/recent', async (request) => {
    const limit = parseInt(request.query.limit) || 200;
    return pollLogger.getRecent(limit);
  });

  fastify.get('/providers/status', async () => {
    return getAllProviderStatuses(); 
  });

  fastify.get('/logs/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    pollLogger.getRecent(50).forEach(entry => {
      reply.raw.write(`data: ${JSON.stringify(entry)}\n\n`);
    });

    const unsubscribe = pollLogger.onLog((entry) => {
      reply.raw.write(`data: ${JSON.stringify(entry)}\n\n`);
    });

    request.raw.on('close', () => {
      unsubscribe();
      reply.raw.end();
    });

    return reply;
  });
}