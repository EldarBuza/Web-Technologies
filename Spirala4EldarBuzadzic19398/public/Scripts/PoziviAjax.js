const PoziviAjax = (() => {

    // fnCallback se u svim metodama poziva kada stigne
    // odgovor sa servera putem Ajax-a
    // svaki callback kao parametre ima error i data,
    // error je null ako je status 200 i data je tijelo odgovora
    // ako postoji greška, poruka se prosljeđuje u error parametru
    // callback-a, a data je tada null

    function ajaxRequest(method, url, data, callback) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    callback(null, xhr.responseText);
                } else {
                    callback({ status: xhr.status, statusText: xhr.statusText }, null);
                }
            }
        };
        xhr.send(data ? JSON.stringify(data) : null);
    }

    // vraća korisnika koji je trenutno prijavljen na sistem
    function impl_getKorisnik(fnCallback) {
        let ajax = new XMLHttpRequest();

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    console.log('Uspješan zahtjev, status 200');
                    fnCallback(null, JSON.parse(ajax.responseText));
                } else if (ajax.status == 401) {
                    console.log('Neuspješan zahtjev, status 401');
                    fnCallback("error", null);
                } else {
                    console.log('Nepoznat status:', ajax.status);
                }
            }
        };

        ajax.open("GET", "http://localhost:3000/korisnik/", true);
        ajax.setRequestHeader("Content-Type", "application/json");
        ajax.send();
    }

    // ažurira podatke loginovanog korisnika
    function impl_putKorisnik(noviPodaci, fnCallback) {
        // Check if user is authenticated
        if (!req.session.username) {
            // User is not logged in
            return fnCallback({ status: 401, statusText: 'Neautorizovan pristup' }, null);
        }

        // Get data from request body
        const { ime, prezime, username, password } = noviPodaci;

        // Read user data from the JSON file
        const users = readJsonFile('korisnici');

        // Find the user by username
        const loggedInUser = users.find((user) => user.username === req.session.username);

        if (!loggedInUser) {
            // User not found (should not happen if users are correctly managed)
            return fnCallback({ status: 401, statusText: 'Neautorizovan pristup' }, null);
        }

        // Update user data with the provided values
        if (ime) loggedInUser.ime = ime;
        if (prezime) loggedInUser.prezime = prezime;
        if (username) loggedInUser.adresa = adresa;
        if (password) loggedInUser.brojTelefona = brojTelefona;

        // Save the updated user data back to the JSON file
        saveJsonFile('korisnici', users);

        fnCallback(null, { poruka: 'Podaci su uspješno ažurirani' });
    }

    // dodaje novi upit za trenutno loginovanog korisnika
    function impl_postUpit(nekretnina_id, tekst_upita, fnCallback) {
        if (!nekretnina_id || !tekst_upita) {
            return fnCallback({ status: 400, statusText: 'Nedostaju obavezni parametri.' }, null);
        }
        const url = `http://localhost:3000/upit`;
        ajaxRequest('POST', url, { nekretnina_id, tekst_upita }, (error, data) => {
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const upit = JSON.parse(data);
                    fnCallback(null, upit);
                } catch (parseError) {
                    fnCallback(parseError, null);
                }
            }
        });
    }

    function impl_getNekretnine(fnCallback) {
        // Koristimo AJAX poziv da bismo dohvatili podatke s servera
        ajaxRequest('GET', '/nekretnine', null, (error, data) => {
            // Ako se dogodi greška pri dohvaćanju podataka, proslijedi grešku kroz callback
            if (error) {
                fnCallback(error, null);
            } else {
                // Ako su podaci uspješno dohvaćeni, parsiraj JSON i proslijedi ih kroz callback
                try {
                    const nekretnine = JSON.parse(data);
                    fnCallback(null, nekretnine);
                } catch (parseError) {
                    // Ako se dogodi greška pri parsiranju JSON-a, proslijedi grešku kroz callback
                    fnCallback(parseError, null);
                }
            }
        });
    }

    function impl_postLogin(username, password, fnCallback) {
        var ajax = new XMLHttpRequest()

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4 && ajax.status == 200) {
                fnCallback(null, ajax.response)
            }
            else if (ajax.readyState == 4) {
                //desio se neki error
                fnCallback(ajax.statusText, null)
            }
        }
        ajax.open("POST", "http://localhost:3000/login", true)
        ajax.setRequestHeader("Content-Type", "application/json")
        var objekat = {
            "username": username,
            "password": password
        }
        forSend = JSON.stringify(objekat)
        ajax.send(forSend)
    }

    function impl_postLogout(fnCallback) {
        let ajax = new XMLHttpRequest()

        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4 && ajax.status == 200) {
                fnCallback(null, ajax.response)
            }
            else if (ajax.readyState == 4) {
                //desio se neki error
                fnCallback(ajax.statusText, null)
            }
        }
        ajax.open("POST", "http://localhost:3000/logout", true)
        ajax.send()
    }


    function impl_getTop5Nekretnina(lokacija, fnCallback) {
        // Provjera da li je lokacija proslijeđena
        if (!lokacija) {
            return fnCallback({ status: 400, statusText: 'Lokacija nije zadana.' }, null);
        }

        // Kreiranje URL-a sa query parametrom lokacija
        const url = `http://localhost:3000/nekretnine/top5?lokacija=${encodeURIComponent(lokacija)}`;
        // console.log(url);
        // Pozivanje ajaxRequest funkcije koja vrši AJAX poziv prema serveru
        ajaxRequest('GET', url, null, (error, data) => {
            // Ako dođe do greške, pozivam callback sa greškom
            if (error) {
                fnCallback(error, null);
            } else {
                try {
                    const nekretnine = JSON.parse(data);
                    fnCallback(null, nekretnine);
                } catch (parseError) {
                    // Ako dođe do greške pri parsiranju odgovora, pozivam callback sa greškom
                    fnCallback(parseError, null);
                }
            }
    });
}

