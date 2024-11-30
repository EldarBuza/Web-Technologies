

let StatistikaNekretnina = function(){
    let spisakNekretnina = SpisakNekretnina();
    
    let init = function (listaNekretnina, listaKorisnika) {
        spisakNekretnina.init(listaNekretnina, listaKorisnika);
    };
    
    let prosjecnaKvadratura = function (kriterij){
        let filtriraneNekretnine = spisakNekretnina.filtrirajNekretnine(kriterij)
       // console.log("Broj elemenata u listi: " + filtriraneNekretnine.length);
        if (filtriraneNekretnine.length === 0) return 0;
        let ukupnaKvadratura = 0;
        for (let i = 0; i < filtriraneNekretnine.length; i++){

            ukupnaKvadratura += filtriraneNekretnine[i].kvadratura;
        }
        return ukupnaKvadratura/filtriraneNekretnine.length;
    }
    
    let outlier = function(kriterij, nazivSvojstva){
        if (nazivSvojstva == "kvadratura" || nazivSvojstva == "cijena" || nazivSvojstva == "godina_izgradnje"){
            let filtriraneNekretnine = spisakNekretnina.filtrirajNekretnine(kriterij);
            let srednjaVrijednostSvihNekretnina = 0;
            for (let i = 0;i < spisakNekretnina.listaNekretnina.length; i++){
              srednjaVrijednostSvihNekretnina += spisakNekretnina.listaNekretnina[i][nazivSvojstva];
              console.log(spisakNekretnina.listaNekretnina[i][nazivSvojstva]);
            }
            srednjaVrijednostSvihNekretnina /= spisakNekretnina.listaNekretnina.length;
            let indeksNekretnine = -1;
            let najveceOdstupanje = -2;
            let trenutnoOdstupanje = -1;
            for (let i = 0;i < filtriraneNekretnine.length; i++){
              trenutnoOdstupanje = Math.abs(filtriraneNekretnine[i][nazivSvojstva] - srednjaVrijednostSvihNekretnina);
              if (trenutnoOdstupanje > najveceOdstupanje) {najveceOdstupanje = trenutnoOdstupanje; indeksNekretnine = i;}
            }
            return filtriraneNekretnine[indeksNekretnine];
        }
    }
    
        let mojeNekretnine = function (korisnik) {
          let nekretnineSaUpitima = spisakNekretnina.listaNekretnina.filter(nekretnina => {
            let upitiKorisnika = nekretnina.upiti.filter(upit => upit.korisnik_id === korisnik.id);
            return upitiKorisnika.length > 0;
        });

        return nekretnineSaUpitima.sort((a, b) => b.upiti.length - a.upiti.length);
    };
        let histogramCijena = function (periodi, rasponiCijena) {
        let rezultat = [];

        periodi.forEach((period, indeksPerioda) => {
            let nekretnineUPeriodu = spisakNekretnina.listaNekretnina.filter(nekretnina => {
                return parseInt(nekretnina.datum_objave.split(".")[2]) >= period.od && parseInt(nekretnina.datum_objave.split(".")[2]) <= period.do;
            });
            console.log("Indeks perioda: " + indeksPerioda);

            rasponiCijena.forEach((raspon, indeksRasponaCijena) => {
                let nekretnineURasponu = nekretnineUPeriodu.filter(nekretnina => {
                    return nekretnina.cijena >= raspon.od && nekretnina.cijena <= raspon.do;
                });
                console.log("Indeks rasporeda cijena: " + indeksRasponaCijena);

                rezultat.push({
                    indeksPerioda: indeksPerioda,
                    indeksRasponaCijena: indeksRasponaCijena,
                    brojNekretnina: nekretnineURasponu.length
                });
            });
        });

        return rezultat;
        };
        
    
    return{
      init:init,
      prosjecnaKvadratura:prosjecnaKvadratura,
      outlier:outlier,
      mojeNekretnine:mojeNekretnine,
      histogramCijena:histogramCijena
    }
};


/*let a = StatistikaNekretnina();
a.init(listaNekretnina, listaKorisnika);
const kriterij1 = { tip_nekretnine: "Stan", min_kvadratura: 50 };
const prosjek1 = a.prosjecnaKvadratura(kriterij1);
console.log(prosjek1);  // Očekivano: 58

const kriterij2 = { tip_nekretnine: "Stan", min_kvadratura: 100 };
const prosjek2 = a.prosjecnaKvadratura(kriterij2);
console.log(prosjek2);  // Očekivano: 0

const kriterij3 = { tip_nekretnine: "Kuća", min_cijena: 50000 };
const prosjek3 = a.prosjecnaKvadratura(kriterij3);
console.log(prosjek3);  // Očekivano: 20

const kriterij4 = { min_kvadratura: 30 };
const prosjek4 = a.prosjecnaKvadratura(kriterij4);
console.log(prosjek4);  // Očekivano: 39.5

const kriterij5 = { min_cijena: 50000 };
const prosjek5 = a.prosjecnaKvadratura(kriterij5);
console.log(prosjek5);  // Očekivano: 35.2
let rez = a.outlier(kriterij5, "kvadratura");
console.log(rez.naziv);

let rezultantniNiz = a.mojeNekretnine(listaKorisnika[1]);
console.log(rezultantniNiz.length);

let rezultat = a.histogramCijena([{od:2000,do:2010},{od:2010,do:2024}],[{od:10000,
do:150000},{od:150000,do:1000000}])
console.log(rezultat[0].brojNekretnina);
rezultat.forEach((item) => {
  console.log("indeksPerioda:" + item.indeksPerioda + ",indeksRasponaCijena:" + item.indeksRasponaCijena + ",brojNekretnina:" + item.brojNekretnina);
})*/
//Za nekretnine iz nekretnine.js treba da vrati:
/*[{indeksPerioda:0,indeksRasporedaCijena:0,brojNekretnina:1},
{indeksPerioda:0,indeksRasporedaCijena:1,brojNekretnina:1},
{indeksPerioda:1,indeksRasporedaCijena:0,brojNekretnina:3},
{indeksPerioda:1,indeksRasporedaCijena:1,brojNekretnina:1}]*/