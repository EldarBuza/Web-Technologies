function spojiNekretnine(divReferenca, instancaModula, tip_nekretnine) {
    // pozivanje metode za filtriranje
    const filtriraneNekretnine = instancaModula.filtrirajNekretnine({ tip_nekretnine: tip_nekretnine });

    // iscrtavanje elemenata u divReferenca element

    // Ciscenje svih elemenata liste
    divReferenca.innerHTML = '';

    if (filtriraneNekretnine.length === 0) {
        divReferenca.innerHTML = '<p>Trenutno nema dostupnih nekretnina ovoga tipa.</p>';
    } else {
        filtriraneNekretnine.forEach(nekretnina => {
            const nekretninaElement = document.createElement('div');
            if (tip_nekretnine === "Stan") {
                nekretninaElement.classList.add('nekretnina', 'stan');
                nekretninaElement.id = `${nekretnina.id}`;
            }
            else if (tip_nekretnine === "Kuća") {
                nekretninaElement.classList.add('nekretnina', 'kuca');
                nekretninaElement.id = `${nekretnina.id}`;
            }
            else {
                nekretninaElement.classList.add('nekretnina', 'pp');
                nekretninaElement.id = `${nekretnina.id}`;
            }

            // Added search and click count divs
            const pretrageDiv = document.createElement('div');
            pretrageDiv.id = `pretrage-${nekretnina.id}`;
            pretrageDiv.textContent = `pretrage: ${nekretnina.pretrage || 0}`;
            nekretninaElement.appendChild(pretrageDiv);

            const klikoviDiv = document.createElement('div');
            klikoviDiv.id = `klikovi-${nekretnina.id}`;
            klikoviDiv.textContent = `klikovi: ${nekretnina.klikovi || 0}`;
            nekretninaElement.appendChild(klikoviDiv);

            const slikaElement = document.createElement('img');
            slikaElement.classList.add('slika-nekretnine');
            slikaElement.src = `../Resources/${nekretnina.id}.jpg`;
            slikaElement.alt = nekretnina.naziv;
            nekretninaElement.appendChild(slikaElement);

            const detaljiElement = document.createElement('div');
            detaljiElement.classList.add('detalji-nekretnine');
            detaljiElement.innerHTML = `
                <h3>${nekretnina.naziv}</h3>
                <p>Kvadratura: ${nekretnina.kvadratura} m²</p>
            `;
            nekretninaElement.appendChild(detaljiElement);

            const cijenaElement = document.createElement('div');
            cijenaElement.classList.add('cijena-nekretnine');
            cijenaElement.innerHTML = `<p>Cijena: ${nekretnina.cijena} BAM</p>`;
            nekretninaElement.appendChild(cijenaElement);

            const detaljiDugme = document.createElement('a');
            //detaljiDugme.href = '../HTML/detalji.html'; // hardkodiran html
            detaljiDugme.classList.add('detalji-dugme');
            detaljiDugme.textContent = 'Detalji';
            detaljiDugme.addEventListener('click', function () {
                const idNekretnine = nekretnina.id;
                MarketingAjax.klikNekretnina(idNekretnine);
                detaljiDugme.href = `../HTML/detalji.html?id=${idNekretnine}`;
            });
            nekretninaElement.appendChild(detaljiDugme);

            // Dodavanje kreiranog elementa u divReferenci
            divReferenca.appendChild(nekretninaElement);
        });
    }
}

const listaNekretnina = []

const listaKorisnika = []

const divStan = document.getElementById("stan");
const divKuca = document.getElementById("kuca");
const divPp = document.getElementById("pp");

// Instanciranje modula
let nekretnine = SpisakNekretnina();

// Pozivamo funkciju za dohvat nekretnina sa servera
PoziviAjax.getNekretnine((error, listaNekretnina) => {
    if (error) {
        console.error("Greška prilikom dohvatanja nekretnina sa servera:", error);
    } else {
        // Inicijalizacija modula sa dobavljenim podacima
        nekretnine.init(listaNekretnina, listaKorisnika);

        // Pozivamo funkciju za prikaz nekretnina
        spojiNekretnine(divStan, nekretnine, "Stan");
        spojiNekretnine(divKuca, nekretnine, "Kuća");
        spojiNekretnine(divPp, nekretnine, "Poslovni prostor");
    }
});

function filtrirajNekretnine(filtriraneNekretnine) {
    const filtriraneNekretnineInstance = SpisakNekretnina();
    filtriraneNekretnineInstance.init(filtriraneNekretnine, listaKorisnika);

    spojiNekretnine(divStan, filtriraneNekretnineInstance, "Stan");
    spojiNekretnine(divKuca, filtriraneNekretnineInstance, "Kuća");
    spojiNekretnine(divPp, filtriraneNekretnineInstance, "Poslovni prostor");
}

function filtrirajOnClick() {
    const kriterij = {
        min_cijena: parseFloat(document.getElementById('minCijena').value) || 0,
        max_cijena: parseFloat(document.getElementById('maxCijena').value) || Infinity,
        min_kvadratura: parseFloat(document.getElementById('minKvadratura').value) || 0,
        max_kvadratura: parseFloat(document.getElementById('maxKvadratura').value) || Infinity
    };

    const filtriraneNekretnine = nekretnine.filtrirajNekretnine(kriterij);

    MarketingAjax.novoFiltriranje(
        filtriraneNekretnine.map(nekretnina => nekretnina.id)
    );

    filtrirajNekretnine(filtriraneNekretnine);
}

document.getElementById('dugmePretraga').addEventListener('click', filtrirajOnClick);

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lokacija = urlParams.get('lokacija');
    console.log(lokacija);

    if (lokacija) {
        // Pozivanje metode za dohvaćanje top 5 nekretnina na osnovu lokacije
        PoziviAjax.getTop5Nekretnina(lokacija, (error, nekretnine) => {
            if (error) {
                console.error('Greška prilikom dohvaćanja top 5 nekretnina:', error);
                alert('Došlo je do greške pri učitavanju podataka.');
                return;
            }
            console.log(nekretnine);
            prikaziTop5Nekretnine(nekretnine);
        });
    }
});

// Funkcija za prikazivanje top 5 nekretnina na stranici
function prikaziTop5Nekretnine(nekretnine) {
    // Ciljane sekcije za različite tipove nekretnina
    const divStan = document.getElementById("stan");
    const divKuca = document.getElementById("kuca");
    const divPp = document.getElementById("pp");

    // Čišćenje svih sekcija
    divStan.innerHTML = '';
    divKuca.innerHTML = '';
    divPp.innerHTML = '';
    const dohvaceneNekretnineInstance = SpisakNekretnina();
    dohvaceneNekretnineInstance.init(nekretnine, listaKorisnika);
    spojiNekretnine(divStan, dohvaceneNekretnineInstance, "Stan");
    spojiNekretnine(divKuca, dohvaceneNekretnineInstance, "Kuća");
    spojiNekretnine(divPp, dohvaceneNekretnineInstance, "Poslovni prostor");
    
}


setInterval(() => {
    MarketingAjax.osvjeziPretrage(document.getElementById('divNekretnine'));
    MarketingAjax.osvjeziKlikove(document.getElementById('divNekretnine'));
}, 500);