function impl_getMojiUpiti(fnCallback) {
    ajaxRequest('GET', 'http://localhost:3000/upiti/moji', null, (error, data) => {
        if (error) {
            fnCallback(error, null);
        } else {
            try {
                const upiti = JSON.parse(data);
                fnCallback(null, upiti);
            } catch (parseError) {
                fnCallback(parseError, null);
            }
        }
    });
}

function impl_getNekretnina(nekretnina_id, fnCallback) {
    const url = `http://localhost:3000/nekretnina/${nekretnina_id}`;
    ajaxRequest('GET', url, null, (error, data) => {
        if (error) {
            fnCallback(error, null);
        } else {
            try {
                const nekretnina = JSON.parse(data);
                fnCallback(null, nekretnina);
            } catch (parseError) {
                fnCallback(parseError, null);
            }
        }
    });
}

function impl_getNextUpiti(nekretnina_id, page, fnCallback) {
    const url = `http://localhost:3000/next/upiti/nekretnina${nekretnina_id}?page=${page}`;
    ajaxRequest('GET', url, null, (error, data) => {
        if (error) {
            fnCallback(error, null);
        } else {
            try {
                const upiti = JSON.parse(data);
                console.log(upiti);
                fnCallback(null, upiti);
            } catch (parseError) {
                fnCallback(parseError, null);
            }
        }
    });
}

function impl_getPonude(nekretnina_id, fnCallback) {
    if (!nekretnina_id) {
        // Ako ID nije proslijeđen, poziva se callback s greškom
        return fnCallback({ status: 400, statusText: 'ID nekretnine nije proslijeđen.' }, null);
    }

    // Kreiramo URL za poziv
    const url = `/nekretnina/ponude/${nekretnina_id}`;

    // Koristimo ajaxRequest za slanje GET zahtjeva
    ajaxRequest('GET', url, null, (error, data) => {
        if (error) {
            // Ako dođe do greške, prosljeđujemo je kroz callback
            fnCallback(error, null);
        } else {
            try {
                // Parsiramo odgovor ako je uspješan
                const ponude = JSON.parse(data);
                fnCallback(null, ponude);
            } catch (parseError) {
                // Ako se desi greška pri parsiranju JSON-a, prosljeđujemo je
                fnCallback(parseError, null);
            }
        }
    });
}

/**
   * Metoda za slanje ponude na određenu nekretninu.
   * @param {number} nekretnina_id - ID nekretnine.
   * @param {object} podaciPonude - Podaci za ponudu.
   * @param {string} podaciPonude.tekst - Tekst ponude.
   * @param {number} podaciPonude.ponudaCijene - Cijena ponude.
   * @param {string} podaciPonude.datumPonude - Datum ponude.
   * @param {number|null} [podaciPonude.idVezanePonude] - ID vezane ponude (ako postoji).
   * @param {boolean} [podaciPonude.odbijenaPonuda] - Da li je ponuda odbijena.
   * @param {function} fnCallback - Callback funkcija za odgovor.
   */
