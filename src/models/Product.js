import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";
import { Op } from "sequelize";
export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        
      },
      sku: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      barcode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      brandId: {
        type: DataTypes.INTEGER,
        allowNull: true, 
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true, 
      },
      imageMediaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      minStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdByType: {
        type: DataTypes.ENUM('admin', 'user_brand'),
        allowNull: true,
      },
      nanostoreId: {
        type: DataTypes.INTEGER,
        allowNull: true, 
      },
        zoneId: {
        type: DataTypes.INTEGER,
        allowNull: true, 
      },
    },
    {
      tableName: 'products',
      paranoid: true, 
      timestamps: true,
      indexes: [
        {
          name: 'products_sku_global_uniq',
          unique: true,
          fields: ['sku'],
          where: { nanostoreId: null },
        },
        {
          name: 'products_sku_private_uniq',
          unique: true,
          fields: ['nanostoreId', 'sku'],
          where: { nanostoreId: { [Op.ne]: null } },
        },
        {
          name: 'products_barcode_global_uniq',
          unique: true,
          fields: ['barcode'],
          where: { nanostoreId: null, barcode: { [Op.ne]: null } },
        },
        {
          name: 'products_barcode_private_uniq',
          unique: true,
          fields: ['nanostoreId', 'barcode'],
          where: {
            nanostoreId: { [Op.ne]: null },
            barcode: { [Op.ne]: null },
          },
        },
        { name: 'products_brand_idx', fields: ['brandId'] },
        { name: 'products_category_idx', fields: ['categoryId'] },
        { name: 'products_nanostore_idx', fields: ['nanostoreId'] },
         { name: 'products_zone_idx', fields: ['zoneId'] },
      ],
    }
  );
 
  Product.associate = (models) => {
    Product.hasMany(models.ProductVariant, {
      foreignKey: 'productId',
    });
    Product.hasMany(models.ProductTranslation, {
      foreignKey: 'productId',
    });
    Product.hasMany(models.SkuHistory, {
      foreignKey: 'productId',
    });
      Product.belongsTo(models.User, {
  foreignKey: 'createdBy',
  as: 'creator',
});
   Product.belongsTo(models.Zone, {
      foreignKey: 'zoneId',
      as: 'zone',
    });
  };
 
  return Product;
};