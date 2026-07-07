import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

export default function defineProduct(Sequelize, DataTypes) {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
           
        },
        sku: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        barcode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        unit: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        brandId: {
            type: DataTypes.INTEGER,
            allowNull: true, // nullable depuis juin 2026
            references: { model: 'brands', key: 'id' }
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'categories', key: 'id' }
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true // champ legacy
        },
        imageMediaId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'media', key: 'id' }
        },
        images: {
            type: DataTypes.JSON,
            allowNull: true
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        minStock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        createdByType: {
            type: DataTypes.ENUM('admin', 'user_brand'),
            allowNull: true
        },
        nanostoreId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'nanostores', key: 'id' }
        }
    }, {
        tableName: 'products',
        paranoid: true, 
        indexes: [
            {
                name: 'products_sku_global_uniq',
                unique: true,
                fields: ['sku'],
                where: { nanostoreId: null, deletedAt: null }
            },
            {
                name: 'products_sku_private_uniq',
                unique: true,
                fields: ['nanostoreId', 'sku'],
                where: { nanostoreId: { [Sequelize.Op.ne]: null }, deletedAt: null }
            },
            {
                name: 'products_barcode_global_uniq',
                unique: true,
                fields: ['barcode'],
                where: { nanostoreId: null, barcode: { [Sequelize.Op.ne]: null }, deletedAt: null }
            },
            {
                name: 'products_barcode_private_uniq',
                unique: true,
                fields: ['nanostoreId', 'barcode'],
                where: { nanostoreId: { [Sequelize.Op.ne]: null }, barcode: { [Sequelize.Op.ne]: null }, deletedAt: null }
            }
        ]
    });

   Product.associate = (models) => {
    Product.belongsTo(models.Brand, { foreignKey: 'brandId' });
    Product.belongsTo(models.Category, { foreignKey: 'categoryId' });
    Product.belongsTo(models.Media, { foreignKey: 'imageMediaId', onDelete: 'SET NULL' });
    Product.belongsTo(models.Nanostore, { foreignKey: 'nanostoreId' });
    Product.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Product.hasMany(models.ProductVariant, { foreignKey: 'productId' });
    Product.hasMany(models.ProductTranslation, { foreignKey: 'productId' });
};

    return Product;
}