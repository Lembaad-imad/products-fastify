import cron from 'node-cron';
import { providers } from '../../utils/providers.js';
import { fetchAllProducts } from '../../utils/fetchSupplierData.js';
import { ingestSupplierData } from '../../utils/productIngestionService.js';
import { pollLogger } from '../../utils/logBuffer.js';
import { updateProviderStatus } from '../../utils/providerStatus.js';


const BATCH_SIZE = 2;
const DELAY_BETWEEN_BATCHES_MS = 2000;

let isRunning = false;
const previousSnapshots = new Map(); // providerId -> Map<sku, product>

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function diffSnapshots(prevMap, currMap) {
  const added = [];
  const removed = [];
  const changed = []; // { sku, field, from, to }

  for (const [sku] of currMap) {
    if (!prevMap.has(sku)) added.push(sku);
  }

  for (const [sku] of prevMap) {
    if (!currMap.has(sku)) removed.push(sku);
  }

  for (const [sku, currProduct] of currMap) {
    const prevProduct = prevMap.get(sku);
    if (!prevProduct) continue;

    for (const field of ['name', 'price', 'stock', 'barcode', 'unit', 'size', 'packaging', 'brandId', 'categoryId', 'description']) {
      const prevVal = prevProduct[field];
      const currVal = currProduct[field];

      // Ignore noise: a field flipping to/from null (supplier flakiness),
      // only flag a change when BOTH sides have a real value and they differ.
      if (prevVal != null && currVal != null && prevVal !== currVal) {
        changed.push({ sku, field, from: prevVal, to: currVal });
      }
    }
  }

  return { added, removed, changed };
}


async function callApi(provider) {
  pollLogger.info(`[poll] calling ${provider.id} -> ${provider.url}`);

  try {
    const products = await fetchAllProducts(provider);
    const currentSnapshot = new Map(products.map(p => [p.sku, p]));
    pollLogger.info(`[poll] ${provider.id} — total products: ${currentSnapshot.size}`);

    const previousSnapshot = previousSnapshots.get(provider.id);
    const diff = previousSnapshot
      ? diffSnapshots(previousSnapshot, currentSnapshot)
      : { added: [...currentSnapshot.keys()], changed: [], removed: [] };

    previousSnapshots.set(provider.id, currentSnapshot);
       updateProviderStatus(provider.id, {
      status: 'ok',
      totalProducts: currentSnapshot.size,
      lastAdded: diff.added.length,
      lastChanged: diff.changed.length,
      lastRemoved: diff.removed.length,
      lastError: null,
    });
    if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
      pollLogger.info(`[poll] ${provider.id} — no changes detected`);
      return;
    }

    if (diff.added.length) pollLogger.info(`[poll] ${provider.id} + added (${diff.added.length}): ${diff.added.join(', ')}`);
    if (diff.removed.length) pollLogger.info(`[poll] ${provider.id} - removed (${diff.removed.length}): ${diff.removed.join(', ')}`);
    if (diff.changed.length) {
      pollLogger.info(`[poll] ${provider.id} ~ changed (${diff.changed.length})`);
      diff.changed.forEach(c => pollLogger.info(`    ${c.sku}.${c.field}: ${c.from} -> ${c.to}`));
    }

    await ingestSupplierData({ supplierId: provider.id, nanostoreId: null, currentSnapshot, diff });
  } catch (err) {
    pollLogger.error(`[poll] ${provider.id} failed: ${err.message}`);
    updateProviderStatus(provider.id, { status: 'error', lastError: err.message });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollAll() {
  if (isRunning) {
    console.warn('[poll] previous cycle still running, skipping this tick');
    return;
  }
  isRunning = true;
  console.log(`\n[poll] === cycle start at ${new Date().toISOString()} ===`);

  try {
    const batches = chunk(providers, BATCH_SIZE);

    for (const [index, batch] of batches.entries()) {
      console.log(`[poll] batch ${index + 1}/${batches.length}`);
      await Promise.all(batch.map(p => callApi(p)));

      const isLastBatch = index === batches.length - 1;
      if (!isLastBatch) await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  } finally {
    isRunning = false;
    console.log(`[poll] === cycle done ===`);
  }
}

cron.schedule('*/10 * * * * *', pollAll);