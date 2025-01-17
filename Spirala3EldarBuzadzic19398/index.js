const express = require('express');
const session = require("express-session");
const path = require('path');
const fs = require('fs').promises; // Using asynchronus API for file read and write
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

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
  // Practical for adding more .html files as the project grows
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
  const logEntry = `[${timestamp}] - username: "${username}" - status: "${status}"
`;
  await fs.appendFile(path.join(__dirname, 'prijave.txt'), logEntry, 'utf-8');
}

app.post('/login', async (req, res) => {
  const jsonObj = req.body;
  console.log('Request body:', jsonObj);
  const currentTime = Date.now();

  if (!loginAttempts[jsonObj.username]) {
    loginAttempts[jsonObj.username] = { attempts: 0, lockUntil: 0 };
  }

  if (currentTime < loginAttempts[jsonObj.username].lockUntil) {
    await logLoginAttempt(jsonObj.username, 'neuspješno - zaključan');
    return res.status(429).json({ greska: "Previse neuspjesnih pokusaja. Pokusajte ponovo za 1 minutu." });
  }

  try {
    const data = await fs.readFile(path.join(__dirname, 'data', '../data/korisnici.json'), 'utf-8');
    const korisnici = JSON.parse(data);
    let found = false;

    for (const korisnik of korisnici) {
      if (korisnik.username == jsonObj.username) {
        const isPasswordMatched = await bcrypt.compare(jsonObj.password, korisnik.password);
        console.log(`Comparing password: ${jsonObj.password} with hash: ${korisnik.password} - Match: ${isPasswordMatched}`);

        if (isPasswordMatched) {
          req.session.username = korisnik.username;
          loginAttempts[jsonObj.username] = { attempts: 0, lockUntil: 0 };
          found = true;
          break;
        }
      }
    }

    if (found) {
      await logLoginAttempt(jsonObj.username, 'uspješno');
      res.json({ poruka: 'Uspješna prijava' });
    } else {
      loginAttempts[jsonObj.username].attempts += 1;
      await logLoginAttempt(jsonObj.username, 'neuspješno');

      if (loginAttempts[jsonObj.username].attempts >= 3) {
        loginAttempts[jsonObj.username].lockUntil = currentTime + 60 * 1000;
        loginAttempts[jsonObj.username].attempts = 0;
      }
      res.json({ poruka: 'Neuspješna prijava' });
    }
  } catch (error) {
    console.error('Error during login:', error);
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
  // Check if the username is present in the session
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // User is logged in, fetch additional user data
  const username = req.session.username;

  try {
    // Read user data from the JSON file
    const users = await readJsonFile('korisnici');

    // Find the user by username
    const user = users.find((u) => u.username === username);

    if (!user) {
      // User nije pronađen (ne bi se trebalo dogoditi ako su korisnici ispravno upravljani)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Send user data
    const userData = {
      id: user.id,
      ime: user.ime,
      prezime: user.prezime,
      username: user.username,
      password: user.password 
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Allows logged user to make a request for a property
*/
const userQueries = {};
app.post('/upit', async (req, res) => {
  // Check if the user is authenticated
  // req.session.user = { username: 'username1' }; // Simuliranje autentifikacije korisnika radi testiranja
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Get data from the request body
  const { nekretnina_id, tekst_upita } = req.body;

  try {

    const users = await readJsonFile('korisnici');


    const nekretnine = await readJsonFile('nekretnine');


    const loggedInUser = users.find((user) => user.username === req.session.username);


    const nekretnina = nekretnine.find((property) => property.id === nekretnina_id);

    if (!nekretnina) {

      return res.status(400).json({ greska: `Nekretnina sa id-em ${nekretnina_id} ne postoji` });
    }

    const userQueryCount = nekretnina.upiti.filter((upit) => upit.korisnik_id === loggedInUser.id).length;
    
    if (userQueryCount >= 3) {
      return res.status(429).json({ greska: "Previse upita za istu nekretninu." });
    }


    nekretnina.upiti.push({
      korisnik_id: loggedInUser.id,
      tekst_upita: tekst_upita
    });

    /*if (!userQueries[loggedInUser.username]) {
      userQueries[loggedInUser.username] = {};
    }
    userQueries[loggedInUser.username][nekretnina_id] = userQueryCount + 1;*/


    await saveJsonFile('nekretnine', nekretnine);

    res.status(200).json({ poruka: 'Upit je uspješno dodan' });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
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
    const nekretnineData = await readJsonFile('nekretnine');
    res.json(nekretnineData);
  } catch (error) {
    console.error('Error fetching properties data:', error);
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
  const { lokacija } = req.query;  // Get the location from the query string

  if (!lokacija) {
    return res.status(400).json({ greska: 'Lokacija nije zadana.' });
  }

  try {
    // Read properties data from the JSON file
    const nekretnine = await readJsonFile('nekretnine');

    // Filter properties by location
    const filteredProperties = nekretnine.filter(nekretnina => nekretnina.lokacija.toLowerCase() === lokacija.toLowerCase());

    // If no properties found for the location
    if (filteredProperties.length === 0) {
      return res.status(404).json({ greska: `Nema nekretnina na lokaciji ${lokacija}.` });
    }

    // Sort by 'datum_objave' in descending order to get the most recent ones
    filteredProperties.sort((a, b) => new Date(b.datum_objave) - new Date(a.datum_objave));

    // Get the top 5 properties
    const top5Properties = filteredProperties.slice(0, 5);

    // Respond with the top 5 properties
    res.status(200).json(top5Properties);

  } catch (error) {
    console.error('Greška prilikom čitanja nekretnina:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.get('/upiti/moji', async (req, res) => {
  // Simuliranje autentifikacije korisnika, postavljanjem korisnik_id
  req.session.korisnik_id = 2; // Simulacija korisnika sa id-em 2

  if (!req.session.korisnik_id) {
    // Korisnik nije prijavljen
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  try {
    const nekretnine = await readJsonFile('nekretnine');

    const userQueries = [];
    nekretnine.forEach(nekretnina => {
      nekretnina.upiti.forEach(upit => {
        if (upit.korisnik_id === req.session.korisnik_id) {  // Koristite korisnik_id
          userQueries.push({
            id_nekretnine: nekretnina.id,
            tekst_upita: upit.tekst_upita
          });
        }
      });
    });

    if (userQueries.length === 0) {
      return res.status(404).json([]);
    }

    res.status(200).json(userQueries);
  } catch (error) {
    console.error('Error fetching user queries:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Read properties data from the JSON file
    const nekretnine = await readJsonFile('nekretnine');

    // Find the property with the given ID
    const nekretnina = nekretnine.find((item) => item.id === parseInt(id, 10));

    if (!nekretnina) {
      // If the property is not found
      return res.status(404).json({ greska: `Nekretnina sa ID-em ${id} nije pronađena.` });
    }

    // Limit the upiti list to the last 3
    const limitedUpiti = nekretnina.upiti.slice(-3);

    // Return the property details with the limited upiti list
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
      upiti: limitedUpiti  // Return only the last 3 inquiries
    };

    // Send the property details as JSON response
    res.status(200).json(nekretninaDetalji);

  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/next/upiti/nekretnina:id', async (req, res) => {
  const { id } = req.params; 
  const { page } = req.query;

  // Provjera da li je stranica validan broj
  if (!page || isNaN(page) || page < 0) {  // Dozvoljava stranice početi od 0
    return res.status(400).json({ greska: 'Neispravan broj stranice.' }); // Ovo sam dodao u slučaju da neko unese nešto što nije broj, ili negativan broj.
  }

  try {
    const nekretnine = await readJsonFile('nekretnine');
    // Traženje nekretnine prema ID-u
    const nekretnina = nekretnine.find((item) => item.id === parseInt(id, 10));
    if (!nekretnina) {
      // Ako nekretnina nije pronađena
      return res.status(404).json({ greska: `Nekretnina sa ID-em ${id} nije pronađena.` });
    }
    // Maksimalno 3 upita po stranici
    const upitiPoStranici = 3;
    const startIndex = page * upitiPoStranici;  // Početni indeks, stranica počinje od 0, navedeno je da treba za page = 0 prikazati prva 3 upita
    const endIndex = startIndex + upitiPoStranici;

    // Filtriranje upita za prikaz na određenoj stranici po uputama rute, koristim slice metodu da ostavim samo upite za određenu stranicu
    const upitiNaStranici = nekretnina.upiti.slice(startIndex, endIndex);

    if (upitiNaStranici.length === 0) {
      return res.status(404).json({ greska: 'Nema upita za ovu stranicu.' });
    }

    // Vraćanje rezultata
    res.status(200).json(upitiNaStranici);
  } catch (error) {
    console.error('Greška pri dohvaćanju upita za nekretninu:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
