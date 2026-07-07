import { sequelize } from "../config/database.js";
import { DataTypes, Sequelize } from "sequelize";

export default function defineProductVariant(Sequelize, DataTypes) {
    const ProductVariant = sequelize.define('ProductVariant', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
     
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'products', key: 'id' }
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        costPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        size: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        packaging: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        minStock: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        maxStock: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        validFrom: {
            type: DataTypes.DATE,
            allowNull: false
        },
        validUntil: {
            type: DataTypes.DATE,
            allowNull: true 
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        status: {
            type: DataTypes.ENUM('active', 'scheduled', 'expired', 'archived'),
            allowNull: false,
            defaultValue: 'active'
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'product_variants',
        paranoid: true,
        indexes: [
            {
                name: 'product_variants_sku_uniq',
                unique: true,
                fields: ['productId', 'sku'],
                where: { deletedAt: null }
            }
        ]
    });

 

    ProductVariant.associate = (models) => {
        ProductVariant.belongsTo(models.Product, { foreignKey: 'productId' });
        ProductVariant.hasMany(models.ProductVariantTranslation, { foreignKey: 'variantId' });
        ProductVariant.hasMany(models.SkuHistory, { foreignKey: 'variantId' });
    };

    return ProductVariant;
}