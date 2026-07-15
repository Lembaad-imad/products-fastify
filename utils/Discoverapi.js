/**
 * Découvreur d'endpoints.
 * Hypothèse de départ : on ne connaît RIEN, même pas le chemin de l'API
 * (ni "/api/xxx/products", ni rien d'autre). On a juste une base URL,
 * genre http://localhost:4000 ou https://client-quelconque.com.
 *
 * Stratégie, dans l'ordre (celle qui marche le plus souvent en premier) :
 *  1. Chercher une doc auto-décrite (OpenAPI/Swagger) — si elle existe,
 *     elle donne TOUTES les routes + leur forme exacte, plus besoin de deviner.
 *  2. Taper la racine de l'API — beaucoup de frameworks (Rails, Laravel,
 *     Express bien fait, etc.) renvoient à la racine une liste de routes
 *     disponibles (HATEOAS) ou au moins une 404 qui liste les routes connues.
 *  3. Essayer une liste de chemins "probables" vu les conventions REST
 *     habituelles, et ne garder que ceux qui répondent 200 avec du JSON
 *     qui ressemble à une liste de produits.
 *
 * Usage : node discoverEndpoints.js http://localhost:4000
 */

const COMMON_DOC_PATHS = [
  '/swagger.json', '/openapi.json', '/api-docs', '/api-docs.json',
  '/swagger/v1/swagger.json', '/v1/swagger.json', '/docs/openapi.json',
  '/.well-known/openapi.json', '/redoc', '/api/swagger.json',
];

const COMMON_RESOURCE_WORDS = [
  'products', 'product', 'items', 'catalog', 'catalogue', 'inventory',
  'articles', 'produits', 'stock', 'sku', 'goods',
];

const COMMON_PREFIXES = [
  '', '/api', '/api/v1', '/api/v2', '/v1', '/v2', '/rest', '/rest/v1',
];

async function tryFetch(url, headers = {}) {
  try {
    const res = await fetch(url, { headers });
    const contentType = res.headers.get('content-type') ?? '';
    if (!res.ok) return { url, ok: false, status: res.status };
    if (!contentType.includes('json')) return { url, ok: false, status: res.status, note: 'pas du JSON' };
    const json = await res.json();
    return { url, ok: true, status: res.status, json };
  } catch (err) {
    return { url, ok: false, error: err.message };
  }
}

// Étape 1 : chercher une doc OpenAPI/Swagger auto-décrite.
async function findApiDoc(baseUrl, headers) {
  console.log('\n--- Étape 1 : recherche d\'une doc OpenAPI/Swagger ---');
  for (const path of COMMON_DOC_PATHS) {
    const result = await tryFetch(`${baseUrl}${path}`, headers);
    if (result.ok && (result.json.paths || result.json.swagger || result.json.openapi)) {
      console.log(`✅ Doc trouvée : ${result.url}`);
      return result.json;
    }
  }
  console.log('❌ Aucune doc OpenAPI/Swagger trouvée aux emplacements habituels.');
  return null;
}

// Extrait de la doc OpenAPI les routes qui semblent renvoyer des listes.
function extractProductRoutesFromOpenApi(spec) {
  const routes = [];
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    if (methods.get) routes.push(path);
  }
  return routes;
}

// Étape 2 : taper la racine et les 404, au cas où l'API se décrit elle-même.
async function probeRoot(baseUrl, headers) {
  console.log('\n--- Étape 2 : sondage de la racine ---');
  const result = await tryFetch(baseUrl, headers);
  if (result.ok) {
    console.log(`Réponse de ${baseUrl} :`);
    console.log(JSON.stringify(result.json, null, 2).slice(0, 800));
    // Beaucoup d'APIs listent leurs routes dans un champ "routes", "links", "_links", "endpoints"...
    const maybeRoutes = result.json?.routes ?? result.json?.endpoints ?? result.json?._links ?? result.json?.links;
    if (maybeRoutes) {
      console.log('👉 Champ de routes détecté dans la réponse racine :', maybeRoutes);
    }
    return result.json;
  }
  console.log(`❌ La racine ne renvoie pas de JSON exploitable (status ${result.status ?? result.error}).`);
  return null;
}

// Étape 3 : brute-force raisonné sur les conventions REST habituelles.
async function bruteForceCommonPaths(baseUrl, headers) {
  console.log('\n--- Étape 3 : essai des chemins conventionnels ---');
  const candidates = [];
  for (const prefix of COMMON_PREFIXES) {
    for (const word of COMMON_RESOURCE_WORDS) {
      candidates.push(`${baseUrl}${prefix}/${word}`);
    }
  }

  const found = [];
  // On y va en série pour ne pas spammer le serveur ; à paralléliser si besoin.
  for (const url of candidates) {
    const result = await tryFetch(url, headers);
    if (result.ok) {
      const looksLikeItems =
        Array.isArray(result.json) ||
        Array.isArray(result.json?.data) ||
        Array.isArray(result.json?.items) ||
        Array.isArray(result.json?.results) ||
        Array.isArray(result.json?.products);
      if (looksLikeItems) {
        console.log(`✅ Candidat plausible : ${url}`);
        found.push(url);
      }
    }
  }
  if (found.length === 0) {
    console.log('❌ Rien trouvé parmi les chemins conventionnels essayés.');
  }
  return found;
}

export async function discoverEndpoints(baseUrl, headers = {}) {
  const cleanBase = baseUrl.replace(/\/$/, '');

  const spec = await findApiDoc(cleanBase, headers);
  if (spec) {
    const routes = extractProductRoutesFromOpenApi(spec);
    console.log('\nRoutes GET trouvées dans la doc :', routes);
    return { source: 'openapi', routes };
  }

  const rootJson = await probeRoot(cleanBase, headers);

  const guessed = await bruteForceCommonPaths(cleanBase, headers);

  return {
    source: guessed.length ? 'brute-force' : 'none',
    rootJson,
    routes: guessed,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error('Usage: node discoverEndpoints.js <baseUrl>');
    process.exit(1);
  }
  discoverEndpoints(baseUrl).then(result => {
    console.log('\n=== Résumé ===');
    console.log(result);
  }).catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
}