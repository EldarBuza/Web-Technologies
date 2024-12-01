const listaNekretnina = [{
    id: 1,
    tip_nekretnine: "Stan",
    naziv: "Useljiv stan Sarajevo",
    kvadratura: 58,
    cijena: 232000,
    tip_grijanja: "plin",
    lokacija: "Novo Sarajevo",
    godina_izgradnje: 2019,
    datum_objave: "01.10.2023.",
    opis: "Sociis natoque penatibus.",
    upiti: [{
        korisnik_id: 1,
        tekst_upita: "Nullam eu pede mollis pretium."
    },
    {
        korisnik_id: 2,
        tekst_upita: "Phasellus viverra nulla."
    }]
},{
    id: 1,
    tip_nekretnine: "Stan",
    naziv: "Useljiv stan Sarajevo",
    kvadratura: 58,
    cijena: 32000,
    tip_grijanja: "plin",
    lokacija: "Novo Sarajevo",
    godina_izgradnje: 2019,
    datum_objave: "01.10.2009.",
    opis: "Sociis natoque penatibus.",
    upiti: [{
        korisnik_id: 1,
        tekst_upita: "Nullam eu pede mollis pretium."
    },
    {
        korisnik_id: 2,
        tekst_upita: "Phasellus viverra nulla."
    }]
},{
    id: 1,
    tip_nekretnine: "Stan",
    naziv: "Useljiv stan Sarajevo",
    kvadratura: 58,
    cijena: 232000,
    tip_grijanja: "plin",
    lokacija: "Novo Sarajevo",
    godina_izgradnje: 2019,
    datum_objave: "01.10.2003.",
    opis: "Sociis natoque penatibus.",
    upiti: [{
        korisnik_id: 1,
        tekst_upita: "Nullam eu pede mollis pretium."
    },
    {
        korisnik_id: 2,
        tekst_upita: "Phasellus viverra nulla."
    }]
},
{
    id: 2,
    tip_nekretnine: "Kuća",
    naziv: "Mali poslovni prostor",
    kvadratura: 20,
    cijena: 70000,
    tip_grijanja: "struja",
    lokacija: "Centar",
    godina_izgradnje: 2005,
    datum_objave: "20.08.2023.",
    opis: "Magnis dis parturient montes.",
    upiti: [{
        korisnik_id: 2,
        tekst_upita: "Integer tincidunt."
    }
    ]
},
{
    id: 3,
    tip_nekretnine: "Kuća",
    naziv: "Mali poslovni prostor",
    kvadratura: 20,
    cijena: 70000,
    tip_grijanja: "struja",
    lokacija: "Centar",
    godina_izgradnje: 2005,
    datum_objave: "20.08.2023.",
    opis: "Magnis dis parturient montes.",
    upiti: [{
        korisnik_id: 2,
        tekst_upita: "Integer tincidunt."
    }
    ]
},
{
    id: 4,
    tip_nekretnine: "Kuća",
    naziv: "Mali poslovni prostor",
    kvadratura: 20,
    cijena: 70000,
    tip_grijanja: "struja",
    lokacija: "Centar",
    godina_izgradnje: 2005,
    datum_objave: "20.08.2023.",
    opis: "Magnis dis parturient montes.",
    upiti: [{
        korisnik_id: 2,
        tekst_upita: "Integer tincidunt."
    }
    ]
}]

const listaKorisnika = [{
    id: 1,
    ime: "Neko",
    prezime: "Nekic",
    username: "username1",
},
{
    id: 2,
    ime: "Neko2",
    prezime: "Nekic2",
    username: "username2",
}]
// Preuzimanje elemenata sa stranice
const form = document.getElementById('histogram-form');
const periodiInput = document.getElementById('periodi');
const rasponiCijenaInput = document.getElementById('rasponi');
const chartContainer = document.getElementById('chart');
const formKvadratura = document.getElementById('kvadratura-form');
const minKvadraturaInput = document.getElementById('min-kvadratura');
const maxKvadraturaInput = document.getElementById('max-kvadratura');
const minCijenaInput = document.getElementById('min-cijena');
const maxCijenaInput = document.getElementById('max-cijena');
const nazivSvojstvaInput = document.getElementById('svojstvo');
const fromNekretnine = document.getElementById('moje-nekretnine');
const idKorisnikaInput = document.getElementById('id-korisnika');
const listaNekretninaIzMojeNekretnine = document.getElementById('moje-nekretnine-lista');
// Inicijalizacija objekta StatistikaNekretnina
const statistika = StatistikaNekretnina();
statistika.init(listaNekretnina, listaKorisnika); 


