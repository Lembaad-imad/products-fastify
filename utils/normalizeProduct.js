// Reverse of the supplier "formatters" — maps each supplier's raw keys
// back to a single canonical shape:
// { sku, name, price, stock, barcode, unit, size, packaging, brandId, categoryId, image, images, description, updatedAt }

const FIELD_MAPS = {
  S1:  { sku: 'id',   name: 'name',  price: 'price', stock: 'stock',    barcode: 'barcode', unit: 'unit',      size: 'size', packaging: 'packaging', brandId: 'brandId',  categoryId: 'categoryId',  image: 'image',     images: 'images',  description: 'description', updatedAt: 'updatedAt' },
  S2:  { sku: 'sku',  name: 'title', price: 'cost',  stock: 'quantity', barcode: 'barcode', unit: 'pack_unit', size: 'size', packaging: 'packaging', brandId: 'brand_id', categoryId: 'category_id', image: 'thumbnail', images: 'gallery', description: 'description', updatedAt: 'last_modified' },
  S3:  { sku: 'code_produit', name: 'nom', price: 'prix_ht', stock: 'stock_disponible', barcode: 'code_barre', unit: 'unite', size: 'taille', packaging: 'conditionnement', brandId: 'marque_id', categoryId: 'categorie_id', image: 'image', images: 'galerie', description: 'description', updatedAt: 'date_maj' },
  S4:  { sku: 'product_id', name: 'product_name', price: 'unit_price', stock: 'qty_available', barcode: 'barcode', unit: 'units_per_pack', size: 'size', packaging: 'packaging', brandId: 'brand_id', categoryId: 'category_id', image: 'image_url', images: 'image_urls', description: 'description', updatedAt: 'modified_at' },
  // S5 handled separately (nested)
  // S6 handled separately (positional array)
  S7:  { sku: 'Id', name: 'Name', price: 'Price', stock: 'Stock', barcode: 'Barcode', unit: 'Unit', size: 'Size', packaging: 'Packaging', brandId: 'BrandId', categoryId: 'CategoryId', image: 'Image', images: 'Images', description: 'Description', updatedAt: 'UpdatedAt' },
  S8:  { sku: 'ref', name: 'label', price: 'amount', stock: 'available', barcode: 'barcode', unit: 'unit', size: 'size', packaging: 'packaging', brandId: 'brandId', categoryId: 'categoryId', image: 'image', images: 'images', description: 'description', updatedAt: 'changedAt' },
  // S9 handled separately (price in cents + boolean in_stock)
  S10: { sku: 'id',   name: 'name',  price: 'price', stock: 'stock',    barcode: 'barcode', unit: 'unit',      size: 'size', packaging: 'packaging', brandId: 'brandId',  categoryId: 'categoryId',  image: 'image',     images: 'images',  description: 'description', updatedAt: 'updatedAt' },
};

function normalizeFlat(supplierId, raw) {
  const map = FIELD_MAPS[supplierId];
  const out = { sku: null };
  for (const [semantic, rawKey] of Object.entries(map)) {
    out[semantic] = raw[rawKey] ?? null;
  }
  return out;
}

function normalizeS5(raw) {
  return {
    sku: raw?.product?.sku ?? null,
    name: raw?.product?.details?.title ?? null,
    price: raw?.product?.details?.price ?? null,
    barcode: raw?.product?.details?.barcode ?? null,
    unit: raw?.product?.details?.unit ?? null,
    size: raw?.product?.details?.size ?? null,
    packaging: raw?.product?.details?.packaging ?? null,
    description: raw?.product?.details?.description ?? null,
    stock: raw?.inventory?.qty ?? null,
    brandId: raw?.classification?.brandId ?? null,
    categoryId: raw?.classification?.categoryId ?? null,
    image: raw?.media?.image ?? null,
    images: raw?.media?.images ?? null,
    updatedAt: raw?.timestamps?.updated ?? null,
  };
}

function normalizeS6(raw) {
  // positional: [sku, name, price, stock, updatedAt]
  if (!Array.isArray(raw)) return null;
  const [sku, name, price, stock, updatedAt] = raw;
  return {
    sku: sku ?? null, name: name ?? null, price: price ?? null, stock: stock ?? null,
    barcode: null, unit: null, size: null, packaging: null, brandId: null, categoryId: null,
    image: null, images: null, description: null, updatedAt: updatedAt ?? null,
  };
}

function normalizeS9(raw) {
  return {
    sku: raw.sku ?? null,
    name: raw.name ?? null,
    price: raw.price_cents != null ? raw.price_cents / 100 : null,
    stock: raw.quantity ?? (raw.in_stock === true ? null : raw.in_stock === false ? 0 : null),
    barcode: raw.barcode ?? null,
    unit: raw.unit ?? null,
    size: raw.size ?? null,
    packaging: raw.packaging ?? null,
    brandId: raw.brandId ?? null,
    categoryId: raw.categoryId ?? null,
    image: raw.image ?? null,
    images: raw.images ?? null,
    description: raw.description ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

/**
 * Normalize a single raw item from any supplier into the canonical shape.
 * supplierId must be uppercase ("S1".."S10") to match the reliability/formatter keys.
 */
export function normalizeProduct(supplierId, raw) {
  if (raw == null) return null;

  switch (supplierId) {
    case 'S5': return normalizeS5(raw);
    case 'S6': return normalizeS6(raw);
    case 'S9': return normalizeS9(raw);
    default:
      if (FIELD_MAPS[supplierId]) return normalizeFlat(supplierId, raw);
      throw new Error(`No normalizer defined for supplier ${supplierId}`);
  }
}