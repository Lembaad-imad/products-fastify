import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

import defineProduct from "./Product.js";
import defineProductVariant from "./ProductVariant.js";
import defineProductTranslation from "./ProductTranslation.js";
import defineProductVariantTranslation from "./ProductVariantTranslation.js";
import defineSkuHistory from "./SkuHistory.js";
import defineUser from "./User.js";

const Product = defineProduct(sequelize, DataTypes);
const ProductVariant = defineProductVariant(sequelize, DataTypes);
const ProductTranslation = defineProductTranslation(sequelize, DataTypes);
const ProductVariantTranslation = defineProductVariantTranslation(sequelize, DataTypes);
const SkuHistory = defineSkuHistory(sequelize, DataTypes);
const User = defineUser(sequelize,DataTypes);

const models = {
  Product,
  ProductVariant,
  ProductTranslation,
  ProductVariantTranslation,
  SkuHistory,
  User,
  sequelize
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize };
export default models;