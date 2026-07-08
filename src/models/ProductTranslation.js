import { sequelize } from "../config/database.js";



export default (sequelize, DataTypes) => {
  const ProductTranslation = sequelize.define(
    'ProductTranslation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
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
      size: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      packaging: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: 'product_translations',
      timestamps: true,
      indexes: [
        {
          name: 'product_translations_product_locale_uniq',
          unique: true,
          fields: ['productId', 'locale'],
        },
      ],
    }
  );

  ProductTranslation.associate = (models) => {
    ProductTranslation.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
  };

  return ProductTranslation;
};