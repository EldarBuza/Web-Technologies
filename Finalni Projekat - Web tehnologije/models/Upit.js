const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Upit = sequelize.define('Upit', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
    korisnik_id: { type: DataTypes.INTEGER, allowNull: false },
    nekretnina_id: { type: DataTypes.INTEGER, allowNull: false }
  },{ freezeTableName: true, });

  Upit.associate = (models) => {
    Upit.belongsTo(models.Korisnik, { foreignKey: 'korisnik_id' });
    Upit.belongsTo(models.Nekretnina, { foreignKey: 'nekretnina_id' });
  };

  return Upit;
};
