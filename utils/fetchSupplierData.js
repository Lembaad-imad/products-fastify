import { normalizeProductGeneric } from './normalizeProduct.js';

/**
 * Fetcher générique : ne connaît RIEN du fournisseur à l'avance.
 * Il regarde ce que la première réponse contient et adapte sa stratégie :
 *  - trouve un tableau d'items où qu'il soit dans le JSON
 *  - détecte la pagination en cherchant des indices connus
 *  - s'arrête tout seul quand il n'y a plus de page suivante
 *
 * @param {object} config
 * @param {string} config.url - endpoint de base (sans query de pagination)
 * @param {object} [config.headers] - headers custom (auth, etc.)
 * @param {object} [config.extraAliases] - alias de champs propres à ce client
 * @param {number} [config.maxPages] - garde-fou anti boucle infinie (défaut 500)
 */
export async function fetchAllProductsGeneric({
  url,
  headers = {},
  extraAliases = {},
  maxPages = 500,
}) {
  let allRaw = [];
  let pageCount = 0;

  // État de pagination : on ne sait pas encore laquelle des 3 stratégies
  // s'applique, donc on part sans paramètre et on décide après la 1ère requête.
  let strategy = null; // 'cursor' | 'page' | 'relay' | 'none'
  let cursor = null;
  let page = 1;
  let totalPages = null;

  do {
    pageCount++;
    if (pageCount > maxPages) {
      console.warn(`Arrêt forcé après ${maxPages} pages (garde-fou).`);
      break;
    }

    const requestUrl = buildUrl(url, strategy, { cursor, page });
    const json = await fetchWithRetry(requestUrl, headers);

    const { items, itemsArrayContainer } = extractItems(json);
    allRaw.push(...items);

    // Première itération : on détecte la stratégie à partir de la réponse.
    if (strategy === null) {
      const detected = detectPaginationStrategy(json, itemsArrayContainer);
      strategy = detected.strategy;
      totalPages = detected.totalPages ?? null;
    }

    if (strategy === 'cursor') {
      cursor = findCursor(json);
    } else if (strategy === 'relay') {
      cursor = findRelayCursor(json);
    } else if (strategy === 'page') {
      page++;
    }

    if (strategy === 'none') break;
    if (strategy === 'page' && totalPages != null && page > totalPages) break;
    if ((strategy === 'cursor' || strategy === 'relay') && !cursor) break;

  } while (true);

  const normalized = allRaw
    .map(raw => normalizeProductGeneric(raw, extraAliases))
    .filter(Boolean);

  return normalized;
}

function buildUrl(baseUrl, strategy, { cursor, page }) {
  const sep = baseUrl.includes('?') ? '&' : '?';
  if (strategy === 'page') return `${baseUrl}${sep}page=${page}`;
  if (strategy === 'cursor' && cursor) return `${baseUrl}${sep}cursor=${encodeURIComponent(cursor)}`;
  if (strategy === 'relay' && cursor) return `${baseUrl}${sep}first=100&after=${encodeURIComponent(cursor)}`;
  return baseUrl; // premier appel, ou pas de pagination
}

async function fetchWithRetry(url, headers, retries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status >= 500 && attempt < retries) {
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
        throw new Error(`HTTP ${res.status} sur ${url}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Cherche le premier tableau non vide dans le JSON, où qu'il soit niché
// (racine, .data, .items, .results, .products, edges[].node, etc.)
function extractItems(json) {
  if (Array.isArray(json)) return { items: json, itemsArrayContainer: json };

  // Style Relay : data.products.edges[].node
  const edges = json?.data?.products?.edges ?? json?.products?.edges;
  if (Array.isArray(edges)) {
    return { items: edges.map(e => e?.node).filter(Boolean), itemsArrayContainer: edges };
  }

  const candidates = [json?.data, json?.items, json?.results, json?.products];
  for (const c of candidates) {
    if (Array.isArray(c)) return { items: c, itemsArrayContainer: c };
  }

  // Recherche récursive en dernier recours
  const found = findArrayRecursive(json);
  return { items: found ?? [], itemsArrayContainer: found ?? [] };
}

function findArrayRecursive(node, depth = 4) {
  if (Array.isArray(node)) return node;
  if (depth <= 0 || node == null || typeof node !== 'object') return null;
  for (const key of Object.keys(node)) {
    const found = findArrayRecursive(node[key], depth - 1);
    if (found) return found;
  }
  return null;
}

// Décide quelle stratégie de pagination s'applique en inspectant la 1ère réponse.
function detectPaginationStrategy(json) {
  const pageInfo = json?.data?.products?.pageInfo ?? json?.pageInfo;
  if (pageInfo && ('hasNextPage' in pageInfo)) {
    return { strategy: 'relay' };
  }

  const cursor = json?.meta?.nextCursor ?? json?.nextCursor ?? json?.next_cursor;
  if (cursor !== undefined) {
    return { strategy: 'cursor' };
  }

  const totalPages = json?.meta?.totalPages ?? json?.total_pages ?? json?.totalPages;
  if (totalPages != null) {
    return { strategy: 'page', totalPages };
  }

  return { strategy: 'none' };
}

function findCursor(json) {
  return json?.meta?.nextCursor ?? json?.nextCursor ?? json?.next_cursor ?? null;
}

function findRelayCursor(json) {
  const pageInfo = json?.data?.products?.pageInfo ?? json?.pageInfo;
  return pageInfo?.hasNextPage ? pageInfo.endCursor : null;
}
export { fetchAllProductsGeneric as fetchAllProducts };