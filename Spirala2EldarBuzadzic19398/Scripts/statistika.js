// Preuzimanje elemenata sa stranice
const form = document.getElementById('histogram-form');
const periodiInput = document.getElementById('periodi');
const rasponiCijenaInput = document.getElementById('rasponi');
const chartContainer = document.getElementById('chart');

// Inicijalizacija objekta StatistikaNekretnina
const statistika = StatistikaNekretnina();
statistika.init(listaNekretnina, listaKorisnika); 

// Event listener za dugme koje poziva iscrtavanje histograma
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
