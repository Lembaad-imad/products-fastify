import { sequelize } from "../config/database.js";

export default function defineProductVariantTranslation(Sequelize, DataTypes) {
    const ProductVariantTranslation = sequelize.define('ProductVariantTranslation', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        variantId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'product_variants', key: 'id' }
        },
        locale: {
            type: DataTypes.ENUM('en', 'fr', 'ar', 'ar-ma'),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        packagingLabel: {
            type: DataTypes.STRING(200),
            allowNull: true
        }
    }, {
        tableName: 'product_variant_translations',
        indexes: [
            {
                name: 'product_variant_translations_locale_uniq',
                unique: true,
                fields: ['variantId', 'locale']
            }
        ]
    });

    ProductVariantTranslation.associate = (models) => {
        ProductVariantTranslation.belongsTo(models.ProductVariant, { foreignKey: 'variantId' });
    };

    return ProductVariantTranslation;
}