document.addEventListener('DOMContentLoaded', () => {
    const glavniElement = document.querySelector('#upiti'); // Div za prikaz upita
    let sviElementi = []; // Lista svih elemenata upita
    let svePonude = [];
    let sviZahtjevi = [];
    let carousel = null; // Instanca carousela
    let carousel2 = null; // Instanca carousela
    let carousel3 = null; // Instanca carousela

    const nekretninaId = new URLSearchParams(window.location.search).get('id'); // ID nekretnine iz URL-a
    if (!nekretninaId) {
        console.error('ID nekretnine nije pronađen u URL-u!');
        return;
    }

    // Funkcija za dohvat podataka nekretnine
    function getNekretnina(id) {
        PoziviAjax.getNekretnina(id, (error, nekretnina) => {
            if (error) {
                console.error('Greška pri dohvatanju podataka o nekretnini:', error);
                return;
            }
    
            // Popunjavanje osnovnih podataka
            document.getElementById('naziv').textContent = nekretnina.naziv;
            document.getElementById('kvadratura').textContent = nekretnina.kvadratura;
            document.getElementById('cijena').textContent = nekretnina.cijena;
            document.getElementById('tip_grijanja').textContent = nekretnina.tip_grijanja;
            document.getElementById('lokacija').textContent = nekretnina.lokacija;
            document.getElementById('godina_izgradnje').textContent = nekretnina.godina_izgradnje;
            document.getElementById('datum_objave').textContent = nekretnina.datum_objave;
            document.getElementById('opis').textContent = nekretnina.opis;
            document.getElementById('nekretnina-slika').src = `/Resources/stan/stan${id}.jpg`;
    
            // Dohvati upite i inicijalizuj carousel
            PoziviAjax.getSveUpite(id, (error, upiti) => {
                if (error) {
                    console.error('Greška pri dohvatanju upita:', error);
                    return;
                }
    
                // Kreiraj DOM elemente za svaki upit
                console.log(upiti);
                sviElementi = upiti.map(upit => {
                    const div = document.createElement('div');
                    div.className = 'upit';
                    div.innerHTML = `
                        <h4>ID Upita: ${upit.id}</h4>
                        <h4>ID Korisnika: ${upit.korisnik_id}</h4>
                        <p>Tekst upita: ${upit.tekst}</p>
                    `;
                    return div;
                });
            });

                PoziviAjax.getPonude(id, (error, ponude) => {
                    if (error) {
                        console.error('Greška pri dohvatanju ponuda:', error);
                        return;
                    }
                    console.log(ponude);
                    // Kreiraj DOM elemente za svaku ponudu
                    svePonude = ponude.map(ponuda => {
                        const div = document.createElement('div');
                        div.className = 'ponuda';
                        let status = ponuda.odbijenaPonuda ? 'odbijena' : 'odobrena';
                        div.innerHTML = `
                            <h4>ID Ponude: ${ponuda.id}</h4>
                            <p>Tekst ponude: ${ponuda.tekst}</p>
                            <p>Status: ${status}</p>
                        `;
                        return div;
                    });
                });

                    PoziviAjax.getZahtjevi(id, (error, zahtjevi) => {
                        if (error) {
                            console.error('Greška pri dohvatanju zahtjeva:', error);
                            return;
                        }
                        console.log(zahtjevi);
                        // Kreiraj DOM elemente za svaki zahtjev
                        sviZahtjevi = zahtjevi.map(zahtjev => {
                            const div = document.createElement('div');
                            div.className = 'zahtjev';
                            if (!zahtjev.korisnik_id)
                            {div.innerHTML = `
                                <h4>ID Zahtjeva: ${zahtjev.id}</h4>
                                <p>Tekst zahtjeva: ${zahtjev.tekst}</p>
                                <p>Traženi datum: ${zahtjev.trazeniDatum}</p>
                                <p>Status: ${zahtjev.odobren === null ? 'Na čekanju' : (zahtjev.odobren ? 'odobren' : 'odbijen')}</p>
                            `;}
                            else{
                                div.innerHTML = `
                                <h4>ID Zahtjeva: ${zahtjev.id}</h4>
                                <p>Tekst zahtjeva: ${zahtjev.tekst}</p>
                                <p>Traženi datum: ${zahtjev.trazeniDatum}</p>
                                <p>Status: ${zahtjev.odobren === null ? 'Na čekanju' : (zahtjev.odobren ? 'odobren' : 'odbijen')}</p>
                                <p>ID Korisnika: ${zahtjev.korisnik_id}</p>
                                <p>ID Nekretnine: ${zahtjev.nekretnina_id}</p>
                            `;}
                            return div;
                });

                                // Pripremi glavni element carousel-a
                                const glavniElement = document.getElementById('upiti');
                                const drugiGlavniElement = document.getElementById('ponude');
                                const treciGlavniElement = document.getElementById('zahtjevi');
                                const carousel = postaviCarousel(glavniElement, sviElementi);
                                const carousel2 = postaviCarousel(drugiGlavniElement, svePonude);
                                const carousel3 = postaviCarousel(treciGlavniElement, sviZahtjevi);
                    
                                // Poveži dugmad sa funkcijama carousel-a
                                document.getElementById('prev').onclick = carousel.fnLijevo;
                                document.getElementById('next').onclick = carousel.fnDesno;
                                document.getElementById('prev-ponude').onclick = carousel2.fnLijevo;
                                document.getElementById('next-ponude').onclick = carousel2.fnDesno;
                                document.getElementById('prev-zahtjevi').onclick = carousel3.fnLijevo;
                                document.getElementById('next-zahtjevi').onclick = carousel3.fnDesno;
            });

        });
    }

    // Funkcija za inicijalizaciju carousel-a
    function inicijalizirajCarousel() {
        carousel = postaviCarousel(
            glavniElement,
            sviElementi,
            0
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
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('interesovanje-form');
    const dodatniElementi = document.getElementById('dodatni-elementi');
    const tipInteresovanja = document.getElementById('tip-interesovanja');
    const poruka = document.getElementById('poruka');
    const nekretninaId = new URLSearchParams(window.location.search).get('id');

    // Dinamičko mijenjanje forme na osnovu tipa interesovanja
    tipInteresovanja.addEventListener('change', async () => {
        const selectedType = tipInteresovanja.value;
        dodatniElementi.innerHTML = '';

        if (selectedType === 'ponuda') {
            // Polje za unos ID vezane ponude
            const label = document.createElement('label');
            label.textContent = 'ID vezane ponude:';
            const select = document.createElement('select');
            select.id = 'vezana-ponuda';
            const label2 = document.createElement('label');
            label2.textContent = 'Tekst ponude:';
            const tekstPonude = document.createElement('textarea');
            tekstPonude.id = 'tekst-ponude';
            const label3 = document.createElement('label');
            label3.textContent = 'Cijena ponude:';
            const cijenaPonude = document.createElement('input');
            cijenaPonude.type = 'number';
            cijenaPonude.id = 'cijena-ponude';
            const label4 = document.createElement('label');
            label4.textContent = 'Odbijena ponuda:';
            const odbijenaPonuda = document.createElement('input');
            odbijenaPonuda.id = 'odbijena-ponuda';
            odbijenaPonuda.type = 'checkbox';
            


            // Dohvati ponude
            PoziviAjax.getPonude(nekretninaId, (error, odgovor) => {
                if (error) {
                    poruka.textContent = 'Greška prilikom dohvatanja ponuda.';
                    poruka.style.color = 'red';
                } else {
                    console.log(odgovor);
                    odgovor.forEach(ponuda => {
                        const option = document.createElement('option');
                        option.value = ponuda.id;
                        option.innerHTML = `ID Ponude: ${ponuda.id}`;
                        select.appendChild(option);
                    });
                }
            });

            dodatniElementi.appendChild(label);
            dodatniElementi.appendChild(select);
            dodatniElementi.appendChild(label2);
            dodatniElementi.appendChild(tekstPonude);
            dodatniElementi.appendChild(label3);
            dodatniElementi.appendChild(cijenaPonude);
            dodatniElementi.appendChild(label4);
            dodatniElementi.appendChild(odbijenaPonuda);
        } else if (selectedType === 'zahtjev') {
            // Polje za unos traženog datuma
            const label = document.createElement('label');
            label.textContent = 'Traženi datum:';
            const input = document.createElement('input');
            input.type = 'date';
            input.id = 'trazeni-datum';
            const label1 = document.createElement('label');
            label1.textContent = 'Unesite tekst zahtjeva:';
            const tekstZahtjeva = document.createElement('textarea');
            tekstZahtjeva.id = 'tekst-zahtjeva';
            dodatniElementi.appendChild(label);
            dodatniElementi.appendChild(input);
            dodatniElementi.appendChild(label1);
            dodatniElementi.appendChild(tekstZahtjeva);
        } else if (selectedType === 'upit') {
            // Polje za unos teksta upita
            const label = document.createElement('label');
            label.textContent = 'Tekst upita:';
            const textarea = document.createElement('textarea');
            textarea.id = 'tekst-upita';
            dodatniElementi.appendChild(label);
            dodatniElementi.appendChild(textarea);
        }
    });

    // Dodavanje novog interesovanja
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedType = tipInteresovanja.value;
        let body = {};

        if (selectedType === 'ponuda') {
            body = { vezanaPonudaId: document.getElementById('vezana-ponuda').value, tekst: document.getElementById('tekst-ponude').value, cijenaPonude: document.getElementById('cijena-ponude').value, datumPonude: new Date().toISOString().split('T')[0], odbijenaPonuda: document.getElementById('odbijena-ponuda').checked };
        } else if (selectedType === 'zahtjev') {
            body = { trazeniDatum: document.getElementById('trazeni-datum').value, tekst: document.getElementById('tekst-zahtjeva').value };
        } else if (selectedType === 'upit') {
            body = { tekst: document.getElementById('tekst-upita').value };
        }

        try {
            if (selectedType === 'ponuda') {
                // Validacija cijene
                let cijena = parseFloat(document.getElementById('cijena-ponude').value);
                if (isNaN(cijena)) {cijena = null;}
                const podaciPonude = {
                    tekst: document.getElementById('tekst-ponude').value,
                    ponudaCijene: cijena,
                    datumPonude: new Date().toISOString().split('T')[0],
                    idVezanePonude: document.getElementById('vezana-ponuda').value || null,
                    odbijenaPonuda: document.getElementById('odbijena-ponuda').checked
                };
    
                PoziviAjax.postPonuda(nekretninaId, podaciPonude, (error, odgovor) => {
                    if (error) {
                        poruka.textContent = 'Greška prilikom dodavanja ponude.';
                        poruka.style.color = 'red';
                    } else {
                        poruka.textContent = 'Uspješno ste dodali ponudu.';
                        poruka.style.color = 'green';
                        document.getElementById('tekst-ponude').value = '';
                        document.getElementById('cijena-ponude').value = '';
                        document.getElementById('vezana-ponuda').value = '';
                        document.getElementById('odbijena-ponuda').checked = false;
                    }
                });
            }
            else if (selectedType === 'upit'){
                // Validacija teksta upita
                const tekstUpita = document.getElementById('tekst-upita').value;
                if (!tekstUpita) {
                    poruka.textContent = 'Tekst upita je obavezan.';
                    poruka.style.color = 'red';
                    return;
                }
                PoziviAjax.postUpit(nekretninaId, tekstUpita, (error, odgovor) => {
                    if (error) {
                        poruka.textContent = 'Greška prilikom dodavanja upita.';
                        poruka.style.color = 'red';
                        alert(error.message);
                    } else {
                        poruka.textContent = 'Uspješno ste dodali upit.';
                        poruka.style.color = 'green';
                        document.getElementById('tekst-upita').value = '';
                    }
                    document.getElementById('tekst-upita').value = '';
                });
            }
            else if (selectedType === 'zahtjev'){
                // Validacija traženog datuma
                const trazeniDatum = document.getElementById('trazeni-datum').value;
                const tekstZahtjeva = document.getElementById('tekst-zahtjeva').value;
                if (!trazeniDatum) {
                    poruka.textContent = 'Traženi datum je obavezan.';
                    poruka.style.color = 'red';
                    return;
                }

                PoziviAjax.postZahtjev(nekretninaId, tekstZahtjeva, trazeniDatum, (error, odgovor) => {
                    if (error) {
                        poruka.textContent = 'Greška prilikom dodavanja zahtjeva.';
                        poruka.style.color = 'red';
                    } else {
                        poruka.textContent = 'Uspješno ste dodali zahtjev.';
                        poruka.style.color = 'green';
                        document.getElementById('trazeni-datum').value = '';
                        document.getElementById('tekst-zahtjeva').value = '';
                    }
                });
            }
        } catch (error) {
            poruka.textContent = 'Došlo je do greške prilikom slanja zahtjeva.';
            poruka.style.color = 'red';
        }
    });

    // Automatski učitaj dropdown kada se stranica učita
    tipInteresovanja.dispatchEvent(new Event('change'));
});

