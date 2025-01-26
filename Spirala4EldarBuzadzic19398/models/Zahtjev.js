const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Zahtjev = sequelize.define('Zahtjev', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
    trazeniDatum: { type: DataTypes.DATEONLY, allowNull: false },
    odobren: { type: DataTypes.BOOLEAN, defaultValue: null, allowNull: true },
    nekretnina_id: { type: DataTypes.INTEGER, allowNull: false },
    korisnik_id: { type: DataTypes.INTEGER, allowNull: false },
  },{ freezeTableName: true,});

  Zahtjev.associate = (models) => {
    Zahtjev.belongsTo(models.Korisnik, { foreignKey: 'korisnik_id' });
    Zahtjev.belongsTo(models.Nekretnina, { foreignKey: 'nekretnina_id' });
  };

  return Zahtjev;
};
