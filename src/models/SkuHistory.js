import { sequelize } from "../config/database.js";

export default function defineSkuHistory(Sequelize, DataTypes) {
    const SkuHistory = sequelize.define('SkuHistory', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'products', key: 'id' }
        },
        variantId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'product_variants', key: 'id' }
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: false
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
            allowNull: false
        },
        changeData: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        changedBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        changeSource: {
            type: DataTypes.ENUM('manual', 'bulk_import', 'scheduled_job', 'api', 'brand_portal'),
            allowNull: false
        },
        changedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'sku_history',
        timestamps: false 
    });

   

    SkuHistory.associate = (models) => {
        SkuHistory.belongsTo(models.Product, { foreignKey: 'productId' });
        SkuHistory.belongsTo(models.ProductVariant, { foreignKey: 'variantId' });
    };

    return SkuHistory;
}