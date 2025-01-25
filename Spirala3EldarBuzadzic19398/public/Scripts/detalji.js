document.addEventListener('DOMContentLoaded', () => {
    const glavniElement = document.querySelector('#upiti'); // Div za prikaz upita
    let sviElementi = []; // Lista svih elemenata upita
    let carousel = null; // Instanca carousela

    const nekretninaId = new URLSearchParams(window.location.search).get('id'); // ID nekretnine iz URL-a
    if (!nekretninaId) {
        console.error('ID nekretnine nije pronađen u URL-u!');
        return;
    }

    // Funkcija za dohvat podataka nekretnine
    async function getNekretnina(id) {
        try {
            const response = await fetch(`/nekretnina/${id}`);
            if (!response.ok) {
                throw new Error('Greška prilikom učitavanja podataka o nekretnini');
            }
            const data = await response.json();

            // Popunjavanje osnovnih podataka
            document.getElementById('naziv').textContent = data.naziv;
            document.getElementById('kvadratura').textContent = data.kvadratura;
            document.getElementById('cijena').textContent = data.cijena;
            document.getElementById('tip_grijanja').textContent = data.tip_grijanja;
            document.getElementById('lokacija').textContent = data.lokacija;
            document.getElementById('godina_izgradnje').textContent = data.godina_izgradnje;
            document.getElementById('datum_objave').textContent = data.datum_objave;
            document.getElementById('opis').textContent = data.opis;
            document.getElementById('nekretnina-slika').src = `/Resources/stan/stan${id}.jpg`;

            // Prikazivanje upita
            sviElementi = data.upiti.map(upit => {
                const div = document.createElement('div');
                div.classList.add('upit');
                div.innerHTML = `
                    <p><strong>Korisnik ${upit.korisnik_id}:</strong></p>
                    <p>${upit.tekst_upita}</p>
                `;
                return div;
            });

            // Resetovanje sadržaja i inicijalizacija carousel-a
            glavniElement.innerHTML = ''; // Očistimo prethodni sadržaj
            sviElementi.forEach(el => glavniElement.appendChild(el));

            inicijalizirajCarousel();
        } catch (error) {
            console.error('Došlo je do greške:', error);
        }
    }

    // Funkcija za inicijalizaciju carousel-a
    function inicijalizirajCarousel() {
        carousel = postaviCarousel(
            glavniElement,
            sviElementi,
            0,
            async (stranica = 0) => {
                // Dinamičko dohvaćanje novih upita sa servera
                try {
                    const response = await fetch(`/next/upiti/nekretnina${nekretninaId}?page=${stranica}`);
                    if (!response.ok) {
                        throw new Error('Greška prilikom dohvaćanja novih upita');
                    }
                    const noviUpiti = await response.json();

                    // Konvertovanje u DOM elemente
                    return noviUpiti.map(upit => {
                        const div = document.createElement('div');
                        div.classList.add('upit');
                        div.innerHTML = `
                            <p><strong>Korisnik ${upit.korisnik_id}:</strong></p>
                            <p>${upit.tekst_upita}</p>
                        `;
                        return div;
                    });
                } catch (error) {
                    console.error('Greška pri dohvaćanju novih upita:', error);
                    return [];
                }
            }
        );

        // Dodavanje event listener-a na dugmad
        if (carousel) {
            document.getElementById('prev').addEventListener('click', carousel.fnLijevo);
            document.getElementById('next').addEventListener('click', carousel.fnDesno);
        }
    }

    // Dohvat podataka o nekretnini na osnovu ID-a
    getNekretnina(nekretninaId);
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
                    console.log(data);
                    sviElementi = [...data.upiti];
                    console.log(sviElementi);
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
        if (!glavniElement) {
            console.error('Carousel se ne može inicijalizirati: Nisu pronađeni potrebni elementi.');
            return;
        }

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
