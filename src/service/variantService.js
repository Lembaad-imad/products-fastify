import models from "../models/index.js";
const { ProductVariant, ProductVariantTranslation, SkuHistory, sequelize } = models;

export async function createVariant({ productId, variantData, translations, actor }) {
  return sequelize.transaction(async (t) => {
    const existing = await ProductVariant.findOne({
      where: {
        productId,
        price: variantData.price,
        size: variantData.size,
        packaging: variantData.packaging,
      },
      transaction: t,
    });

    if (existing) {
      await existing.update(
        { isActive: true, status: "active", validFrom: new Date(), validUntil: null },
        { transaction: t }
      );

      await SkuHistory.create(
        {
          productId,
          variantId: existing.id,
          sku: existing.sku,
          changeType: "reactivation",
          changeSource: actor.changeSource ?? "manual",
          changedBy: actor.updatedBy,
        },
        { transaction: t }
      );

      return existing;
    }

    // 2. Expirer l'ancienne variante active
    await ProductVariant.update(
      { isActive: false, status: "expired", validUntil: new Date() },
      { where: { productId, isActive: true }, transaction: t }
    );

    // 3. Créer la nouvelle variante
    const variant = await ProductVariant.create(
      { ...variantData, productId, validFrom: new Date(), createdBy: actor.createdBy },
      { transaction: t }
    );

    for (const tr of translations ?? []) {
      await ProductVariantTranslation.create({ ...tr, variantId: variant.id }, { transaction: t });
    }

    await SkuHistory.create(
      {
        productId,
        variantId: variant.id,
        sku: variant.sku,
        changeType: "price_change", 
        changeSource: actor.changeSource ?? "manual",
        changedBy: actor.createdBy,
      },
      { transaction: t }
    );

    return variant;
  });
}