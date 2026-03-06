document.addEventListener('DOMContentLoaded', () => {
    const editorRoot = document.querySelector('.deRoot');
    const inputFrom = document.querySelector('#timeFrom');
    const inputTo = document.querySelector('#timeTo');
    const inputPause = document.querySelector('#pauseMin');
    const checkExtra = document.querySelector('#isOvertime');
    const checkHoliday = document.querySelector('#isHoliday');
    const noteArea = document.querySelector('#dayNotes');
    
    let activeKey = null; // La data (YYYY-MM-DD) su cui stiamo lavorando

    // FUNZIONE GLOBALE PER APRIRE L'EDITOR (chiamata dagli altri file)
    window.openEditor = (dateKey) => {
        activeKey = dateKey;
        const data = NTCal.loadDay(dateKey); // Carichiamo dal Core

        // Popoliamo i campi (se il turno esiste, altrimenti reset)
        const firstShift = data.shifts[0] || {};
        inputFrom.value = firstShift.from || "09:00";
        inputTo.value = firstShift.to || "18:00";
        inputPause.value = firstShift.pauseMin || 0;
        checkExtra.checked = firstShift.tags?.overtime || false;
        checkHoliday.checked = firstShift.tags?.holiday || false;
        noteArea.value = firstShift.note || "";

        editorRoot.classList.add('isOpen'); // Mostriamo l'interfaccia
    };

    // LOGICA DI SALVATAGGIO
    window.saveEntry = () => {
        if (!activeKey) return;

        // Costruiamo l'oggetto turno
        const shiftObj = {
            from: inputFrom.value,
            to: inputTo.value,
            pauseMin: parseInt(inputPause.value) || 0,
            pausePaid: false, // Default come da logica contabile
            note: noteArea.value.trim(),
            tags: {
                overtime: checkExtra.checked,
                holiday: checkHoliday.checked,
                sunday: new Date(activeKey).getDay() === 0
            }
        };

        // Prepariamo il pacchetto per il Core
        const dayData = {
            shifts: [shiftObj] // Per ora gestiamo un turno singolo per semplicità
        };

        // Invio al Core per il salvataggio fisico
        NTCal.saveDay(activeKey, dayData);

        // Chiudiamo l'editor e aggiorniamo le altre viste
        editorRoot.classList.remove('isOpen');
        
        // Refresh automatico delle viste se presenti nel DOM
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderAgenda === 'function') renderAgenda();
    };

    window.closeEditor = () => {
        editorRoot.classList.remove('isOpen');
    };
});
