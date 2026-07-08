import { normalizeProduct } from './normalizeProduct.js';

const REQUIRES_API_KEY = new Set(['S10']);
const FLAKY = new Set(['S3']); // random latency + 500s -> needs retry
const CURSOR_PAGINATED = new Set(['S8']);
const PAGE_PAGINATED = new Set(['S2']);

function buildHeaders(supplierId) {
  const headers = {};
  if (REQUIRES_API_KEY.has(supplierId)) {
    headers['x-api-key'] = 'demo-key-123';
  }
  return headers;
}

async function fetchWithRetry(url, options, supplierId, retries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        if (res.status >= 500 && attempt < retries) {
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries && FLAKY.has(supplierId)) {
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function extractRawItems(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.results)) return json.results;
  if (Array.isArray(json?.products)) return json.products;
  return [];
}

/**
 * Fetches ALL products for one provider, following whatever pagination
 * style applies, and returns them normalized to the canonical shape.
 */
export async function fetchAllProducts(provider) {
  const supplierId = provider.id.toUpperCase(); // "s2" -> "S2"
  const headers = buildHeaders(supplierId);

  let allRaw = [];

  if (PAGE_PAGINATED.has(supplierId)) {
    let page = 1;
    let totalPages = 1;
    do {
      const sep = provider.url.includes('?') ? '&' : '?';
      const json = await fetchWithRetry(`${provider.url}${sep}page=${page}`, { headers }, supplierId);
      allRaw.push(...extractRawItems(json));
      totalPages = json?.meta?.totalPages ?? 1;
      page++;
    } while (page <= totalPages);

  } else if (CURSOR_PAGINATED.has(supplierId)) {
    let cursor = null;
    do {
      const sep = provider.url.includes('?') ? '&' : '?';
      const url = cursor ? `${provider.url}${sep}cursor=${encodeURIComponent(cursor)}` : provider.url;
      const json = await fetchWithRetry(url, { headers }, supplierId);
      allRaw.push(...extractRawItems(json));
      cursor = json?.meta?.nextCursor ?? json?.nextCursor ?? null;
    } while (cursor);

  } else {
    const json = await fetchWithRetry(provider.url, { headers }, supplierId);
    allRaw = extractRawItems(json);
  }

  const normalized = allRaw
    .map(raw => normalizeProduct(supplierId, raw))
    .filter(Boolean);

  return normalized;
}