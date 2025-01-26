const { Zahtjev, sequelize } = require('./models'); // Pretpostavka da je model Upit već eksportovan

async function dodajZahtjeve() {
  try {
    // Novi upiti za nekretninu sa ID-jem 1
    const noviZahtjevi = [
      {
        tekst: 'Da li je stan renoviran?',
        korisnik_id: 1,
        nekretnina_id: 1,
        trazeniDatum: '2021-05-15',
        odobren: false,
      },
      {
        tekst: 'Koji je status papira?',
        korisnik_id: 2,
        nekretnina_id: 2,
        trazeniDatum: '2021-10-15',
        odobren: true,
      },
      {
        tekst: 'Mogu li zakazati razgledanje?',
        korisnik_id: 1,
        nekretnina_id: 2,
        trazeniDatum: '2021-11-25',
        odobren: false,
      },
      
    ];

    // Kreiraj upite u bazi
    const dodaniZahtjevi = await Zahtjev.bulkCreate(noviZahtjevi);

    console.log('Dodani zahtjevi:', dodaniZahtjevi);
    sequelize.close();
  } catch (error) {
    console.error('Greška prilikom dodavanja upita:', error);
  }
}

// Pozovi funkciju za dodavanje upita
dodajZahtjeve();
