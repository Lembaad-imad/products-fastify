import { Queue, QueueEvents } from 'bullmq';
import connection from './connection.js';

export const productQueue = new Queue('product-bulk-import', { connection });

const queueEvents = new QueueEvents('product-bulk-import', { connection });

queueEvents.on('waiting', ({ jobId }) => {
  console.log(`[bullmq][product-bulk-import] job ${jobId} — EN ATTENTE`);
});

queueEvents.on('active', ({ jobId, prev }) => {
  console.log(`[bullmq][product-bulk-import] job ${jobId} — ACTIF (était: ${prev})`);
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`[bullmq][product-bulk-import] job ${jobId} — TERMINÉ`, returnvalue);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[bullmq][product-bulk-import] job ${jobId} — ÉCHOUÉ: ${failedReason}`);
});

queueEvents.on('progress', ({ jobId, data }) => {
  console.log(`[bullmq][product-bulk-import] job ${jobId} — PROGRESSION:`, data);
});

queueEvents.on('stalled', ({ jobId }) => {
  console.warn(`[bullmq][product-bulk-import] job ${jobId} — BLOQUÉ (stalled)`);
});

queueEvents.on('removed', ({ jobId }) => {
  console.log(`[bullmq][product-bulk-import] job ${jobId} — SUPPRIMÉ`);
});

const CHUNK_SIZE = 1000; 

export async function enqueueBulkImport(items, actor) {
  const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const chunks = chunk(items, CHUNK_SIZE);

  console.log(`[bullmq][product-bulk-import] enfilage batch=${batchId} — ${items.length} items en ${chunks.length} chunk(s)`);

  const jobs = chunks.map((batch, index) => ({
    name: 'import-chunk',
    data: { batchId, chunkIndex: index, totalChunks: chunks.length, batch, actor },
    opts: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  }));

  const added = await productQueue.addBulk(jobs);
  console.log(`[bullmq][product-bulk-import] batch=${batchId} — ${added.length} jobs ajoutés`);

  return { batchId, totalItems: items.length, totalChunks: chunks.length };
}