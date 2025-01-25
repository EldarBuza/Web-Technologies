function postaviCarousel(glavniElement, sviElementi, indeks = 0, ucitajNoveElemente) {
    if (!glavniElement || typeof ucitajNoveElemente !== 'function') {
        return null;
    }

    let brojPoziva = 0; // Broji koliko puta se carousel zavrti
    let stranica = 1;   // Broji trenutnu stranicu za učitavanje novih elemenata
    let sviPronadjeni = false; // Da li su svi elementi pronađeni

    // Funkcija za prikazivanje trenutnog elementa
    const prikaziElement = () => {
        if (sviElementi.length > 0) {
            glavniElement.innerHTML = sviElementi[indeks].outerHTML;
        } else {
            glavniElement.innerHTML = '<p>Nema elemenata za prikaz.</p>';
        }

    };

    // Funkcija za kretanje ulijevo
    const fnLijevo = () => {
        if (sviElementi.length === 0) return; // Spriječi greške
        indeks = (indeks - 1 + sviElementi.length) % sviElementi.length;
        prikaziElement();
        brojPoziva--;
    };

    // Funkcija za kretanje udesno
    const fnDesno = async () => {
        if (sviElementi.length === 0) return; // Spriječi greške
        brojPoziva++;

        // Nakon svakog trećeg poziva, učitaj nove elemente
        if (brojPoziva % 3 === 0 && !sviPronadjeni && sviElementi.length >= 3) {
             // Spriječi učitavanje novih elemenata ako su svi pronađeni
            const noviElementi = await ucitajNoveElemente(stranica);
            if (noviElementi.length > 0) {
                sviElementi.push(...noviElementi);
                stranica++; // Povećaj broj stranice nakon svakog uspješnog učitavanja
                if (noviElementi.length < 3) {
                    sviPronadjeni = true; // Svi elementi su pronađeni
                }
            }else{
                sviPronadjeni = true; // Svi elementi su pronađeni
            }
        }
        indeks = (indeks + 1) % sviElementi.length;

        prikaziElement();
    };

    // Inicijalno učitavanje elemenata ako je lista prazna
    const inicijaliziraj = async () => {
        if (sviElementi.length === 0) {
            const prviElementi = await ucitajNoveElemente(stranica);
            if (prviElementi.length > 0) {
                sviElementi.push(...prviElementi);
                stranica++; // Povećaj broj stranice nakon inicijalnog učitavanja
                if (prviElementi.length < 3) {
                    sviPronadjeni = true; // Svi elementi su pronađeni
                }
            }
            else{
                sviPronadjeni = true; // Svi elementi su pronađeni
            }
            indeks = 0; // Resetiraj indeks
        }
        prikaziElement();
    };

    // Pokreni inicijalizaciju
    inicijaliziraj();

    return { fnLijevo, fnDesno };
}

// Primjer funkcije za učitavanje novih elemenata sa servera
async function ucitajNoveUpite(idNekretnine, stranica = 0) {
    try {
        const response = await fetch(`/next/upiti/nekretnina${idNekretnine}?page=${stranica}`);
        if (!response.ok) {
            throw new Error('Greška prilikom učitavanja upita');
        }

        const podaci = await response.json();

        // Pretvori nove podatke u DOM elemente
        return podaci.map(upit => {
            const div = document.createElement('div');
            div.textContent = `Upit ID: ${upit.id}, Detalji: ${upit.detalji}`;
            return div;
        });
    } catch (error) {
        console.error('Greška prilikom učitavanja novih upita:', error);
        return [];
    }
}
