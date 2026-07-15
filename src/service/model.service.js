import models from "../models/index.js";
const {
  Product,
  ProductTranslation,
  ProductVariant,
  ProductVariantTranslation,
  SkuHistory,
  User,
  sequelize,
} = models;

const DEFAULT_LOCALE = "ar-ma";
const DEFAULT_CATEGORY_ID = 1; // must exist in your categories table — adjust
const SUPPLIER_CHANGE_SOURCE = "scheduled_job";

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

export async function getAllProducts({ nanostoreId = null } = {}) {
  return Product.findAll({
    where: { nanostoreId },
    include: [
      { model: ProductTranslation },
      { model: User, as: "creator", attributes: ["id", "name", "email"] },
    ],
  });
}

export async function getProductById(id) {
  return Product.findByPk(id, {
    include: [
      { model: ProductTranslation },
      { model: User, as: "creator", attributes: ["id", "name", "email"] },
    ],
  });
}

// ---------------------------------------------------------------------------
// Création manuelle (API) — un produit
// ---------------------------------------------------------------------------

export async function createProduct({ productData, translations, actor }, externalTransaction = null) {
  const run = async (t) => {
    const hasArMa = translations.some((tr) => tr.locale === "ar-ma");
    if (!hasArMa) {
      throw new Error("Une traduction ar-ma est obligatoire à la création du produit");
    }

    const product = await Product.create(
      {
        ...productData,
        stock: productData.stock ?? 0,
        minStock: productData.minStock ?? 0,
        createdBy: actor.createdBy,
        createdByType: actor.createdByType,
      },
      { transaction: t }
    );

    for (const tr of translations) {
      await ProductTranslation.create({ ...tr, productId: product.id }, { transaction: t });
    }

    await SkuHistory.create(
      {
        productId: product.id,
        sku: product.sku,
        changeType: "creation",
        changeSource: actor.changeSource ?? "manual",
        changedBy: actor.createdBy,
      },
      { transaction: t }
    );

    return product;
  };

  if (externalTransaction) return run(externalTransaction);
  return sequelize.transaction(run);
}


export async function createProductsBatch(batch, actor, externalTransaction = null) {
  const run = async (t) => {
    for (const item of batch) {
      const hasArMa = item.translations.some((tr) => tr.locale === "ar-ma");
      if (!hasArMa) throw new Error(`ar-ma manquant pour sku=${item.sku}`);
      if (!item.initialVariant) throw new Error(`initialVariant manquant pour sku=${item.sku}`);
    }

    const productsToInsert = batch.map((item) => {
      const { translations, initialVariant, ...productData } = item;
      return {
        ...productData,
        stock: productData.stock ?? 0,
        minStock: productData.minStock ?? 0,
        createdBy: actor.createdBy,
        createdByType: actor.createdByType,
      };
    });

    const createdProducts = await Product.bulkCreate(productsToInsert, {
      transaction: t,
      returning: true,
    });

    const translationsToInsert = [];
    const variantsToInsert = [];

    createdProducts.forEach((product, i) => {
      const item = batch[i];
      for (const tr of item.translations) {
        translationsToInsert.push({ ...tr, productId: product.id });
      }
      variantsToInsert.push({
        ...item.initialVariant,
        productId: product.id,
        isActive: true,
        status: "active",
        createdBy: actor.createdBy,
      });
    });

    await ProductTranslation.bulkCreate(translationsToInsert, { transaction: t });

    const createdVariants = await ProductVariant.bulkCreate(variantsToInsert, {
      transaction: t,
      returning: true,
    });

    const variantTranslationsToInsert = [];
    const skuHistoryToInsert = [];

    createdVariants.forEach((variant, i) => {
      const item = batch[i];
      const product = createdProducts[i];
      for (const tr of item.initialVariant.translations ?? []) {
        variantTranslationsToInsert.push({ ...tr, variantId: variant.id });
      }
      skuHistoryToInsert.push({
        productId: product.id,
        variantId: variant.id,
        sku: product.sku,
        changeType: "creation",
        changeSource: actor.changeSource ?? "bulk_import",
        changedBy: actor.createdBy,
      });
    });

    if (variantTranslationsToInsert.length) {
      await ProductVariantTranslation.bulkCreate(variantTranslationsToInsert, { transaction: t });
    }

    await SkuHistory.bulkCreate(skuHistoryToInsert, { transaction: t });

    return createdProducts;
  };

  if (externalTransaction) return run(externalTransaction);
  return sequelize.transaction(run);
}

// ---------------------------------------------------------------------------
// Ingestion fournisseur (ex productIngestionService.js) — sync incrémental
// avec diff (added / changed / removed), utilisé par le cron [poll]
// ---------------------------------------------------------------------------

