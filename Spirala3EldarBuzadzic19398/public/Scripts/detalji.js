document.addEventListener('DOMContentLoaded', () => {
    const mediaQuery = window.matchMedia('(max-width: 599px)');
    const urlParams = new URLSearchParams(window.location.search);
    const nekretninaId = urlParams.get('id');
    const glavniElement = document.querySelector('#upiti');
    const sviElementi = Array.from(document.querySelectorAll('.upit'));
    const originalHTML = sviElementi.map((el) => el.outerHTML).join('');
    let carousel = null;

    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const nekretninaId = urlParams.get('id');
    
        if (!nekretninaId) {
            console.error('ID nekretnine nije pronađen u URL-u!');
            return;
        }
    
        // AJAX poziv za učitavanje detalja nekretnine
        fetch(`/nekretnina/${nekretninaId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Greška prilikom učitavanja podataka');
                }
                return response.json();
            })
            .then(data => {
                // Provjeriti i dodati podatke u HTML
                const { naziv, kvadratura, cijena, tip_grijanja, lokacija, godina_izgradnje, datum_objave, opis, upiti } = data;
    
                document.querySelector('#osnovno img').src = `/Resources/stan/stan${nekretninaId}.jpg`; // Pretpostavka da koristimo ID za sliku
                document.querySelector('#osnovno p:nth-child(1)').textContent = `Naziv: ${naziv}`;
                document.querySelector('#osnovno p:nth-child(2)').textContent = `Kvadratura: ${kvadratura} m²`;
                document.querySelector('#osnovno p:nth-child(3)').textContent = `Cijena: ${cijena} KM`;
    
                // Detalji nekretnine
                document.querySelector('#detalji #kolona1 p:nth-child(1)').textContent = `Tip grijanja: ${tip_grijanja}`;
                document.querySelector('#detalji #kolona1 p:nth-child(2)').textContent = `Lokacija: ${lokacija}`;
                document.querySelector('#detalji #kolona2 p:nth-child(1)').textContent = `Godina izgradnje: ${godina_izgradnje}`;
                document.querySelector('#detalji #kolona2 p:nth-child(2)').textContent = `Datum objave: ${datum_objave}`;
                document.querySelector('#detalji #opis p').textContent = `Opis: ${opis}`;
    
                // Upiti
                const upitiContainer = document.querySelector('#upiti');
                upitiContainer.innerHTML = ''; // Očisti prethodne upite
                upiti.forEach((upit, index) => {
                    const upitElement = document.createElement('div');
                    upitElement.classList.add('upit');
                    upitElement.innerHTML = `
                        <p><strong>Username ${upit.korisnik_id}:</strong></p>
                        <p>${upit.tekst_upita}</p>
                    `;
                    upitiContainer.appendChild(upitElement);
                });
            })
            .catch(error => {
                console.error('Došlo je do greške:', error);
            });
    });


    // Funkcija za dohvat podataka nekretnine
    function getNekretnina(id) {
        $.ajax({
            url: `/nekretnina/${id}`,
            method: 'GET',
            success: function (data) {
                // Popuniti podatke o nekretnini
                document.getElementById('naziv').textContent = data.naziv;
                document.getElementById('kvadratura').textContent = data.kvadratura;
                document.getElementById('cijena').textContent = data.cijena;
                document.getElementById('tip_grijanja').textContent = data.tip_grijanja;
                document.getElementById('lokacija').textContent = data.lokacija;
                document.getElementById('godina_izgradnje').textContent = data.godina_izgradnje;
                document.getElementById('datum_objave').textContent = data.datum_objave;
                document.getElementById('opis').textContent = data.opis;
                
                // Dynamically add inquiries
                if (data.upiti.length > 0) {
                    data.upiti.forEach((upit, index) => {
                        const upitElement = document.createElement('div');
                        upitElement.classList.add('upit');
                        upitElement.innerHTML = `
                            <p><strong>Korisnik ${upit.korisnik_id}:</strong></p>
                            <p>${upit.tekst_upita}</p>
                        `;
                        glavniElement.appendChild(upitElement);
                    });
                }
            },
            error: function () {
                alert('Greška pri učitavanju podataka!');
            }
        });
    }

    // Inicijalizacija carousel-a
    const inicijalizirajCarousel = () => {
        if (!glavniElement || sviElementi.length === 0) {
            console.error('Carousel se ne može inicijalizirati: Nisu pronađeni potrebni elementi.');
            return;
        }

        glavniElement.innerHTML = ''; 
        carousel = postaviCarousel(glavniElement, sviElementi);

        if (carousel) {
            const prevButton = document.querySelector('#prev');
            const nextButton = document.querySelector('#next');

            if (prevButton && nextButton) {
                prevButton.addEventListener('click', carousel.fnLijevo);
                nextButton.addEventListener('click', carousel.fnDesno);
            }
        }
    };

    // Vraćanje na početno stanje
    const vratiNaPocetnoStanje = () => {
        if (glavniElement) {
            glavniElement.innerHTML = originalHTML; // Vraćam originalni sadržaj
            carousel = null; 
        }
    };

    // Za promjenu veličine ekrana
    const handleMediaQueryChange = (e) => {
        if (e.matches) {
            inicijalizirajCarousel(); // Pokrećem carousel ako je ekran uži od 600px
        } else {
            vratiNaPocetnoStanje(); // Vraćam na početni izgled za šire ekrane
        }
    };

    // Početna provjera
    handleMediaQueryChange(mediaQuery);

    // Dodavanje listenera za promjene dimenzija
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    // Pozivanje funkcije s ID-om iz URL-a
    if (nekretninaId) {
        getNekretnina(nekretninaId);
    } else {
        alert('ID nekretnine nije pronađen!');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const top5Link = document.getElementById('top5Link');
    const lokacijaElement = document.getElementById('lokacija');

    // Dodavanje event listener za link
    if (top5Link) {
        top5Link.addEventListener('click', (event) => {
            event.preventDefault(); // Sprečavanje defaultne akcije linka
            const lokacija = lokacijaElement.textContent.trim();

            if (lokacija) {
                // Prebacivanje na nekretnine.html s lokacijom kao query parametar
                window.location.href = `nekretnine.html?lokacija=${encodeURIComponent(lokacija)}`;
            } else {
                alert('Lokacija nije dostupna.');
            }
        });
    }
});

function prikaziNoveNekretnine(nekretnine) {
    const upitiContainer = document.querySelector('#upiti');

    // Očistite prethodni sadržaj
    upitiContainer.innerHTML = '';

    // Iterirajte kroz dohvaćene nekretnine i prikažite ih
    nekretnine.forEach(nekretnina => {
        const nekretninaElement = document.createElement('div');
        nekretninaElement.classList.add('nekretnina');

        nekretninaElement.innerHTML = `
            <img src="/Resources/stan/stan${nekretnina.id}.jpg" alt="Nekretnina ${nekretnina.naziv}">
            <p><strong>Naziv:</strong> ${nekretnina.naziv}</p>
            <p><strong>Kvadratura:</strong> ${nekretnina.kvadratura} m²</p>
            <p><strong>Cijena:</strong> ${nekretnina.cijena} KM</p>
            <p><strong>Lokacija:</strong> ${nekretnina.lokacija}</p>
        `;

        upitiContainer.appendChild(nekretninaElement);
    });
}