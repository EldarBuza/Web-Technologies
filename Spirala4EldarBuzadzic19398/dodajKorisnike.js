const { sequelize, initModels } = require('./database');
const fs = require('fs').promises;

(async () => {
  try {
    // Inicijalizacija modela
    const models = initModels();
    const { Korisnik } = models;

    // Poveži se na bazu
    await sequelize.authenticate();
    console.log('Konekcija sa bazom je uspešno uspostavljena.');

    // Učitaj podatke iz korisnik.json datoteke
    const korisniciData = await fs.readFile('./data/korisnici.json', 'utf-8');
    const korisnici = JSON.parse(korisniciData);

    // Dodaj korisnike u tabelu Korisnik
    for (const korisnik of korisnici) {
      await Korisnik.create({
        ime: korisnik.ime,
        prezime: korisnik.prezime,
        username: korisnik.username,
        password: korisnik.password, // Lozinke su već hashed
      });
    }

    console.log('Podaci su uspešno uneti u tabelu Korisnik.');
  } catch (error) {
    console.error('Greška pri unosu podataka:', error);
  } finally {
    // Zatvori konekciju sa bazom
    await sequelize.close();
    console.log('Konekcija sa bazom zatvorena.');
  }
})();
