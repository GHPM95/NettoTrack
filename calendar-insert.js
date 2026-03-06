document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi della UI
    const grid = document.querySelector('.cinsGrid');
    const monthLabel = document.querySelector('.cinsMonthLabel');
    const prevBtn = document.querySelector('.cinsPrev');
    const nextBtn = document.querySelector('.cinsNext');

    // Stato locale del calendario
    let currentDisplayDate = new Date();

    const render = () => {
        grid.innerHTML = '';
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth();

        // Titolo del mese (es: "Marzo 2026")
        const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
                            "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        monthLabel.textContent = `${monthNames[month]} ${year}`;

        // Calcolo della griglia (42 celle per stabilità visiva)
        const firstDay = new Date(year, month, 1).getDay();
        const startingPoint = (firstDay === 0 ? 6 : firstDay - 1); // Lunedì come primo giorno
        const totalCells = 42;

        for (let i = 0; i < totalCells; i++) {
            const dayDate = new Date(year, month, 1 - startingPoint + i);
            const dayBtn = document.createElement('div');
            
            // Assegnazione Classi (Logica Pura)
            dayBtn.className = 'cinsDay';
            if (dayDate.getMonth() !== month) dayBtn.classList.add('isOff');
            
            // Check "Oggi"
            const today = new Date();
            if (dayDate.toDateString() === today.toDateString()) {
                dayBtn.classList.add('isToday');
            }

            // Inserimento Numero Giorno
            const numSpan = document.createElement('span');
            numSpan.className = 'cinsNum';
            numSpan.textContent = dayDate.getDate();
            dayBtn.appendChild(numSpan);

            // LOGICA CONTABILE: Caricamento dati per i puntini (Dots)
            const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
            const data = NTCal.loadDay(dateKey);
            
            if (data && data.shifts.length > 0) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'cinsDots';
                
                // Un pallino per ogni tipo di turno trovato
                const hasExtra = data.shifts.some(s => s.tags?.overtime || s.tags?.holiday);
                
                const dotBase = document.createElement('div');
                dotBase.className = 'cinsDot premium';
                dotsContainer.appendChild(dotBase);
                
                if (hasExtra) {
                    const dotExtra = document.createElement('div');
                    dotExtra.className = 'cinsDot premiumExtra';
                    dotsContainer.appendChild(dotExtra);
                }
                
                dayBtn.appendChild(dotsContainer);
            }

            // Evento Click (Apertura Editor)
            dayBtn.onclick = () => {
                // Qui chiameremo la funzione globale per aprire l'editor
                if (typeof openEditor === 'function') openEditor(dateKey);
            };

            grid.appendChild(dayBtn);
        }
    };

    // Navigazione Mesi
    prevBtn.onclick = () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
        render();
    };

    nextBtn.onclick = () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
        render();
    };

    // Primo avvio
    render();
});
