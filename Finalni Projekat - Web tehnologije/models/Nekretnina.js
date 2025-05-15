const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Nekretnina = sequelize.define('Nekretnina', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tip_nekretnine: { type: DataTypes.STRING, allowNull: false },
    naziv: { type: DataTypes.STRING, allowNull: false },
    kvadratura: { type: DataTypes.INTEGER, allowNull: false },
    cijena: { type: DataTypes.FLOAT, allowNull: false },
    tip_grijanja: { type: DataTypes.STRING, allowNull: false },
    lokacija: { type: DataTypes.STRING, allowNull: false },
    godina_izgradnje: { type: DataTypes.INTEGER, allowNull: false },
    datum_objave: { type: DataTypes.DATEONLY, allowNull: false },
    opis: { type: DataTypes.TEXT }
  },{freezeTableName: true,});

  Nekretnina.associate = (models) => {
    Nekretnina.hasMany(models.Upit, { foreignKey: 'nekretnina_id', as: 'upiti' });
    Nekretnina.hasMany(models.Zahtjev, { foreignKey: 'nekretnina_id' });
    Nekretnina.hasMany(models.Ponuda, { foreignKey: 'nekretnina_id' });

    Nekretnina.prototype.getInteresovanja = async function () {
      const upiti = await this.getUpiti();
      const zahtjevi = await this.getZahtjevi();
      const ponude = await this.getPonude();
      return { upiti, zahtjevi, ponude };
    };
  };

  return Nekretnina;
};
