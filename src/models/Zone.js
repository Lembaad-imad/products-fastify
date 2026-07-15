export default (sequelize, DataTypes) => {
  const Zone = sequelize.define(
    'Zone',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      villeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      endpoint: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('actif', 'inactif'),
        allowNull: false,
        defaultValue: 'actif',
      },
      integrationType: {
        type: DataTypes.ENUM('json', 'file', 'api', 'xml'),
        allowNull: false,
        defaultValue: 'api',
      },
      productType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastSync: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM('connecte', 'erreur', 'desactive'),
        allowNull: false,
        defaultValue: 'desactive',
      },
    },
    {
      tableName: 'zones',
      paranoid: true,
      timestamps: true,
      indexes: [{ name: 'zones_ville_idx', fields: ['villeId'] }],
    }
  );

  Zone.associate = (models) => {
    Zone.belongsTo(models.Ville, {
      foreignKey: 'villeId',
      as: 'ville',
    });

    Zone.hasMany(models.Product, {
      foreignKey: 'zoneId',
      as: 'products',
    });
  };

  return Zone;
};