async function createProductFromSupplier(ext, { nanostoreId, supplierId }, t) {
  if (ext.price == null) {
    console.warn(`[ingest] skip ${ext.sku} — missing price, will retry next poll`);
    return null;
  }

  const categoryId = ext.categoryId ?? DEFAULT_CATEGORY_ID;
  if (ext.categoryId == null) {
    console.warn(`[ingest] ${ext.sku} — missing categoryId, using default (${DEFAULT_CATEGORY_ID})`);
  }

  const product = await Product.create({
    sku: ext.sku,
    barcode: ext.barcode ?? null,
    unit: ext.unit ?? null,
    price: ext.price,
    brandId: ext.brandId ?? null,
    categoryId,
    image: ext.image ?? null,
    images: ext.images ?? null,
    stock: ext.stock ?? 0,
    status: true,
    createdByType: "admin",
    nanostoreId: nanostoreId ?? null,
  }, { transaction: t });

  const variant = await ProductVariant.create({
    productId: product.id,
    sku: `${ext.sku}-V1`,
    price: ext.price,
    size: ext.size ?? null,
    packaging: ext.packaging ?? null,
    stock: ext.stock ?? 0,
    validFrom: todayDateOnly(),
    validUntil: null,
    isActive: true,
    status: "active",
  }, { transaction: t });

  await ProductTranslation.create({
    productId: product.id,
    locale: DEFAULT_LOCALE,
    name: ext.name ?? ext.sku,
    description: ext.description ?? null,
    size: ext.size ?? null,
    packaging: ext.packaging ?? null,
  }, { transaction: t });

  await SkuHistory.create({
    productId: product.id,
    variantId: variant.id,
    sku: ext.sku,
    changeType: "creation",
    changeData: { supplierId },
    changeSource: SUPPLIER_CHANGE_SOURCE,
  }, { transaction: t });

  console.log(`[ingest] created product ${ext.sku} (id: ${product.id})`);
  return product;
}

async function applyVariantChange(product, ext, { supplierId }, t) {
  const activeVariant = await ProductVariant.findOne({
    where: { productId: product.id, isActive: true },
    transaction: t,
  });

  const newPrice = ext.price ?? activeVariant?.price;
  const newSize = ext.size ?? activeVariant?.size ?? null;
  const newPackaging = ext.packaging ?? activeVariant?.packaging ?? null;

  const matching = await ProductVariant.findOne({
    where: { productId: product.id, price: newPrice, size: newSize, packaging: newPackaging },
    transaction: t,
  });

  if (activeVariant) {
    activeVariant.isActive = false;
    activeVariant.status = "expired";
    activeVariant.validUntil = todayDateOnly();
    await activeVariant.save({ transaction: t });
  }

  let variant;
  let changeType = "price_change";
  if (activeVariant && newSize !== activeVariant.size) changeType = "size_change";
  if (activeVariant && newPackaging !== activeVariant.packaging) changeType = "packaging_change";

  if (matching && matching.id !== activeVariant?.id) {
    matching.isActive = true;
    matching.status = "active";
    matching.validFrom = todayDateOnly();
    matching.validUntil = null;
    await matching.save({ transaction: t });
    variant = matching;
    changeType = "reactivation";
  } else {
    const variantCount = await ProductVariant.count({ where: { productId: product.id }, transaction: t });
    variant = await ProductVariant.create({
      productId: product.id,
      sku: `${ext.sku}-V${variantCount + 1}`,
      price: newPrice,
      size: newSize,
      packaging: newPackaging,
      stock: ext.stock ?? activeVariant?.stock ?? 0,
      validFrom: todayDateOnly(),
      validUntil: null,
      isActive: true,
      status: "active",
    }, { transaction: t });
  }

  await SkuHistory.create({
    productId: product.id,
    variantId: variant.id,
    sku: ext.sku,
    changeType,
    changeData: { supplierId, price: newPrice, size: newSize, packaging: newPackaging },
    changeSource: SUPPLIER_CHANGE_SOURCE,
  }, { transaction: t });

  console.log(`[ingest] ${ext.sku} — variant ${changeType} -> ${variant.sku}`);
  return variant;
}

async function applyProductFieldUpdates(product, ext, t) {
  const patch = {};
  if (ext.stock != null && ext.stock !== product.stock) patch.stock = ext.stock;
  if (ext.image != null && ext.image !== product.image) patch.image = ext.image;
  if (ext.images != null) patch.images = ext.images;
  if (ext.brandId != null && ext.brandId !== product.brandId) patch.brandId = ext.brandId;
  if (ext.categoryId != null && ext.categoryId !== product.categoryId) patch.categoryId = ext.categoryId;

  if (Object.keys(patch).length > 0) {
    await product.update(patch, { transaction: t });
  }

  if (ext.name || ext.description) {
    await ProductTranslation.upsert({
      productId: product.id,
      locale: DEFAULT_LOCALE,
      name: ext.name ?? product.sku,
      description: ext.description ?? null,
      size: ext.size ?? null,
      packaging: ext.packaging ?? null,
    }, { transaction: t });
  }
}

/**
 * Point d'entrée principal — appelé après diffSnapshots() dans le poller cron.
 * diff = { added: string[], changed: {sku, field, from, to}[], removed: string[] }
 * currentSnapshot = Map<sku, normalizedProduct>
 */
export async function ingestSupplierData({ supplierId, nanostoreId = null, currentSnapshot, diff }) {
  const { added, changed, removed } = diff;
  const changedSkus = [...new Set(changed.map((c) => c.sku))];

  for (const sku of added) {
    const ext = currentSnapshot.get(sku);
    await sequelize.transaction((t) => createProductFromSupplier(ext, { nanostoreId, supplierId }, t));
  }

  for (const sku of changedSkus) {
    const ext = currentSnapshot.get(sku);
    const fields = changed.filter((c) => c.sku === sku).map((c) => c.field);

    await sequelize.transaction(async (t) => {
      const product = await Product.findOne({ where: { sku, nanostoreId }, transaction: t });
      if (!product) {
        await createProductFromSupplier(ext, { nanostoreId, supplierId }, t);
        return;
      }
      if (fields.some((f) => ["price", "size", "packaging"].includes(f))) {
        await applyVariantChange(product, ext, { supplierId }, t);
      }
      await applyProductFieldUpdates(product, ext, t);
    });
  }

  for (const sku of removed) {
    await Product.destroy({ where: { sku, nanostoreId } }); // paranoid: true -> soft delete
    console.log(`[ingest] ${supplierId} — soft-deleted ${sku}`);
  }
}