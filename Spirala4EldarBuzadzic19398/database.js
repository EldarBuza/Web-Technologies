const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize('wt24', 'root', '#Password1', {
  host: 'localhost',
  dialect: 'mysql',
});

const initModels = () => {
  const models = {};
  models.Korisnik = require('./models/Korisnik')(sequelize);
  models.Nekretnina = require('./models/Nekretnina')(sequelize);
  models.Upit = require('./models/Upit')(sequelize);
  models.Zahtjev = require('./models/Zahtjev')(sequelize);
  models.Ponuda = require('./models/Ponuda')(sequelize);

  // Postavi relacije između modela, ako ih ima
  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  return { sequelize, ...models };
};

module.exports = { sequelize, initModels };
