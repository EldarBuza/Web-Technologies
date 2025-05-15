const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Korisnik = sequelize.define('Korisnik', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ime: { type: DataTypes.STRING, allowNull: false },
    prezime: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false},
    password: { type: DataTypes.STRING, allowNull: false },
    admin: { type: DataTypes.BOOLEAN, defaultValue: false }
  },{freezeTableName: true,});

  Korisnik.associate = (models) => {
    Korisnik.hasMany(models.Upit, { foreignKey: 'korisnik_id' });
    Korisnik.hasMany(models.Zahtjev, { foreignKey: 'korisnik_id' });
    Korisnik.hasMany(models.Ponuda, { foreignKey: 'korisnik_id' });
  };

  return Korisnik;
};
