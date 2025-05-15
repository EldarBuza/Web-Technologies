const { Korisnik, sequelize } = require('./models'); // Prilagodite putanju modelu ako je drugačija
const bcrypt = require('bcrypt');

const dodajKorisnika = async () => {
  try {
    // Podaci za novog korisnika
    let hash = await bcrypt.hash('admin', 10);
    const noviKorisnik = {
      ime: 'Admin',
      prezime: 'User',
      username: 'admin',
      password: hash,
      admin: true
    };

    // Dodavanje korisnika u bazu
    const korisnik = await Korisnik.create(noviKorisnik);

    console.log('Novi korisnik je uspješno dodan:', korisnik);
    sequelize.close();
  } catch (error) {
    console.error('Greška prilikom dodavanja korisnika:', error);
  }
};

dodajKorisnika();