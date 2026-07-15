/**
 * Normalizer générique.
 * Au lieu d'un mapping figé par fournisseur (S1, S2, ...), on définit pour
 * chaque champ "canonique" une liste de noms POSSIBLES qu'il peut porter
 * chez un fournisseur inconnu, et on cherche récursivement dans l'objet
 * brut lequel de ces noms existe.
 *
 * Ça ne devine pas à 100% (aucune solution automatique ne le peut), mais
 * ça donne un premier résultat exploitable pour n'importe quelle API,
 * et il suffit d'ajouter un alias si un champ n'est pas trouvé.
 */

// Pour chaque champ canonique, la liste des noms déjà vus dans des APIs
// e-commerce / catalogue. Complète cette liste au fur et à mesure que tu
// rencontres de nouveaux fournisseurs avec des noms différents.
const FIELD_ALIASES = {
  sku:         ['sku', 'id', 'product_id', 'productId', 'code', 'code_produit', 'ref', 'reference'],
  name:        ['name', 'title', 'nom', 'label', 'product_name', 'productName'],
  price:       ['price', 'cost', 'prix', 'prix_ht', 'amount', 'unit_price', 'unitPrice', 'price_cents'],
  stock:       ['stock', 'quantity', 'qty', 'available', 'stock_disponible', 'qty_available', 'in_stock'],
  barcode:     ['barcode', 'code_barre', 'ean', 'gtin'],
  unit:        ['unit', 'unite', 'pack_unit', 'units_per_pack'],
  size:        ['size', 'taille'],
  packaging:   ['packaging', 'conditionnement'],
  brandId:     ['brandId', 'brand_id', 'marque_id'],
  categoryId:  ['categoryId', 'category_id', 'categorie_id'],
  image:       ['image', 'thumbnail', 'image_url', 'imageUrl'],
  images:      ['images', 'gallery', 'galerie', 'image_urls'],
  description: ['description', 'desc'],
  updatedAt:   ['updatedAt', 'updated_at', 'last_modified', 'lastModified', 'date_maj', 'modified_at', 'changedAt'],
};

// Sous-clés usuelles quand une valeur "scalaire" est en fait enveloppée
// dans un objet, ex: price: { amount: 120, currency: 'MAD' } au lieu de
// price: 120 directement. On essaie ces clés avant d'abandonner.
const WRAPPER_KEYS = ['amount', 'value', 'val', 'number', 'quantity'];

function unwrapScalar(val) {
  if (val == null || typeof val !== 'object' || Array.isArray(val)) return val;
  for (const key of WRAPPER_KEYS) {
    if (typeof val[key] === 'number' || typeof val[key] === 'string') {
      return val[key];
    }
  }
  return undefined; // objet non "déballable" -> on ne le garde pas tel quel
}

// Cherche une valeur SCALAIRE (number/string/boolean) dans un objet
// potentiellement imbriqué, en essayant chaque alias à tous les niveaux.
// Important : si l'alias correspond mais que la valeur est un objet non
// déballable, on ne la retourne PAS (sinon on colle un objet en DB) —
// on continue plutôt à chercher ailleurs.
function deepFind(obj, aliases, maxDepth = 3) {
  if (obj == null || typeof obj !== 'object') return undefined;

  // Niveau courant : essaie chaque alias directement
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(obj, alias) && obj[alias] !== undefined) {
      const raw = obj[alias];
      if (typeof raw === 'number' || typeof raw === 'string' || typeof raw === 'boolean') {
        return raw;
      }
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const unwrapped = unwrapScalar(raw);
        if (unwrapped !== undefined) return unwrapped;
        if (maxDepth > 0) {
          const nested = deepFind(raw, aliases, maxDepth - 1);
          if (nested !== undefined) return nested;
        }
      }
    }
  }

  if (maxDepth <= 0) return undefined;

  // Descend dans les sous-objets (pas les tableaux, pas les null)
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const found = deepFind(val, aliases, maxDepth - 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * Normalise un item brut, quelle que soit sa forme (plat, imbriqué,
 * tableau positionnel géré séparément si besoin).
 *
 * @param {object} raw - item brut renvoyé par l'API
 * @param {object} [extraAliases] - alias additionnels spécifiques à ce
 *   client, sans casser les autres. Ex: { sku: ['numero_article'] }
 */
export function normalizeProductGeneric(raw, extraAliases = {}) {
  if (raw == null || typeof raw !== 'object') return null;

  const out = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const combinedAliases = [...(extraAliases[field] ?? []), ...aliases];
    const value = deepFind(raw, combinedAliases);
    out[field] = value !== undefined ? value : null;
  }

  // Cas fréquent : prix en centimes plutôt qu'en unité (price_cents).
  // Si le champ price est resté null mais qu'un alias "*_cents" existe,
  // on le convertit. On adapte ici plutôt que de le deviner par magie.
  if (out.price == null) {
    const cents = deepFind(raw, ['price_cents', 'priceCents', 'amount_cents']);
    if (typeof cents === 'number') out.price = cents / 100;
  }

  // Filet de sécurité final : les champs numériques ne DOIVENT jamais
  // partir en DB sous forme d'objet/tableau. Si malgré tout un objet a
  // traversé (structure trop exotique pour être déballée), on le remplace
  // par null plutôt que de crasher l'insertion SQL plus loin.
  for (const numericField of ['price', 'stock']) {
    const v = out[numericField];
    if (v != null && typeof v !== 'number' && typeof v !== 'string') {
      console.warn(`⚠️  Champ "${numericField}" ignoré : valeur non scalaire reçue`, v);
      out[numericField] = null;
    } else if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) {
      out[numericField] = Number(v);
    }
  }

  return out;
}

/**
 * À utiliser quand normalizeProductGeneric ne trouve pas tout : liste les
 * champs manquants pour un item donné, pour que tu puisses vite repérer
 * quel alias ajouter.
 */
export function reportMissingFields(raw, extraAliases = {}) {
  const normalized = normalizeProductGeneric(raw, extraAliases);
  const missing = Object.entries(normalized)
    .filter(([, v]) => v === null)
    .map(([k]) => k);
  return { normalized, missing };
}