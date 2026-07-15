import { Worker } from 'bullmq';
import connection from './connection.js';
import { ingestSupplierData } from '../service/model.service.js';

const CONCURRENCY = 3;

const worker = new Worker(
  'supplier-ingestion',
  async (job) => {
    const { supplierId, nanostoreId, currentSnapshot, diff } = job.data;
    console.log(`[bullmq][worker] job ${job.id} — ingestion démarrée: zone=${supplierId}`);

    await ingestSupplierData({
      supplierId,
      nanostoreId,
      currentSnapshot: new Map(currentSnapshot),
      diff,
    });

    console.log(`[bullmq][worker] job ${job.id} — ingestion finie: zone=${supplierId}`);
  },
  { connection, concurrency: CONCURRENCY }
);

worker.on('ready', () => {
  console.log(`[bullmq][worker] supplier-ingestion — worker PRÊT (concurrency=${CONCURRENCY})`);
});
worker.on('active', (job) => {
  console.log(`[bullmq][worker] job ${job.id} — ACTIF (zone=${job.data.supplierId})`);
});
worker.on('completed', (job) => {
  console.log(`[bullmq][worker] job ${job.id} — COMPLÉTÉ (zone=${job.data.supplierId})`);
});
worker.on('failed', (job, err) => {
  console.error(`[bullmq][worker] job ${job?.id} — ÉCHOUÉ (zone=${job?.data?.supplierId}): ${err.message}`);
});
worker.on('stalled', (jobId) => {
  console.warn(`[bullmq][worker] job ${jobId} — BLOQUÉ (stalled)`);
});
worker.on('error', (err) => {
  console.error(`[bullmq][worker] ERREUR WORKER (connexion Redis?):`, err.message);
});

export default worker;