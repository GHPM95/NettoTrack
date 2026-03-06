/* =====================================================
   NETTOTRACK - CALENDAR VIEW (L'Agenda)
   Gestisce la visualizzazione dei turni e del netto giornaliero
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Riferimenti agli elementi (Assicurati che questi ID/Classi siano nell'HTML)
    const dayStrip = document.querySelector('.cviewDayStrip'); 
    const shiftList = document.querySelector('.cviewShiftList'); 
    const dailyTotalNet = document.querySelector('.cviewTotalNet'); 

    // Data di riferimento per l'agenda (default oggi)
    let selectedDate = new Date(); 

    window.renderAgenda = () => {
        if (!dayStrip || !shiftList) return;

        dayStrip.innerHTML = '';
        shiftList.innerHTML = '';

        // 2. GENERAZIONE STRIP SETTIMANALE (7 giorni)
        const startOfWeek = new Date(selectedDate);
        // Troviamo il lunedì della settimana corrente
        const dayDiff = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1;
        startOfWeek.setDate(selectedDate.getDate() - dayDiff);

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);

            const dayBtn = document.createElement('div');
            dayBtn.className = 'cviewDayBtn';
            
            // Applichiamo le classi di stile dal theme.css
            if (currentDay.toDateString() === new Date().toDateString()) dayBtn.classList.add('isToday');
            if (currentDay.toDateString() === selectedDate.toDateString()) dayBtn.classList.add('isSelected');

            dayBtn.innerHTML = `
                <span class="cviewDayName">${['D','L','M','M','G','V','S'][currentDay.getDay()]}</span>
                <span class="cviewDayNum">${currentDay.getDate()}</span>
            `;

            dayBtn.onclick = () => {
                selectedDate = currentDay;
                renderAgenda();
            };
            dayStrip.appendChild(dayBtn);
        }

        // 3. CARICAMENTO DATI E LOGICA CONTABILE
        const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const data = NTCal.loadDay(dateKey);
        const finance = NTCal.calculateFinance(data);

        // Mostriamo il netto del giorno (usando il formato Euro del Core)
        if (dailyTotalNet) {
            dailyTotalNet.textContent = finance.net > 0 ? `+ ${finance.net.toFixed(2)}€` : `0,00€`;
        }

        // 4. RENDERING DELLE CARD TURNI
        if (!data.shifts || data.shifts.length === 0) {
            shiftList.innerHTML = `<div class="cviewEmpty">Nessun turno per questo giorno</div>`;
        } else {
            data.shifts.forEach(shift => {
                const card = document.createElement('div');
                card.className = 'cviewDayCard';
                
                // Determiniamo il colore del tag basato sulla logica contabile
                let tagLabel = 'Ordinario';
                let accentClass = 'accent-blue'; 

                if (shift.tags?.overtime) {
                    tagLabel = 'Straordinario';
                    accentClass = 'accent-purple';
                } else if (shift.tags?.holiday || shift.tags?.sunday) {
                    tagLabel = 'Festivo';
                    accentClass = 'accent-pink';
                }

                card.innerHTML = `
                    <div class="cviewCardHeader">
                        <span class="cviewTime">${shift.from} - ${shift.to}</span>
                        <span class="cviewTag" style="color: var(--${accentClass})">${tagLabel}</span>
                    </div>
                    ${shift.note ? `<div class="cviewNotes">${shift.note}</div>` : ''}
                `;
                shiftList.appendChild(card);
            });
        }
    };

    // Primo avvio dell'agenda
    renderAgenda();
});
