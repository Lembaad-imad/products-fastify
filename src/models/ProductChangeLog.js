
import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

export default (sequelize, DataTypes) => {
  const ProductChangeLog = sequelize.define(
    'ProductChangeLog',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      supplierId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: false,
      },
   
      action: {
        type: DataTypes.ENUM('added', 'removed', 'changed'),
        allowNull: false,
      },
      field: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      oldValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      newValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pollCycleAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'product_change_logs',
      timestamps: true,
      indexes: [
        { name: 'product_change_logs_supplier_idx', fields: ['supplierId'] },
        { name: 'product_change_logs_sku_idx', fields: ['sku'] },
        { name: 'product_change_logs_action_idx', fields: ['action'] },
        { name: 'product_change_logs_poll_cycle_idx', fields: ['pollCycleAt'] },
      ],
    }
  );

  ProductChangeLog.associate = (models) => {
 
  };

  return ProductChangeLog;
};