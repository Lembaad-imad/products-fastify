import { Worker } from 'bullmq';
import connection from './connection.js';
import * as productService from '../service/model.service.js';

const CONCURRENCY = 5;

// Suivi de la progression par batch (en mémoire de ce worker)
const batchProgress = new Map(); // batchId -> { completedChunks, totalChunks, totalCreated, startedAt }

const worker = new Worker(
  'product-bulk-import',
  async (job) => {
    const { batchId, chunkIndex, totalChunks, batch, actor } = job.data;
    const created = await productService.createProductsBatch(batch, actor);
    return { batchId, chunkIndex, totalChunks, count: created.length };
  },
  { connection, concurrency: CONCURRENCY }
);

worker.on('ready', () => {
  console.log(`[bullmq][worker] product-bulk-import — worker PRÊT (concurrency=${CONCURRENCY})`);
});

worker.on('completed', (job, result) => {
  const { batchId, totalChunks, count } = result;

  let progress = batchProgress.get(batchId);
  if (!progress) {
    progress = { completedChunks: 0, totalChunks, totalCreated: 0, startedAt: Date.now() };
    batchProgress.set(batchId, progress);
  }

  progress.completedChunks += 1;
  progress.totalCreated += count;

  if (progress.completedChunks >= progress.totalChunks) {
    const seconds = ((Date.now() - progress.startedAt) / 1000).toFixed(1);
    console.log(`[bullmq][worker] batch=${batchId} — ${progress.totalCreated} produits créés (${progress.totalChunks} chunk(s), ${seconds}s)`);
    batchProgress.delete(batchId);
  }
});

worker.on('failed', (job, err) => {
  console.error(`[bullmq][worker] job ${job?.id} — ÉCHOUÉ (batch=${job?.data?.batchId}, chunk=${job?.data?.chunkIndex}): ${err.message}`);
});

worker.on('stalled', (jobId) => {
  console.warn(`[bullmq][worker] job ${jobId} — BLOQUÉ (stalled)`);
});

worker.on('error', (err) => {
  console.error(`[bullmq][worker] ERREUR WORKER (connexion Redis?):`, err.message);
});

worker.on('closing', () => {
  console.log(`[bullmq][worker] product-bulk-import — fermeture en cours...`);
});

export default worker;