function impl_postPonuda(nekretnina_id, podaciPonude, fnCallback) {
    if (!nekretnina_id || !podaciPonude) {
      return fnCallback({ status: 400, statusText: 'ID nekretnine ili podaci ponude nisu proslijeđeni.' }, null);
    }

    const url = `/nekretnina/${nekretnina_id}/ponuda`;

    ajaxRequest('POST', url, podaciPonude, (error, data) => {
      if (error) {
        fnCallback(error, null);
      } else {
        try {
          const odgovor = JSON.parse(data);
          console.log(odgovor);
          fnCallback(null, odgovor);
        } catch (parseError) {
          fnCallback(parseError, null);
        }
      }
    });
  }

  function impl_getPonude(nekretnina_id, fnCallback) {
    if (!nekretnina_id) {
      // Ako ID nije proslijeđen, poziva se callback s greškom
      return fnCallback({ status: 400, statusText: 'ID nekretnine nije proslijeđen.' }, null);
    }

    // Kreiramo URL za poziv
    const url = `/nekretnina/ponude/${nekretnina_id}`;

    // Koristimo ajaxRequest za slanje GET zahtjeva
    ajaxRequest('GET', url, null, (error, data) => {
      if (error) {
        // Ako dođe do greške, prosljeđujemo je kroz callback
        fnCallback(error, null);
      } else {
        try {
          // Parsiramo odgovor ako je uspješan
          const ponude = JSON.parse(data);
          fnCallback(null, ponude);
        } catch (parseError) {
          // Ako se desi greška pri parsiranju JSON-a, prosljeđujemo je
          fnCallback(parseError, null);
        }
      }
    });
  }

  function impl_postZahtjev(nekretnina_id, tekst, trazeniDatum, fnCallback) {
    if (!nekretnina_id || !tekst || !trazeniDatum) {
      return fnCallback({ status: 400, statusText: 'Nedostaju obavezni parametri.' }, null);
    }

    const url = `http://localhost:3000/nekretnina/${nekretnina_id}/zahtjev`;
    ajaxRequest('POST', url, {tekst, trazeniDatum }, (error, data) => {
      if (error) {
        fnCallback(error, null);
      } else {
        try {
          const zahtjev = JSON.parse(data);
          fnCallback(null, zahtjev);
        } catch (parseError) {
          fnCallback(parseError, null);
        }
      }
    });
  }

  function impl_getSveUpite(nekretnina_id, fnCallback){
    ajaxRequest('GET', `http://localhost:3000/nekretnina/${nekretnina_id}/upiti`, null, (error, data) => {
        if (error) {
            fnCallback(error, null);
        } else {
            try {
                const upiti = JSON.parse(data);
                fnCallback(null, upiti);
            } catch (parseError) {
                fnCallback(parseError, null);
            }
        }
    });
  }

  function impl_getZahtjev(nekretnina_id, fnCallback){
    ajaxRequest('GET', `http://localhost:3000/nekretnina/zahtjevi/${nekretnina_id}`, null, (error, data) => {
        if (error) {
            fnCallback(error, null);
        } else {
            try {
                const zahtjevi = JSON.parse(data);
                fnCallback(null, zahtjevi);
            } catch (parseError) {
                fnCallback(parseError, null);
            }
  }
  });
}

    return {
        postLogin: impl_postLogin,
        postLogout: impl_postLogout,
        getKorisnik: impl_getKorisnik,
        putKorisnik: impl_putKorisnik,
        postUpit: impl_postUpit,
        getNekretnine: impl_getNekretnine,
        getTop5Nekretnina: impl_getTop5Nekretnina,  // Nova metoda 1 dodana
        getMojiUpiti: impl_getMojiUpiti, // Nova metoda 2 dodana
        getNekretnina: impl_getNekretnina, // Nova metoda 3 dodana
        getNextUpiti: impl_getNextUpiti, // Nova metoda 4 dodana
        getPonude: impl_getPonude, // Nova metoda 5 dodana
        postPonuda: impl_postPonuda, // Nova metoda 6 dodana
        getPonude: impl_getPonude, // Nova metoda 7 dodana
        postZahtjev: impl_postZahtjev, // Nova metoda 8 dodana
        getSveUpite: impl_getSveUpite, // Nova metoda 9 dodana
        getZahtjevi: impl_getZahtjev // Nova metoda 10 dodana
    };
})();