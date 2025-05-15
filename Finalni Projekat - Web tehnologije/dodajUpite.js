const { Upit, sequelize } = require('./models'); // Pretpostavka da je model Upit već eksportovan

async function dodajUpite() {
  try {
    // Novi upiti za nekretninu sa ID-jem 1
    const noviUpiti = [
      {
        tekst: 'Da li je stan renoviran?',
        korisnik_id: 1,
        nekretnina_id: 1,
      },
      {
        tekst: 'Koji je status papira?',
        korisnik_id: 2,
        nekretnina_id: 1,
      },
      {
        tekst: 'Mogu li zakazati razgledanje?',
        korisnik_id: 1,
        nekretnina_id: 1,
      },
    ];

    // Kreiraj upite u bazi
    const dodaniUpiti = await Upit.bulkCreate(noviUpiti);

    console.log('Dodani upiti:', dodaniUpiti);
    sequelize.close();
  } catch (error) {
    console.error('Greška prilikom dodavanja upita:', error);
  }
}

// Pozovi funkciju za dodavanje upita
dodajUpite();
