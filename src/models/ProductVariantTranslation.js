import { sequelize } from "../config/database.js";


export default (sequelize, DataTypes) => {
  const ProductVariantTranslation = sequelize.define(
    'ProductVariantTranslation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      variantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      locale: {
        type: DataTypes.ENUM('en', 'fr', 'ar', 'ar-ma'),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      packagingLabel: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
    },
    {
      tableName: 'product_variant_translations',
      timestamps: true,
      indexes: [
        {
          name: 'product_variant_translations_variant_locale_uniq',
          unique: true,
          fields: ['variantId', 'locale'],
        },
      ],
    }
  );

  ProductVariantTranslation.associate = (models) => {
    ProductVariantTranslation.belongsTo(models.ProductVariant, {
      foreignKey: 'variantId',
      as: 'variant',
    });
  };

  return ProductVariantTranslation;
};