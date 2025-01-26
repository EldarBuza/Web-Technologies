function postaviCarousel(glavniElement, sviElementi, indeks = 0) {
    if (!glavniElement || sviElementi.length === 0) {
        glavniElement.innerHTML = '<p>Nema elemenata za prikaz.</p>';
        return null;
    }

    // Funkcija za prikazivanje trenutnog elementa
    const prikaziElement = () => {
        glavniElement.innerHTML = sviElementi[indeks].outerHTML;
    };

    // Funkcija za kretanje ulijevo
    const fnLijevo = () => {
        if (sviElementi.length === 0) return;
        indeks = (indeks - 1 + sviElementi.length) % sviElementi.length; // Kružno kretanje
        prikaziElement();
    };

    // Funkcija za kretanje udesno
    const fnDesno = () => {
        if (sviElementi.length === 0) return;
        indeks = (indeks + 1) % sviElementi.length; // Kružno kretanje
        prikaziElement();
    };

    // Inicijalno prikazivanje
    prikaziElement();

    return { fnLijevo, fnDesno };
}
