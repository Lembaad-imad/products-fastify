export default (sequelize, DataTypes) => {
  const Partenaire = sequelize.define(
    'Partenaire',
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
      contact: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
        status: {
        type: DataTypes.ENUM('actif', 'inactif'),
        allowNull: false,
        defaultValue: 'actif',
      },
    },
    {
      tableName: 'partenaires',
      paranoid: true,
      timestamps: true,
    }
  );

  Partenaire.associate = (models) => {
    Partenaire.hasMany(models.Ville, {
      foreignKey: 'partenaireId',
      as: 'villes',
    });
  };

  return Partenaire;
};