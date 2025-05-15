const { allow } = require('joi');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ponuda = sequelize.define('Ponuda', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tekst: { type: DataTypes.TEXT, allowNull: false },
    cijenaPonude: { type: DataTypes.FLOAT, allowNull: true },
    datumPonude: { type: DataTypes.DATEONLY, allowNull: false },
    odbijenaPonuda: { type: DataTypes.BOOLEAN, defaultValue: null, allowNull: true },
    korisnik_id: { type: DataTypes.INTEGER, allowNull: false },
    nekretnina_id: { type: DataTypes.INTEGER, allowNull: false },
    vezanaPonuda_id: { type: DataTypes.INTEGER, allowNull: true }, // Veza na prethodnu ponudu ako postoji

    // Virtualni atribut za vezane ponude
    vezanePonude: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('vezanePonude') || [];
      },
      set(value) {
        this.setDataValue('vezanePonude', value);
      },
    },
  }, {freezeTableName: true,});

  Ponuda.associate = (models) => {
    Ponuda.belongsTo(models.Korisnik, { foreignKey: 'korisnik_id' });
    Ponuda.belongsTo(models.Nekretnina, { foreignKey: 'nekretnina_id' });
    Ponuda.belongsTo(models.Ponuda, { foreignKey: 'vezanaPonuda_id', as: 'parentPonuda' }); // Relacija za vezanu ponudu
    Ponuda.hasMany(models.Ponuda, { foreignKey: 'vezanaPonuda_id', as: 'childPonude' });   // Relacija za sve odgovore na ovu ponudu
  };

  // Metoda za dohvaćanje svih vezanih ponuda
  Ponuda.prototype.fetchVezanePonude = async function () {
    const sveVezane = await Ponuda.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { id: this.id },
          { vezanaPonuda_id: this.id },
        ],
      },
    });

    // Sortiranje ponuda po hijerarhiji (npr., po ID-ju ili datumu)
    const sortiranePonude = sveVezane.sort((a, b) => new Date(a.datumPonude) - new Date(b.datumPonude));
    this.setDataValue('vezanePonude', sortiranePonude);
    return sortiranePonude;
  };

  return Ponuda;
};
