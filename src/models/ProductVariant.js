import { sequelize } from "../config/database.js";
import { DataTypes, Sequelize } from "sequelize";



export default (sequelize, DataTypes) => {
  const ProductVariant = sequelize.define(
    'ProductVariant',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        // La sequence Postgres doit demarrer a 5000 via migration :
        // ALTER SEQUENCE "ProductVariants_id_seq" RESTART WITH 5000;
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      size: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      packaging: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      minStock: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maxStock: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      validFrom: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      validUntil: {
        type: DataTypes.DATE,
        allowNull: true, // NULL = illimite
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'scheduled', 'expired', 'archived'),
        allowNull: false,
        defaultValue: 'active',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'product_variants',
      timestamps: true,
      indexes: [
        {
          name: 'product_variants_product_sku_uniq',
          unique: true,
          fields: ['productId', 'sku'],
        },
        {
          name: 'product_variants_active_lookup_idx',
          fields: ['productId', 'isActive', 'status'],
        },
        {
          name: 'product_variants_validity_range_idx',
          fields: ['validFrom', 'validUntil'],
        },
      ],
    }
  );

  ProductVariant.associate = (models) => {
    ProductVariant.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    ProductVariant.hasMany(models.ProductVariantTranslation, {
      foreignKey: 'variantId',
      as: 'translations',
    });
    ProductVariant.hasMany(models.SkuHistory, {
      foreignKey: 'variantId',
      as: 'skuHistory',
    });
  };

  return ProductVariant;
};