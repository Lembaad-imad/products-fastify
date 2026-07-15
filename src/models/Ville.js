export default (sequelize, DataTypes) => {
  const Ville = sequelize.define(
    'Ville',
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
      partenaireId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
        status: {
        type: DataTypes.ENUM('actif', 'inactif'),
        allowNull: false,
        defaultValue: 'actif',
      },
    },
    {
      tableName: 'villes',
      paranoid: true,
      timestamps: true,
      indexes: [{ name: 'villes_partenaire_idx', fields: ['partenaireId'] }],
    }
  );

  Ville.associate = (models) => {
    Ville.belongsTo(models.Partenaire, {
      foreignKey: 'partenaireId',
      as: 'partenaire',
    });

    Ville.hasMany(models.Zone, {
      foreignKey: 'villeId',
      as: 'zones',
    });
  };

  return Ville;
};