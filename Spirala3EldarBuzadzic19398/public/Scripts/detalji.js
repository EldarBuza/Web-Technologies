document.addEventListener('DOMContentLoaded', () => {
    const mediaQuery = window.matchMedia('(max-width: 599px)');

    const glavniElement = document.querySelector('#upiti');
    const sviElementi = Array.from(document.querySelectorAll('.upit'));
    const originalHTML = sviElementi.map((el) => el.outerHTML).join('');

    let carousel = null;

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
});
