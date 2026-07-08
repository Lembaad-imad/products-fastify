import { sequelize } from "../config/database.js";



export default (sequelize, DataTypes) => {
  const SkuHistory = sequelize.define(
    'SkuHistory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      variantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      changeType: {
        type: DataTypes.ENUM(
          'creation',
          'price_change',
          'size_change',
          'packaging_change',
          'reactivation',
          'expiration',
          'bulk_import',
          'manual_update',
          'scheduled_activation'
        ),
        allowNull: false,
      },
      changeData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      changedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      changeSource: {
        type: DataTypes.ENUM(
          'manual',
          'bulk_import',
          'scheduled_job',
          'api',
          'brand_portal'
        ),
        allowNull: false,
      },
      changedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'sku_history',
      timestamps: false, // pas de createdAt/updatedAt classiques, on utilise changedAt
      indexes: [
        { name: 'sku_history_product_idx', fields: ['productId'] },
        { name: 'sku_history_variant_idx', fields: ['variantId'] },
        { name: 'sku_history_changed_at_idx', fields: ['changedAt'] },
        { name: 'sku_history_change_source_idx', fields: ['changeSource'] },
      ],
    }
  );

  SkuHistory.associate = (models) => {
    SkuHistory.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    SkuHistory.belongsTo(models.ProductVariant, {
      foreignKey: 'variantId',
      as: 'variant',
    });
  };

  return SkuHistory;
};