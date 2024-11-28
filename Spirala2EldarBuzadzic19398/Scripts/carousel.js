function postaviCarousel(glavniElement, sviElementi, indeks = 0) {
    if (!glavniElement || !sviElementi.length || indeks < 0 || indeks >= sviElementi.length) {
        return null;
    }

    // Funkcija za prikazivanje trenutnog elementa
    const prikaziElement = () => {
        glavniElement.innerHTML = sviElementi[indeks].outerHTML;
    };

    // Funkcija za kretanje ulijevo
    const fnLijevo = () => {
        indeks = (indeks - 1 + sviElementi.length) % sviElementi.length;
        prikaziElement();
    };

    // Funkcija za kretanje udesno
    const fnDesno = () => {
        indeks = (indeks + 1) % sviElementi.length;
        prikaziElement();
    };

    // Prikaz početnog elementa
    prikaziElement();

    return { fnLijevo, fnDesno };
}
