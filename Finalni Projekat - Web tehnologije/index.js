const express = require('express');
const session = require("express-session");
const path = require('path');
const fs = require('fs').promises; // Using asynchronus API for file read and write
const {sequelize, initModels} = require('./database');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const app = express();
const PORT = 3000;

// Inicijalizuj modele
const models = initModels();
const { Korisnik, Nekretnina, Upit, Zahtjev, Ponuda } = models;
let adminIds = []; // Memorija za admin ID-ove

// Poveži se na bazu pre pokretanja servera
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Konekcija sa bazom je uspešno uspostavljena.');

    // Sinhronizuj tabele (opcionalno)
    await sequelize.sync({ alter: true });
    console.log('Tabele su uspešno sinhronizovane.');

    // Pokreni server
    app.listen(PORT, () => {
      console.log(`Server je pokrenut na http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Greška pri povezivanju sa bazom:', error);
  }
})();

app.use(session({
  secret: 'tajna sifra',
  resave: true,
  saveUninitialized: true
}));



app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.use(express.static(__dirname + '/public'));

// Enable JSON parsing without body-parser
app.use(express.json());

/* ---------------- SERVING HTML -------------------- */


const loginAttempts = {};


// Async function for serving html files
async function serveHTMLFile(req, res, fileName) {
  const htmlPath = path.join(__dirname, 'public/html', fileName);
  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    res.send(content);
  } catch (error) {
    console.error('Error serving HTML file:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
}

// Array of HTML files and their routes
const routes = [
  { route: '/nekretnine.html', file: 'nekretnine.html' },
  { route: '/detalji.html', file: 'detalji.html' },
  { route: '/meni.html', file: 'meni.html' },
  { route: '/prijava.html', file: 'prijava.html' },
  { route: '/profil.html', file: 'profil.html' },
  { route: '/mojiUpiti.html', file: 'mojiUpiti.html'},
];

// Loop through the array so HTML can be served
routes.forEach(({ route, file }) => {
  app.get(route, async (req, res) => {
    await serveHTMLFile(req, res, file);
  });
});

/* ----------- SERVING OTHER ROUTES --------------- */

// Async function for reading json data from data folder 
async function readJsonFile(filename) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    const rawdata = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(rawdata);
  } catch (error) {
    throw error;
  }
}

// Async function for reading json data from data folder 
async function saveJsonFile(filename, data) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw error;
  }
}

/*
Checks if the user exists and if the password is correct based on korisnici.json data. 
If the data is correct, the username is saved in the session and a success message is sent.
*/

async function logLoginAttempt(username, status) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] - username: "${username}" - status: "${status}"\n`;
  await fs.appendFile(path.join(__dirname, 'prijave.txt'), logEntry, 'utf-8');
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const currentTime = Date.now();

  // Ako nema zapisa za ovog korisnika, inicijaliziraj pokušaje
  if (!loginAttempts[username]) {
    loginAttempts[username] = { attempts: 0, lockUntil: 0 };
  }

  // Provjera da li je korisnik zaključan
  if (currentTime < loginAttempts[username].lockUntil) {
    await logLoginAttempt(username, 'Neuspješna prijava');
    return res.status(429).json({ greska: "Previše neuspješnih pokušaja. Pokušajte ponovo za 1 minutu." });
  }

  try {
    // Pronađi korisnika po username-u
    const korisnik = await Korisnik.findOne({ where: { username } });

    if (!korisnik) {
      // Povećaj broj pokušaja ako korisnik ne postoji
      loginAttempts[username].attempts += 1;
      await logLoginAttempt(username, 'Neuspješna prijava');

      // Ako su dosegnuta 3 pokušaja, zaključaj korisnika na 1 minutu
      if (loginAttempts[username].attempts === 3) {
        loginAttempts[username].lockUntil = currentTime + 60 * 1000;
        loginAttempts[username].attempts = 0; // Reset broj pokušaja
        return res.status(429).json({ greska: "Previše neuspješnih pokušaja. Pokušajte ponovo za 1 minutu." });
      }

      return res.status(401).json({ greska: "Neuspješna prijava" });
    }

    // Provjeri lozinku
    const isPasswordMatched = await bcrypt.compare(password, korisnik.password);

    if (isPasswordMatched) {
      // Ako je prijava uspješna, postavi sesiju i resetuj pokušaje
      req.session.username = korisnik.username;
      req.session.korisnik_id = korisnik.id;
      req.session.isAdmin = korisnik.admin; // Dodaj admin status u sesiju ako je potreban

      loginAttempts[username] = { attempts: 0, lockUntil: 0 };

      await logLoginAttempt(username, 'Uspješna prijava');
      return res.json({ poruka: 'Uspješna prijava' });
    } else {
      // Povećaj broj pokušaja ako lozinka nije tačna
      loginAttempts[username].attempts += 1;
      await logLoginAttempt(username, 'Neuspješna prijava');

      if (loginAttempts[username].attempts === 3) {
        loginAttempts[username].lockUntil = currentTime + 60 * 1000;
        loginAttempts[username].attempts = 0; // Reset broj pokušaja
        return res.status(429).json({ greska: "Previše neuspješnih pokušaja. Pokušajte ponovo za 1 minutu." });
      }

      return res.status(401).json({ greska: "Neuspješna prijava" });
    }
  } catch (error) {
    console.error('Greška tokom prijave:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});



/*
Delete everything from the session.
*/
app.post('/logout', (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Clear all information from the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).json({ greska: 'Internal Server Error' });
    } else {
      res.status(200).json({ poruka: 'Uspješno ste se odjavili' });
    }
  });
});

/*
Returns currently logged user data. First takes the username from the session and grabs other data
from the .json file.
*/
app.get('/korisnik', async (req, res) => {
  console.log('Session:', req.session);
  console.log(req.session.username);
  // Provjera da li korisnik ima aktivnu sesiju
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const username = req.session.username;

  try {
    // Pronađi korisnika u bazi prema korisničkom imenu iz sesije
    const korisnik = await Korisnik.findOne({ where: { username } });

    if (!korisnik) {
      // Ako korisnik nije pronađen
      return res.status(404).json({ greska: 'Korisnik nije pronađen' });
    }

    // Pripremi podatke korisnika za odgovor (bez lozinke)
    const userData = {
      id: korisnik.id,
      ime: korisnik.ime,
      prezime: korisnik.prezime,
      username: korisnik.username,
      admin: korisnik.admin,
    };

    // Pošalji podatke korisnika
    res.status(200).json(userData);
  } catch (error) {
    console.error('Greška prilikom dohvatanja korisnika:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


/*
Allows logged user to make a request for a property
*/
app.post('/upit', async (req, res) => {
  // Provera da li je korisnik autentifikovan 
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const { nekretnina_id, tekst_upita } = req.body;

  try {
    // Pronalaženje korisnika u bazi na osnovu sesije
    const loggedInUser = await Korisnik.findOne({ where: { username: req.session.username } });
    if (!loggedInUser) {
      return res.status(404).json({ greska: 'Korisnik nije pronađen' });
    }

    // Provera da li nekretnina postoji
    const nekretnina = await Nekretnina.findByPk(nekretnina_id);
    if (!nekretnina) {
      return res.status(400).json({ greska: `Nekretnina sa id-em ${nekretnina_id} ne postoji` });
    }

    // Brojanje upita korisnika za datu nekretninu
    const userQueryCount = await Upit.count({
      where: {
        korisnik_id: loggedInUser.id,
        nekretnina_id: nekretnina_id,
      },
    });

    if (userQueryCount >= 3) {
      return res.status(429).json({ greska: 'Previše upita za istu nekretninu.' });
    }

    // Kreiranje novog upita
    await Upit.create({
      tekst: tekst_upita,
      korisnik_id: loggedInUser.id,
      nekretnina_id: nekretnina_id,
    });

    res.status(200).json({ poruka: 'Upit je uspešno dodan' });
  } catch (error) {
    console.error('Greška prilikom obrade upita:', error);
    res.status(500).json({ greska: 'Interna greška servera' });
  }
});

/*
Updates any user field
*/
app.put('/korisnik', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Get data from the request body
  const { ime, prezime, username, password } = req.body;

  try {
    // Read user data from the JSON file
    const users = await readJsonFile('korisnici');

    // Find the user by username
    const loggedInUser = users.find((user) => user.username === req.session.username);

    if (!loggedInUser) {
      // User not found (should not happen if users are correctly managed)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Update user data with the provided values
    if (ime) loggedInUser.ime = ime;
    if (prezime) loggedInUser.prezime = prezime;
    if (username) loggedInUser.username = username;
    if (password) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      loggedInUser.password = hashedPassword;
    }

    // Save the updated user data back to the JSON file
    await saveJsonFile('korisnici', users);
    res.status(200).json({ poruka: 'Podaci su uspješno ažurirani' });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Returns all properties from the file.
*/
app.get('/nekretnine', async (req, res) => {
  try {
    // Dohvati sve nekretnine zajedno sa pripadajućim upitima
    const nekretnine = await Nekretnina.findAll({
      include: [
        {
          model: Upit,
          as: 'upiti', // Alias za pristup upitima
          attributes: ['id', 'nekretnina_id', 'tekst', 'korisnik_id'], // Polja koja želimo iz modela Upit
        },
      ],
    });

    // Pošalji podatke o nekretninama kao odgovor
    res.status(200).json(nekretnine);
  } catch (error) {
    console.error('Greška prilikom dohvatanja nekretnina:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});



/* ----------------- MARKETING ROUTES ----------------- */

// Route that increments value of pretrage for one based on list of ids in nizNekretnina
app.post('/marketing/nekretnine', async (req, res) => {
  const { nizNekretnina } = req.body;

  try {
    // Load JSON data
    let preferencije = await readJsonFile('preferencije');

    // Check format
    if (!preferencije || !Array.isArray(preferencije)) {
      console.error('Neispravan format podataka u preferencije.json.');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Init object for search
    preferencije = preferencije.map((nekretnina) => {
      nekretnina.pretrage = nekretnina.pretrage || 0;
      return nekretnina;
    });

    // Update atribute pretraga
    nizNekretnina.forEach((id) => {
      const nekretnina = preferencije.find((item) => item.id === id);
      if (nekretnina) {
        nekretnina.pretrage += 1;
      }
    });

    // Save JSON file
    await saveJsonFile('preferencije', preferencije);

    res.status(200).json({});
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const nekretninaData = preferencije.find((item) => item.id === parseInt(id, 10));

    if (nekretninaData) {
      // Update clicks
      nekretninaData.klikovi = (nekretninaData.klikovi || 0) + 1;

      // Save JSON file
      await saveJsonFile('preferencije', preferencije);

      res.status(200).json({ success: true, message: 'Broj klikova ažuriran.' });
    } else {
      res.status(404).json({ error: 'Nekretnina nije pronađena.' });
    }
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/pretrage', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, pretrage: nekretninaData ? nekretninaData.pretrage : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/klikovi', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON 
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, klikovi: nekretninaData ? nekretninaData.klikovi : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/nekretnine/top5', async (req, res) => {
  const { lokacija } = req.query; // Dobijanje lokacije iz query stringa

  if (!lokacija) {
    return res.status(400).json({ greska: 'Lokacija nije zadana.' });
  }

  try {
    // Pronađi nekretnine za zadanu lokaciju, uključi povezane upite, sortiraj i ograniči na 5
    const top5Properties = await Nekretnina.findAll({
      where: {
        lokacija: lokacija,
      },
      include: [
        {
          model: Upit,
          as: 'upiti', // Alias za pristup upitima
        },
      ],
      order: [['datum_objave', 'DESC']],
      limit: 5,
    });

    // Ako nema pronađenih nekretnina za zadanu lokaciju
    if (top5Properties.length === 0) {
      return res.status(404).json({ greska: `Nema nekretnina na lokaciji ${lokacija}.` });
    }

    // Odgovori sa top 5 nekretnina, uključujući njihove upite
    res.status(200).json(top5Properties);

  } catch (error) {
    console.error('Greška prilikom pretrage nekretnina:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});




app.get('/upiti/moji', async (req, res) => {
  if (!req.session.korisnik_id) {
    // Korisnik nije prijavljen
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  try {
    // Preuzimanje upita korisnika
    const userQueries = await Upit.findAll({
      where: { korisnik_id: req.session.korisnik_id },
      attributes: ['id', 'tekst', 'nekretnina_id'], // Odaberite samo potrebna polja
    });

    if (userQueries.length === 0) {
      return res.status(404).json([]); // Ako nema rezultata, vratite prazan niz
    }

    // Formatiranje odgovora
    const formattedQueries = userQueries.map((upit) => ({
      id_upita: upit.id,
      tekst_upita: upit.tekst,
      id_nekretnine: upit.nekretnina_id,
    }));

    res.status(200).json(formattedQueries);
  } catch (error) {
    console.error('Greška prilikom preuzimanja korisničkih upita:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});



app.get('/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Pronađi nekretninu po ID-u
    const nekretnina = await Nekretnina.findByPk(id, {
      include: [
        {
          model: Upit,
          as: 'upiti', // Alias za pristup upitima
          attributes: ['id', 'nekretnina_id', 'tekst', 'korisnik_id'],
          limit: 3, // Uzmi samo poslednja 3 upita
          order: [['id', 'DESC']], // Sortiraj opadajuće po ID-u (poslednji upiti)
        },
      ],
    });

    if (!nekretnina) {
      // Ako nekretnina nije pronađena
      return res.status(404).json({ greska: `Nekretnina sa ID-em ${id} nije pronađena.` });
    }

    // Formatiraj podatke nekretnine sa ograničenim brojem upita
    const nekretninaDetalji = {
      id: nekretnina.id,
      tip_nekretnine: nekretnina.tip_nekretnine,
      naziv: nekretnina.naziv,
      kvadratura: nekretnina.kvadratura,
      cijena: nekretnina.cijena,
      tip_grijanja: nekretnina.tip_grijanja,
      lokacija: nekretnina.lokacija,
      godina_izgradnje: nekretnina.godina_izgradnje,
      datum_objave: nekretnina.datum_objave,
      opis: nekretnina.opis,
      upiti: nekretnina.upiti, // Sequelize koristi definisani alias
    };

    res.status(200).json(nekretninaDetalji);
  } catch (error) {
    console.error('Greška prilikom preuzimanja detalja nekretnine:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.get('/next/upiti/nekretnina:id', async (req, res) => {
  const { id } = req.params;
  const { page } = req.query;

  // Validacija parametra page
  if (!page || isNaN(page) || page < 0) {
    return res.status(400).json({ greska: 'Neispravan broj stranice.' });
  }

  const upitiPoStranici = 3; // Broj upita po stranici

  try {
    // Proverite da li nekretnina postoji
    const nekretnina = await Nekretnina.findByPk(id);

    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa ID-em ${id} nije pronađena.` });
    }

    // Dohvatite ukupno upita vezanih za ovu nekretninu, sortiranih po datumu unosa (najnoviji prvi)
    const upiti = await Upit.findAll({
      where: { nekretnina_id: id },
      order: [['createdAt', 'DESC']],
      offset: page * upitiPoStranici,
      limit: upitiPoStranici,
    });

    if (upiti.length === 0) {
      return res.status(404).json({ greska: 'Nema upita za ovu stranicu.' });
    }

    // Vraćanje podataka kao JSON
    res.status(200).json({ upiti });
  } catch (error) {
    console.error('Greška pri dohvaćanju upita za nekretninu:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/nekretnina/:id/upiti', async (req, res) => {
    const {id} = req.params;
    try{
      const upiti = await Upit.findAll({
        where: {nekretnina_id: id},
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json(upiti);
    }catch(error){
      console.error('Greška prilikom dohvatanja upita:', error);
      res.status(500).json({greska: 'Internal Server Error'});
    }
});



app.get('/nekretnina/:id/interesovanja', async (req, res) => {
  const { id } = req.params;
  const korisnikId = req.session.korisnik_id;

  try {
    // Dohvatanje nekretnine
    const nekretnina = await Nekretnina.findByPk(id, {
      include: [
        { model: Upit, as: 'upiti' },
        { model: Zahtjev },
        { model: Ponuda, include: [{ model: Korisnik }] },
      ],
    });

    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa ID-em ${id} nije pronađena.` });
    }

    // Organizovanje interesovanja
    const upiti = nekretnina.upiti.map((upit) => ({
      id: upit.id,
      tekst: upit.tekst,
      korisnik_id: upit.korisnik_id,
      nekretnina_id: upit.nekretnina_id,
    }));

    const zahtjevi = nekretnina.Zahtjevs.map((zahtjev) => ({
      id: zahtjev.id,
      tekst: zahtjev.tekst,
      trazeniDatum: zahtjev.trazeniDatum,
      odobren: zahtjev.odobren,
      korisnik_id: zahtjev.korisnik_id,
      nekretnina_id: zahtjev.nekretnina_id,
    }));

    const ponude = nekretnina.Ponudas.map((ponuda) => {
      const isVisible = req.session.isAdmin || korisnikId === ponuda.korisnik_id || ponuda.korisnik_id === korisnikId;

      const rezultat = {
        id: ponuda.id,
        tekst: ponuda.tekst,
        datumPonude: ponuda.datumPonude,
        odbijenaPonuda: ponuda.odbijenaPonuda,
        korisnik_id: ponuda.korisnik_id,
        nekretnina_id: ponuda.nekretnina_id,
      };
    
      if (isVisible) {
        rezultat.cijenaPonude = ponuda.cijenaPonude;
      }
    
      return rezultat;
    });

    // Slanje rezultata kao JSON
    res.status(200).json({
      upiti,
      zahtjevi,
      ponude,
    });
  } catch (error) {
    console.error('Greška prilikom dohvatanja interesovanja:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

// Definicija validacijskog schemea za JSON body
const ponudaSchema = Joi.object({
  tekst: Joi.string().required(),
  ponudaCijene: Joi.alternatives().try(Joi.number(), Joi.valid(null)),
  datumPonude: Joi.date().required(),
  idVezanePonude: Joi.alternatives().try(Joi.number(), Joi.valid(null)),
  odbijenaPonuda: Joi.boolean().required(),
});

app.post('/nekretnina/:id/ponuda', async (req, res) => {
  const { id } = req.params;
  const korisnikId = req.session.korisnik_id;
  const isAdmin = req.session.isAdmin;

  // Validacija JSON body-a
  const { error, value } = ponudaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ greska: `Greška u podacima: ${error.details[0].message}` });
  }

  const { tekst, ponudaCijene, datumPonude, idVezanePonude, odbijenaPonuda } = value;

  try {
    // Provjera postoji li nekretnina
    const nekretnina = await Nekretnina.findByPk(id);
    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa ID-em ${id} nije pronađena.` });
    }

    if (!korisnikId) {
      return res.status(401).json({ greska: 'Pristup ovoj funkcionalnosti nije autorizovan!' });
    }

    // Provjera postoji li vezana ponuda ako je ID postavljen
    let vezanaPonuda = null;
    let ciljaniKorisnikId = null;
    let mozeDodatiPonudu = false;

    if (idVezanePonude) {
      vezanaPonuda = await Ponuda.findByPk(idVezanePonude);
      if (!vezanaPonuda) {
        return res.status(400).json({ greska: `Ponuda sa ID-em ${idVezanePonude} nije pronađena.` });
      }

      // Identifikacija korisnika
      ciljaniKorisnikId = isAdmin ? vezanaPonuda.korisnik_id : korisnikId;

      // Izvršavanje SQL upita za dohvaćanje vezanih ponuda
      const vezanePonude = await sequelize.query(
        `
        WITH VezanePonude AS (
          SELECT 
            p.*
          FROM 
            Ponuda p
          WHERE 
            p.korisnik_id = :ciljani_korisnik_id
            AND p.nekretnina_id = :nekretnina_id
          UNION ALL
          SELECT 
            p.*
          FROM 
            Ponuda p
          INNER JOIN 
            Ponuda v ON p.vezanaPonuda_id = v.id
          WHERE 
            v.korisnik_id = :ciljani_korisnik_id
            AND v.nekretnina_id = :nekretnina_id
        )
        SELECT * 
        FROM VezanePonude ORDER BY id DESC;
        `,
        {
          replacements: {
            ciljani_korisnik_id: ciljaniKorisnikId,
            nekretnina_id: id,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      console.log(vezanePonude);


      // Provjera odbijene ponude u nizu
      if (vezanePonude.some((p) => p.odbijenaPonuda)) {
        return res.status(400).json({ greska: 'Nove ponude se ne mogu dodavati jer postoji odbijena ponuda u nizu.' });
      }
      if (!isAdmin && vezanePonude[1].korisnik_id === korisnikId) {
        mozeDodatiPonudu = true;
      }
      for (let i = 0;i < vezanePonude.length; i++){
        if (vezanePonude[i].vezanaPonuda_id == vezanaPonuda.id){
          return res.status(400).json({ greska: 'Nove ponude se ne mogu dodavati jer postoji ponuda na ovu ponudu.' });
      }
    }
    }

    // Pravila za dodavanje ponuda
    if (!isAdmin && vezanaPonuda && !mozeDodatiPonudu) {
      return res.status(403).json({ greska: 'Nemate dozvolu za odgovaranje na ovu ponudu.' });
    }

    if (!isAdmin && odbijenaPonuda && !vezanaPonuda) {
      return res.status(400).json({ greska: 'Korisnik ne može kreirati početnu ponudu sa odbijanjem.' });
    }

    if (isAdmin && !vezanaPonuda) {
      return res.status(400).json({ greska: 'Admin ne može kreirati početnu ponudu.' });
    }
    
    if (isAdmin && vezanaPonuda.korisnik_id === korisnikId){
      return res.status(400).json({ greska: 'Admin ne može kreirati ponudu na svoju ponudu.' });
    }
    
    if (korisnikId === vezanaPonuda.korisnik_id){
      return res.status(400).json({ greska: 'Korisnik ne može kreirati ponudu na svoju ponudu.' });
    }

    // Kreiranje nove ponude
    const novaPonuda = await Ponuda.create({
      tekst,
      cijenaPonude: ponudaCijene,
      datumPonude,
      odbijenaPonuda: odbijenaPonuda || null,
      korisnik_id: korisnikId,
      nekretnina_id: id,
      vezanaPonuda_id: idVezanePonude || null,
    });

    res.status(200).json(novaPonuda);
  } catch (error) {
    console.error('Greška prilikom kreiranja ponude:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.post('/nekretnina/:id/zahtjev', async (req, res) => {
  const { id } = req.params;
  const korisnikId = req.session.korisnik_id;

  // Validacija JSON body-a
  const { tekst, trazeniDatum } = req.body;
  if (!korisnikId) {
    return res.status(401).json({ greska: 'Pristup ovoj funkcionalnosti nije autorizovan!' });
  }

  if (!tekst || !trazeniDatum) {
    return res.status(400).json({ greska: 'Nedostaju obavezni podaci: tekst i trazeniDatum.' });
  }

  const trazeniDatumObj = new Date(trazeniDatum);
  const trenutniDatum = new Date();

  if (isNaN(trazeniDatumObj) || trazeniDatumObj < trenutniDatum) {
    return res.status(400).json({ greska: 'Traženi datum mora biti validan i u budućnosti.' });
  }

  try {
    // Provjera postoji li nekretnina
    const nekretnina = await Nekretnina.findByPk(id);
    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa ID-em ${id} nije pronađena.` });
    }

    if (!korisnikId) {
      return res.status(401).json({ greska: 'Pristup ovoj funkcionalnosti nije autorizovan!' });
    }

    // Kreiranje zahtjeva
    const noviZahtjev = await Zahtjev.create({
      tekst,
      trazeniDatum: trazeniDatumObj,
      odobren: null, // Zadano je false prilikom kreiranja
      korisnik_id: korisnikId,
      nekretnina_id: id,
    });

    res.status(200).json(noviZahtjev);
  } catch (error) {
    console.error('Greška prilikom kreiranja zahtjeva:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.put('/nekretnina/:id/zahtjev/:zid', async (req, res) => {
  const { id, zid } = req.params;
  const { odobren, addToTekst } = req.body;
  const isAdmin = req.session.isAdmin;

  if (!isAdmin) {
    return res.status(403).json({ greska: 'Samo admin ima dozvolu za ovu akciju.' });
  }

  if (odobren === undefined) {
    return res.status(400).json({ greska: 'Parametar "odobren" je obavezan.' });
  }

  if (!odobren && (!addToTekst || addToTekst.trim() === '')) {
    return res.status(400).json({ greska: 'Parametar "addToTekst" je obavezan ako je "odobren" false.' });
  }

  try {
    // Provjera postoji li zahtjev
    const zahtjev = await Zahtjev.findByPk(zid);

    if (!zahtjev || zahtjev.nekretnina_id != id) {
      return res.status(404).json({ greska: `Zahtjev sa ID-em ${zid} za nekretninu ${id} nije pronađen.` });
    }

    // Ažuriranje zahtjeva
    zahtjev.odobren = odobren;

    if (addToTekst) {
      zahtjev.tekst += ` ODGOVOR ADMINA: ${addToTekst}`;
    }

    await zahtjev.save();

    res.status(200).json({ poruka: 'Zahtjev je uspješno ažuriran.', zahtjev });
  } catch (error) {
    console.error('Greška prilikom ažuriranja zahtjeva:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

const { Op } = require('sequelize');

app.get('/nekretnina/ponude/:id', async (req, res) => {
    const { id } = req.params; // ID nekretnine
    const korisnikId = req.session.korisnik_id; // Trenutno prijavljeni korisnik

    if (!korisnikId) {
        return res.status(401).json({ greska: 'Pristup ovoj funkcionalnosti nije autorizovan!' });
    }

    try {
        // Pronalaženje svih ponuda koje odgovaraju uslovima
        const ponude = await Ponuda.findAll({
          where: {
            nekretnina_id: id,
            [Op.or]: [
              { korisnik_id: korisnikId },
              { '$parentPonuda.korisnik_id$': korisnikId }
            ],
          },
          include: [
            { model: Korisnik },
            { model: Ponuda, as: 'parentPonuda' }
          ],
        });
        

        res.status(200).json(ponude);
    } catch (error) {
        console.error('Greška prilikom dohvatanja ponuda:', error);
        res.status(500).json({ greska: 'Internal Server Error' });
    }
});




app.get('/nekretnina/zahtjevi/:id', async (req, res) => {
    const { id } = req.params;
    const korisnikId = req.session.korisnik_id;
    if (!korisnikId) {
      return res.status(401).json({ greska: 'Pristup ovoj funkcionalnosti nije autorizovan!' });
    }
    try{
      if (req.session.isAdmin){
      const zahtjevi = await Zahtjev.findAll({
        where: { nekretnina_id: id },
      });
      res.status(200).json(zahtjevi);}
      else {
        let zahtjevi = await Zahtjev.findAll({
          where: { nekretnina_id: id, korisnik_id: korisnikId },
        });
        let ograniceniZahtjevi = await Zahtjev.findAll({
          attributes: ['id', 'tekst', 'trazeniDatum', 'odobren'],
          where: { nekretnina_id: id, korisnik_id: {[Op.ne]: korisnikId} },
        });
        rezultat = zahtjevi.concat(ograniceniZahtjevi);
        res.status(200).json(rezultat);
      }
    }catch(error){
      console.error('Greška prilikom dohvatanja zahtjeva:', error);
      res.status(500).json({ greska: 'Internal Server Error' });
    }
});

