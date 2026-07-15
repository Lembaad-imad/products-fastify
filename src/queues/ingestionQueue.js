import { Queue, QueueEvents } from 'bullmq';
import connection from './connection.js';

export const ingestionQueue = new Queue('supplier-ingestion', { connection });

const queueEvents = new QueueEvents('supplier-ingestion', { connection });

queueEvents.on('waiting', ({ jobId }) => {
  console.log(`[bullmq][supplier-ingestion] job ${jobId} — EN ATTENTE`);
});
queueEvents.on('active', ({ jobId, prev }) => {
  console.log(`[bullmq][supplier-ingestion] job ${jobId} — ACTIF (était: ${prev})`);
});
queueEvents.on('completed', ({ jobId }) => {
  console.log(`[bullmq][supplier-ingestion] job ${jobId} — TERMINÉ`);
});
queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[bullmq][supplier-ingestion] job ${jobId} — ÉCHOUÉ: ${failedReason}`);
});
queueEvents.on('stalled', ({ jobId }) => {
  console.warn(`[bullmq][supplier-ingestion] job ${jobId} — BLOQUÉ (stalled)`);
});

export async function enqueueIngestion({ supplierId, nanostoreId, currentSnapshot, diff }) {
  console.log(`[bullmq][supplier-ingestion] enfilage zone=${supplierId} — added=${diff.added.length} changed=${diff.changed.length} removed=${diff.removed.length}`);

  const job = await ingestionQueue.add(
    'ingest-zone',
    {
      supplierId,
      nanostoreId,
      currentSnapshot: Array.from(currentSnapshot.entries()),
      diff,
    },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 500,
      removeOnFail: 2000,
    }
  );

  console.log(`[bullmq][supplier-ingestion] job ${job.id} ajouté pour zone=${supplierId}`);
}