import request from "supertest";
import { expect } from "chai";
import Sequelize from "sequelize";
import bcrypt from 'bcrypt';

const apiUrl = 'http://localhost:3000';
let cookieAdmin, cookieUser;

// Konfiguracija za povezivanje na bazu podataka
const sequelize = new Sequelize('wt24', 'root', '#Password1', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
});

let nekretninaTabela, korisnikTabela, ponudaTabela, upitTabela, zahtjevTabela;


// Hash the password before inserting it into the database
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

describe("Testovi sa MySQL bazom za spiralu 4", () => {
    before(async () => {

        // Dohvaćanje i ispis tabela i relacija u bazi
        console.log("\n--- Struktura baza podataka ---");
        try {
            const tables = await sequelize.query(
                "SHOW TABLES",
                { type: Sequelize.QueryTypes.SHOWTABLES }
            );

            console.log("Tabele u bazi:");
            if (tables.length === 0) {
                console.log("Nema tabela u bazi.");
            } else {

                nekretninaTabela = tables.find(element => element.toLowerCase().includes("nekret".toLowerCase()));
                korisnikTabela = tables.find(element => element.toLowerCase().includes("korisni".toLowerCase()));
                ponudaTabela = tables.find(element => element.toLowerCase().includes("ponud".toLowerCase()));
                upitTabela = tables.find(element => element.toLowerCase().includes("upit".toLowerCase()));
                zahtjevTabela = tables.find(element => element.toLowerCase().includes("zahtj".toLowerCase()));

                for (const table of tables) {
                    console.log(`\nTabela: ${table}`);

                    // Fetch column information for each table
                    const columns = await sequelize.query(`
                        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = '${table}' AND TABLE_SCHEMA = 'wt24';
                    `, { type: Sequelize.QueryTypes.SELECT });

                    console.log("Kolone:");
                    columns.forEach((col) => {
                        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE}, Key: ${col.COLUMN_KEY || 'None'}, Default: ${col.COLUMN_DEFAULT || 'None'})`);
                    });
                }
            }

            // Fetch and display foreign key relationships
            console.log("\nRelacije između tabela (Foreign Keys):");
            const foreignKeys = await sequelize.query(`
                SELECT 
                    TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = 'wt24' AND REFERENCED_TABLE_NAME IS NOT NULL;
            `, { type: Sequelize.QueryTypes.SELECT });

            if (foreignKeys.length === 0) {
                console.log("Nema definisanih stranih ključeva.");
            } else {
                foreignKeys.forEach((fk) => {
                    console.log(`- ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
                });
            }
        } catch (error) {
            console.error("Greška prilikom dohvaćanja tabela i relacija:", error.message);
        }

        // Provjera da li su tabele prazne i ubacivanje podataka ako je potrebno
        console.log("\n--- Ubacivanje testnih podataka ---");

        try {
            // Check if Korisnik table is empty and insert data
            const korisnikCount = await sequelize.query(`SELECT COUNT(*) AS count FROM ${korisnikTabela}`, {
                type: Sequelize.QueryTypes.SELECT
            });

            if (korisnikCount[0].count === 0) {
                console.log("Tabela Korisnik je prazna. Ubacivanje podataka...");

                // Encrypt passwords
                const adminHashedPassword = await hashPassword('admin');
                const userHashedPassword = await hashPassword('user');

                console.log("Admin hash: ", adminHashedPassword);
                console.log("User hash: ", userHashedPassword);

                // Insert encrypted data into the Korisnik table
                await sequelize.query(`
                INSERT INTO ${korisnikTabela} (ime, prezime, username, password, admin)
                VALUES
                    ('Admin', 'User', 'admin', '${adminHashedPassword}', true),
                    ('John', 'Doe', 'user', '${userHashedPassword}', false)
            `);

                console.log("Podaci ubačeni u tabelu Korisnik.");
            } else {
                console.log("Tabela Korisnik već sadrži podatke.");
            }

            // Check if Nekretnina table is empty and insert data
            const nekretninaCount = await sequelize.query(`SELECT COUNT(*) AS count FROM ${nekretninaTabela}`, {
                type: Sequelize.QueryTypes.SELECT
            });

            if (nekretninaCount[0].count === 0) {
                console.log("Tabela Nekretnina je prazna. Ubacivanje podataka...");
                await sequelize.query(`
                     INSERT INTO ${nekretninaTabela} (tip_nekretnine, naziv, kvadratura, cijena, tip_grijanja, lokacija, godina_izgradnje, datum_objave, opis)
                     VALUES
                         ('Stan', 'Modern Apartment', 85, 120000, 'Centralno', 'Sarajevo', 2010, NOW(), 'A modern apartment in the heart of the city.'),
                         ('Kuca', 'Family House', 200, 250000, 'Plinsko', 'Ilidza', 2005, NOW(), 'Spacious family house with a garden.')
                 `);
                console.log("Podaci ubačeni u tabelu Nekretnina.");
            } else {
                console.log("Tabela Nekretnina već sadrži podatke.");
            }

        } catch (error) {
            console.error("Greška prilikom ubacivanja podataka:", error.message);
        }

        // ukloni podatke iz tabela Ponuda i Zahtjev
        await sequelize.query(`TRUNCATE TABLE ${ponudaTabela}`);
        await sequelize.query(`TRUNCATE TABLE ${zahtjevTabela}`);

        // Prijava admin korisnika
        let responseAdmin = await request(apiUrl).post("/login").send({ username: "admin", password: "admin" });
        expect(responseAdmin.status).to.equal(200);
        cookieAdmin = responseAdmin.header['set-cookie'];

        // Prijava obicnog korisnika
        let responseUser = await request(apiUrl).post("/login").send({ username: "user", password: "user" });
        expect(responseUser.status).to.equal(200);
        cookieUser = responseUser.header['set-cookie'];
    });


    describe("########## POST /nekretnina/:id/ponuda ##########", () => {
        it("Korisnik može kreirati početnu ponudu", async () => {
            let response = await request(apiUrl)
                .post("/nekretnina/1/ponuda")
                .set("Cookie", cookieUser)
                .send({ tekst: "Pocetna ponuda korisnika", ponudaCijene: 200000, datumPonude: "2025-02-10", idVezanePonude: null, odbijenaPonuda: false });

            console.log(response.body);

            expect(response.status).to.be.within(200, 299);
            const lastPonuda = await sequelize.query(`
                SELECT * FROM ${ponudaTabela}
                ORDER BY id DESC
                LIMIT 1
            `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the last entry matches the expected values
            expect(lastPonuda[0].tekst).to.contain("Pocetna");
        });

        it("Admin može odgovoriti na ponudu korisnika novom ponudom", async () => {
            let response = await request(apiUrl)
                .post("/nekretnina/1/ponuda")
                .set("Cookie", cookieAdmin)
                .send({ tekst: "Kontraponuda admina", ponudaCijene: 190000, datumPonude: "2025-02-11", idVezanePonude: 1, odbijenaPonuda: false });

            console.log(response.body);

            expect(response.status).to.be.within(200, 299);

            const lastPonuda = await sequelize.query(`
        SELECT * FROM ${ponudaTabela}
        ORDER BY id DESC
        LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the last entry matches the expected values
            expect(lastPonuda[0].tekst).to.contain("Kontraponuda");
        });

        it("Korisnik može odgovoriti na ponudu vezanu za svoju ponudu", async () => {
            let response = await request(apiUrl)
                .post("/nekretnina/1/ponuda")
                .set("Cookie", cookieUser)
                .send({ tekst: "Korisnikov odgovor na ponudu", ponudaCijene: 195000, datumPonude: "2025-02-12", idVezanePonude: 2, odbijenaPonuda: false });

            console.log(response.body);

            expect(response.status).to.be.within(200, 299);

            const lastPonuda = await sequelize.query(`
        SELECT * FROM ${ponudaTabela}
        ORDER BY id DESC
        LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the last entry matches the expected values
            expect(lastPonuda[0].tekst).to.contain("odgovor");
        });

        it("Admin može odbiti ponudu korisnika", async () => {
            let response = await request(apiUrl)
                .post("/nekretnina/1/ponuda")
                .set("Cookie", cookieAdmin)
                .send({ tekst: "Odbijena ponuda admina", ponudaCijene: 0, datumPonude: "2025-02-13", idVezanePonude: 3, odbijenaPonuda: true });

            console.log(response.body);

            expect(response.status).to.be.within(200, 299);

            const lastPonuda = await sequelize.query(`
        SELECT * FROM ${ponudaTabela}
        ORDER BY id DESC
        LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the last entry matches the expected values
            expect(lastPonuda[0].tekst).to.contain("Odbijena");
        });

        it("Nove ponude ne mogu biti dodane nakon što je ponuda odbijena", async () => {
            let response = await request(apiUrl)
                .post("/nekretnina/1/ponuda")
                .set("Cookie", cookieUser)
                .send({ tekst: "Ponuda nakon odbijanja", ponudaCijene: 210000, datumPonude: "2025-02-14", idVezanePonude: 3, odbijenaPonuda: false });

            console.log(response.body);

            expect(response.status).to.be.within(400, 499);

            const lastPonuda = await sequelize.query(`
        SELECT * FROM ${ponudaTabela}
        ORDER BY id DESC
        LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the last entry matches the expected values
            expect(lastPonuda[0].tekst).to.not.contain("odbijanja");
        });

        it("Korisnik može odbiti svoju ponudu", async () => {
            // dodaj novu ponudu
            let response0 = await request(apiUrl)
                .post("/nekretnina/1/ponuda")
                .set("Cookie", cookieUser)
                .send({ tekst: "Neka ponuda", ponudaCijene: 50000, datumPonude: "2025-02-15", idVezanePonude: null, odbijenaPonuda: false });

            let response = await request(apiUrl)
                .post("/nekretnina/1/ponuda")
                .set("Cookie", cookieUser)
                .send({ tekst: "Odbio sam svoju ponudu", ponudaCijene: 50000, datumPonude: "2025-02-15", idVezanePonude: 5, odbijenaPonuda: true });

            console.log(response.body);

            expect(response.status).to.be.within(200, 299);

            const lastPonuda = await sequelize.query(`
        SELECT * FROM ${ponudaTabela}
        ORDER BY id DESC
        LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the last entry matches the expected values
            expect(lastPonuda[0].tekst).to.contain("Odbio sam");
        });
    });

    describe("########## POST /nekretnina/:id/zahtjev ##########", () => {
        it("Kreiranje zahtjeva sa ispravnim datumom", async () => {
            let response = await request(apiUrl)
                .post("/nekretnina/1/zahtjev")
                .set("Cookie", cookieUser)
                .send({ tekst: "Zelim pregledati nekretninu", trazeniDatum: "15.02.2025." });
            //.send({ tekst: "Zelim pregledati nekretninu", trazeniDatum: "2025-02-15" });

            console.log(response.body);

            expect(response.status).to.be.within(200, 299);

            const lastZahtjev = await sequelize.query(`
        SELECT * FROM ${zahtjevTabela}
        ORDER BY id DESC
        LIMIT 1
    `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the last entry matches the expected values
            expect(lastZahtjev[0].tekst).to.contain("Zelim");
        });

        it("Kreiranje zahtjeva sa neispravnim datumom", async () => {
            let response = await request(apiUrl)
                .post("/nekretnina/1/zahtjev")
                .set("Cookie", cookieUser)
                .send({ tekst: "Neispravan datum", trazeniDatum: "2024-01-01" });

            console.log(response.body);

            expect(response.status).to.be.within(400, 499);
            console.log("Poruka greske: ", response.body.message);
        });
    });

    describe("########## PUT /nekretnina/:id/zahtjev/:zid ##########", () => {
        it("Admin moze odobriti zahtjev sa addToTekst = null", async () => {
            let response = await request(apiUrl)
                .put("/nekretnina/1/zahtjev/1")
                .set("Cookie", cookieAdmin)
                .send({ odobren: true, addToTekst: null });

            console.log(response.body);

            expect(response.status).to.be.within(200, 299);

            const prviZahtjev = await sequelize.query(`
        SELECT * FROM ${zahtjevTabela}
        WHERE id = 1
    `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the first entry matches the expected values
            expect(prviZahtjev[0].odobren).to.be.ok;
            expect(prviZahtjev[0].tekst).to.contain("Zelim");
        });

        it("Admin moye odbiti zahtjev sa addToTekst", async () => {
            let response = await request(apiUrl)
                .put("/nekretnina/1/zahtjev/1")
                .set("Cookie", cookieAdmin)
                .send({ odobren: false, addToTekst: "Zahtjev odbijen zbog zauzetosti termina" });

            console.log(response.body);

            expect(response.status).to.be.within(200, 299);

            const prviZahtjev = await sequelize.query(`
        SELECT * FROM ${zahtjevTabela}
        WHERE id = 1
    `, { type: Sequelize.QueryTypes.SELECT });

            // Assert that the first entry matches the expected values
            expect(prviZahtjev[0].odobren).to.not.be.ok;
            expect(prviZahtjev[0].tekst).to.contain("Zelim");
            expect(prviZahtjev[0].tekst).to.contain("zauzetosti");
        });

        it("Admin ne moze odbiti zahtjev bez addToTekst", async () => {
            let response = await request(apiUrl)
                .put("/nekretnina/1/zahtjev/1")
                .set("Cookie", cookieAdmin)
                .send({ odobren: false, addToTekst: null });

            console.log(response.body);

            expect(response.status).to.be.within(400, 499);
        });

        it("Obicni korisnik ne moze odgovoriti na zahtjev", async () => {
            let response = await request(apiUrl)
                .put("/nekretnina/1/zahtjev/1")
                .set("Cookie", cookieUser)
                .send({ odobren: true, addToTekst: null });

            console.log(response.body);

            expect(response.status).to.be.within(400, 499);

        });
    });

    describe("########## GET /nekretnina/:id/interesovanja ##########", () => {
        it("Admin korisnik treba dobiti sve podatke o interesovanjima (1)", async () => {
            let response = await request(apiUrl).get("/nekretnina/1/interesovanja").set("Cookie", cookieAdmin);
            console.log(response.body);
            expect(response.status).to.be.within(200, 299);
            expect(response.body).to.be.an("array");
            expect(response.body.length).to.be.greaterThan(0);

            // Pronadji objekat sa tekstom "Pocetna"
            const objWithTekst = response.body.find(obj => obj.tekst.includes("Pocetna"));
            expect(objWithTekst).to.exist;

            // Provjeri da li objekt ima property "cijen"
            const hasCijenaProperty = Object.keys(objWithTekst).some(key => key.toLowerCase().includes("cijen"));
            expect(hasCijenaProperty).to.be.true;

            // Pronadji objekat sa tekstom "Kontraponuda"
            const objWithTekst1 = response.body.find(obj => obj.tekst.includes("Kontraponuda"));
            expect(objWithTekst1).to.exist;

            // Provjeri da li objekt ima property "cijen"
            const hasCijenaProperty1 = Object.keys(objWithTekst).some(key => key.toLowerCase().includes("cijen"));
            expect(hasCijenaProperty1).to.be.true;
        });

        it("Admin korisnik treba dobiti sve podatke o interesovanjima (2)", async () => {
            let response = await request(apiUrl).get("/nekretnina/1/interesovanja").set("Cookie", cookieAdmin);
            console.log(response.body);
            expect(response.status).to.be.within(200, 299);
            expect(response.body).to.be.an("array");
            expect(response.body.length).to.be.greaterThan(0);

            // Pronadji objekat sa tekstom "pregledati"
            const objWithTekst = response.body.find(obj => obj.tekst.includes("pregledati"));
            expect(objWithTekst).to.exist;
        });

        it("Neloginovani korisnik treba dobiti interesovanja bez cijena za ponude koje nisu njegove", async () => {
            let response = await request(apiUrl).get("/nekretnina/1/interesovanja");
            console.log(response.body);
            expect(response.status).to.be.within(200, 299);
            expect(response.body).to.be.an("array");

            // Pronadji objekat sa tekstom "Pocetna"
            const objWithTekst = response.body.find(obj => obj.tekst.includes("Pocetna"));
            expect(objWithTekst).to.exist;

            // Provjeri da li objekt ima property "cijen"
            const hasCijenaProperty = Object.keys(objWithTekst).some(key => key.toLowerCase().includes("cijen"));
            expect(hasCijenaProperty).to.be.false;

            // Pronadji objekat sa tekstom "Kontraponuda"
            const objWithTekst1 = response.body.find(obj => obj.tekst.includes("Kontraponuda"));
            expect(objWithTekst1).to.exist;

            // Provjeri da li objekt ima property "cijen"
            const hasCijenaProperty1 = Object.keys(objWithTekst).some(key => key.toLowerCase().includes("cijen"));
            expect(hasCijenaProperty1).to.be.false;
        });

        it("Loginovani korisnik treba dobiti interesovanja sa cijenama za svoje ponude", async () => {
            let response = await request(apiUrl).get("/nekretnina/1/interesovanja").set("Cookie", cookieUser);
            console.log(response.body);
            expect(response.status).to.be.within(200, 299);
            expect(response.body).to.be.an("array");

            // Pronadji objekat sa tekstom "Pocetna"
            const objWithTekst = response.body.find(obj => obj.tekst.includes("Pocetna"));
            expect(objWithTekst).to.exist;

            // Provjeri da li objekt ima property "cijen"
            const hasCijenaProperty = Object.keys(objWithTekst).some(key => key.toLowerCase().includes("cijen"));
            expect(hasCijenaProperty).to.be.true;

            // Pronadji objekat sa tekstom "Kontraponuda"
            const objWithTekst1 = response.body.find(obj => obj.tekst.includes("Kontraponuda"));
            expect(objWithTekst1).to.exist;

            // Provjeri da li objekt ima property "cijen"
            const hasCijenaProperty1 = Object.keys(objWithTekst).some(key => key.toLowerCase().includes("cijen"));
            expect(hasCijenaProperty1).to.be.true;
        });
    });
});