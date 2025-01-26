const { Ponuda, sequelize } = require('./models'); // Pretpostavka da je model Upit već eksportovan

async function dodajPonude() {
  try {
    // Novi upiti za nekretninu sa ID-jem 1
    const novePonude = [
      {
        tekst: 'Maximalna ponuda koju mogu dati',
        korisnik_id: 2,
        nekretnina_id: 1,
        datumPonude: '2025-05-15',
        odbijenaPonuda: true,
        cijenaPonude: 100000,
      },
      {
        tekst: 'Koliko je zadnja ponuda?',
        korisnik_id: 1,
        nekretnina_id: 2,
        datumPonude: '2024-10-15',
        odbijenaPonuda: false,
        cijenaPonude: 120000,
      },
      {
        tekst: 'Mogu li ponuditi manje?',
        korisnik_id: 2,
        nekretnina_id: 2,
        datumPonude: '2023-11-25',
        odbijenaPonuda: true,
        cijenaPonude: 110000,
      },
      
    ];

    // Kreiraj upite u bazi
    const dodanePonude = await Ponuda.bulkCreate(novePonude);

    console.log('Dodane ponude:', dodanePonude);
    sequelize.close();
  } catch (error) {
    console.error('Greška prilikom dodavanja upita:', error);
  }
}

// Pozovi funkciju za dodavanje upita
dodajPonude();