form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Parsiranje unosa iz forme
    const periodi = periodiInput.value.split(','); 
    const rasponiCijena = rasponiCijenaInput.value.split(','); 

    // Formatiranje perioda
    const parsedPeriodi = periodi.map(period => {
        const [od, doGodina] = period.split('-').map(Number);
        return { od, do: doGodina };
    });

    // Formatiranje raspona cijena
    const parsedRasponiCijena = rasponiCijena.map(raspon => {
        const [od, doCijena] = raspon.split('-').map(Number);
        return { od, do: doCijena };
    });

    // Generisanje histogram podataka korišćenjem `StatistikaNekretnina`
    const histogramPodaci = statistika.histogramCijena(parsedPeriodi, parsedRasponiCijena);

    // Brisanje prethodnih grafova
    chartContainer.innerHTML = '';

    // Kreiranje grafova za svaki period
    parsedPeriodi.forEach((period, indeksPerioda) => {
        const ctx = document.createElement('canvas');
        ctx.id = `chart-${indeksPerioda}`;
        chartContainer.appendChild(ctx);

        // Filtriranje podataka za trenutni period
        const podaciZaPeriod = histogramPodaci.filter(pod => pod.indeksPerioda === indeksPerioda);

        const labels = parsedRasponiCijena.map((raspon, indeksRasponaCijena) =>
            `${raspon.od} - ${raspon.do}`
        );
        const data = podaciZaPeriod.map(pod => pod.brojNekretnina);
        console.log(data);

        // Kreiranje bar charta pomoću Chart.js
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Broj nekretnina (${period.od}-${period.do})`,
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
    periodiInput.value = '';
    rasponiCijenaInput.value = '';
});

formKvadratura.addEventListener('submit', (event) => {
    event.preventDefault();

    // Parsiranje unosa iz forme
    const tipNekretnine = document.querySelector('input[name="tip-nekretnine"]:checked')?.value;
    const minKvadratura = parseFloat(minKvadraturaInput.value);
    const maxKvadratura = parseFloat(maxKvadraturaInput.value);
    const minCijena = parseFloat(minCijenaInput.value);
    const maxCijena = parseFloat(maxCijenaInput.value);
    const nazivSvojstva = nazivSvojstvaInput.value;
    let nekretnina = {tip_nekretnine: tipNekretnine, min_kvadratura: minKvadratura, max_kvadratura: maxKvadratura, min_cijena: minCijena, max_cijena: maxCijena};

    // Poziv metode za izračunavanje prosječne kvadrature
    const prosjecnaKvadratura = statistika.prosjecnaKvadratura(nekretnina);


    const outlier = statistika.outlier(nekretnina, nazivSvojstva);

    // Ispis rezultata na stranicu
    document.getElementById('prosjecna-kvadratura').textContent = `Prosjecna kvadratura: ${prosjecnaKvadratura}`;
    if (outlier === undefined) {
        document.getElementById('outlier').textContent = `Outlieri nisu traženi`;
        return;
    }
    document.getElementById('outlier').textContent = `Outlier: ${outlier.naziv}`;

    // Filtriranje nekretnina
    minKvadraturaInput.value = '';
    maxKvadraturaInput.value = '';
    minCijenaInput.value = '';
    maxCijenaInput.value = '';
    document.querySelectorAll('input[name="tip-nekretnine"]').forEach((radio) => {
        radio.checked = false;
    });
});

fromNekretnine.addEventListener('submit', (event) => {
    event.preventDefault();
    listaNekretninaIzMojeNekretnine.innerHTML = '';
    const greska = document.getElementById('greska');
    greska.textContent = '';

    // Parsiranje unosa iz forme
    const idKorisnika = parseInt(idKorisnikaInput.value);
    const korisnik = listaKorisnika.find(korisnik => korisnik.id === idKorisnika);

    // Poziv metode za izračunavanje prosječne kvadrature
    if (korisnik === undefined) {
        idKorisnikaInput.value = '';
        greska.textContent = 'Korisnik sa unesenim ID-em ne postoji!'; 
        listaNekretninaIzMojeNekretnine.innerHTML = '';
        return;
    }
    const mojeNekretnine = statistika.mojeNekretnine(korisnik);

    // Ispis rezultata na stranicu
    mojeNekretnine.forEach(nekretnina => {
        const li = document.createElement('li');
        li.textContent = nekretnina.naziv;
        listaNekretninaIzMojeNekretnine.appendChild(li);
    });

    // Filtriranje nekretnina
    idKorisnika.value = '';
});