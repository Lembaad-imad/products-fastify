import cron from 'node-cron';
import { fetchAllProducts } from '../../utils/fetchSupplierData.js';
import { enqueueIngestion } from '../queues/ingestionQueue.js';
import { pollLogger } from '../../utils/logBuffer.js';
import { updateProviderStatus } from '../../utils/providerStatus.js';
import models from '../models/index.js';

const { ProductChangeLog, Zone } = models;

const BATCH_SIZE = 2;
const DELAY_BETWEEN_BATCHES_MS = 2000;

let isRunning = false;
const previousSnapshots = new Map();

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
  const changed = [];

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

      if (prevVal != null && currVal != null && prevVal !== currVal) {
        changed.push({ sku, field, from: prevVal, to: currVal });
      }
    }
  }

  return { added, removed, changed };
}

async function persistChangeLog({ zoneId, diff, previousSnapshot, currentSnapshot, pollCycleAt }) {
  const rows = [];

  for (const sku of diff.added) {
    rows.push({
      supplierId: zoneId,
      sku,
      action: 'added',
      field: null,
      oldValue: null,
      newValue: JSON.stringify(currentSnapshot.get(sku) ?? null),
      pollCycleAt,
    });
  }

  for (const sku of diff.removed) {
    rows.push({
      supplierId: zoneId,
      sku,
      action: 'removed',
      field: null,
      oldValue: JSON.stringify(previousSnapshot.get(sku) ?? null),
      newValue: null,
      pollCycleAt,
    });
  }

  for (const c of diff.changed) {
    rows.push({
      supplierId: zoneId,
      sku: c.sku,
      action: 'changed',
      field: c.field,
      oldValue: c.from != null ? String(c.from) : null,
      newValue: c.to != null ? String(c.to) : null,
      pollCycleAt,
    });
  }

  if (!rows.length) return;

  try {
    await ProductChangeLog.bulkCreate(rows);
    pollLogger.info(`[poll] zone ${zoneId} — persisted ${rows.length} change log row(s)`);
  } catch (err) {
    pollLogger.error(`[poll] zone ${zoneId} — failed to persist change log: ${err.message}`);
  }
}

async function updateZoneState(zone, { state, lastSync = null }) {
  try {
    await zone.update({ state, ...(lastSync ? { lastSync } : {}) });
  } catch (err) {
    pollLogger.error(`[poll] zone ${zone.id} — failed to persist state: ${err.message}`);
  }
}

export function extractSupplierCode(endpoint) {
  const match = endpoint?.match(/\/api\/(s\d+)\//i);
  return match ? match[1] : null;
}

async function callApi(zone, pollCycleAt) {
  pollLogger.info(`[poll] calling zone ${zone.id} (${zone.name}) -> ${zone.endpoint}`);

  const supplierCode = extractSupplierCode(zone.endpoint);
  if (!supplierCode) {
    pollLogger.error(`[poll] zone ${zone.id} — could not determine supplier code from endpoint "${zone.endpoint}"`);
    await updateZoneState(zone, { state: 'erreur' });
    return;
  }

  try {
    const products = await fetchAllProducts({ id: supplierCode, url: zone.endpoint });
    const currentSnapshot = new Map(products.map(p => [p.sku, p]));
    pollLogger.info(`[poll] zone ${zone.id} — total products: ${currentSnapshot.size}`);

    const previousSnapshot = previousSnapshots.get(zone.id) ?? new Map();
    const diff = previousSnapshots.has(zone.id)
      ? diffSnapshots(previousSnapshot, currentSnapshot)
      : { added: [...currentSnapshot.keys()], changed: [], removed: [] };

    previousSnapshots.set(zone.id, currentSnapshot);

    await updateZoneState(zone, { state: 'connecte', lastSync: new Date() });

    updateProviderStatus(supplierCode.toUpperCase(), {
      status: 'ok',
      totalProducts: currentSnapshot.size,
      lastAdded: diff.added.length,
      lastChanged: diff.changed.length,
      lastRemoved: diff.removed.length,
      lastError: null,
    });

    if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
      pollLogger.info(`[poll] zone ${zone.id} — no changes detected`);
      return;
    }

if (diff.added.length) pollLogger.info(`[poll] zone ${zone.id} + ${diff.added.length} produit(s) ajouté(s)`);
if (diff.removed.length) pollLogger.info(`[poll] zone ${zone.id} - ${diff.removed.length} produit(s) supprimé(s)`);
if (diff.changed.length) pollLogger.info(`[poll] zone ${zone.id} ~ ${diff.changed.length} produit(s) modifié(s)`);

    await persistChangeLog({
      zoneId: zone.id,
      diff,
      previousSnapshot,
      currentSnapshot,
      pollCycleAt,
    });

    await enqueueIngestion({ supplierId: zone.id, nanostoreId: null, currentSnapshot, diff });

  } catch (err) {
    pollLogger.error(`[poll] zone ${zone.id} failed: ${err.message}`);
    if (err.errors) {
      err.errors.forEach(e =>
        pollLogger.error(`    -> field "${e.path}": ${e.message} (value: ${JSON.stringify(e.value)})`)
      );
    }
    await updateZoneState(zone, { state: 'erreur' });
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
  const pollCycleAt = new Date();
  console.log(`\n[poll] === cycle start at ${pollCycleAt.toISOString()} ===`);

  try {
    const zones = await Zone.findAll({ where: { status: 'actif' } });

    if (!zones.length) {
      pollLogger.info('[poll] no active zones to poll');
      return;
    }

    const batches = chunk(zones, BATCH_SIZE);

    for (const [index, batch] of batches.entries()) {
      console.log(`[poll] batch ${index + 1}/${batches.length}`);
      await Promise.all(batch.map(z => callApi(z, pollCycleAt)));

      const isLastBatch = index === batches.length - 1;
      if (!isLastBatch) await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  } finally {
    isRunning = false;
    console.log(`[poll] === cycle done ===`);
  }
}

cron.schedule('*/10 * * * * *', pollAll);