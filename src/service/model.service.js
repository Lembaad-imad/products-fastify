import models from "../models/index.js";
const { Product, ProductTranslation, SkuHistory, Brand, Category, Media, User, sequelize } = models;

export async function getAllProducts({ nanostoreId = null } = {}) {
  return Product.findAll({
    where: { nanostoreId },
    include: [
      
      { model: ProductTranslation },
      { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
    ],
  });
}

export async function getProductById(id) {
  return Product.findByPk(id, {
    include: [
    
      { model: ProductTranslation },
      { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
    ],
  });
}

export async function createProduct({ productData, translations, actor }) {
  return sequelize.transaction(async (t) => {
    const hasArMa = translations.some((tr) => tr.locale === "ar-ma");
    if (!hasArMa) {
      throw new Error("Une traduction ar-ma est obligatoire à la création du produit");
    }

    const product = await Product.create(
      {
        ...productData,
        stock: productData.stock ?? 0,
        minStock: productData.minStock ?? 0,
        createdBy: actor.createdBy, // FK vers User
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
  });

}
  export async function createProductsBulk(items, actor) {
  return sequelize.transaction(async (t) => {
    const results = [];
    for (const item of items) {
      const product = await createProduct(
        {
          productData: item.productData,
          translations: item.translations,
          actor: { ...actor, changeSource: "bulk_import" },
        },
        t 
      );
      results.push(product);
    }
    return results;
  });
}