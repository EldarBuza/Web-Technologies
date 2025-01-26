document.addEventListener('DOMContentLoaded', () => {
    PoziviAjax.getMojiUpiti((error, upiti) => {
        const container = document.getElementById('upiti-container');
        if (error) {
            container.innerHTML = `<p style="color: red;">Greška pri učitavanju upita: ${error.statusText}</p>`;
            return;
        }

        if (!upiti || upiti.length === 0) {
            container.innerHTML = '<p>Nemate nijedan upit.</p>';
            return;
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID Nekretnine</th>
                        <th>Tekst Upita</th>
                    </tr>
                </thead>
                <tbody>
        `;

        upiti.forEach(upit => {
            tableHTML += `
                <tr>
                    <td>${upit.id_nekretnine}</td>
                    <td>${upit.tekst_upita}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    });
});
