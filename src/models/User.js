import { sequelize } from "../config/database.js";

export default function defineUser(sequelize, DataTypes) {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'user',
        defaultScope: {
            attributes: { exclude: ['password'] }
        },
        scopes: {
            withPassword: {
                attributes: { include: ['password'] }
            }
        }
    });

    User.associate = (models) => {
        User.hasMany(models.Product, { foreignKey: 'createdBy', as: 'createdProducts' });
    };

    return User;
}