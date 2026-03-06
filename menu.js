document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.navBtn');
    const sections = document.querySelectorAll('.appSection');

    window.switchSection = (sectionId) => {
        // 1. Rimuovi lo stato attivo da tutti i pulsanti
        navButtons.forEach(btn => btn.classList.remove('isActive'));
        
        // 2. Nascondi tutte le sezioni
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // 3. Attiva la sezione scelta
        const targetSection = document.getElementById(sectionId);
        const targetBtn = document.querySelector(`[data-section="${sectionId}"]`);

        if (targetSection) {
            targetSection.style.display = 'flex'; // Usiamo flex per mantenere il layout responsive
        }
        
        if (targetBtn) {
            targetBtn.classList.add('isActive');
        }

        // 4. Trigger dei refresh (se necessario)
        if (sectionId === 'calendar-view' && typeof renderAgenda === 'function') {
            renderAgenda();
        }
        if (sectionId === 'stats' && typeof renderStats === 'function') {
            renderStats();
        }
    };

    // Inizializzazione: mostriamo la prima sezione (solitamente il calendario)
    switchSection('calendar-insert');
});

/* =====================================================
   NETTOTRACK - UI CONTROLLER
   Gestione navigazione e inizializzazione
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Inizializza l'app mostrando la prima sezione
    console.log("NettoTrack UI Initialized");
    
    // Gestione globale degli errori di caricamento immagini/risorse
    window.addEventListener('error', (e) => {
        console.warn("Risorsa non caricata correttamente:", e.target.src || e.target.href);
    }, true);
});

// Funzione globale per cambiare sezione (usata dal menu)
window.switchSection = (sectionId) => {
    const sections = document.querySelectorAll('.appSection');
    const navButtons = document.querySelectorAll('.navBtn');

    sections.forEach(s => {
        s.style.display = 'none';
        s.classList.remove('activeSection');
    });

    navButtons.forEach(b => b.classList.remove('isActive'));

    const target = document.getElementById(sectionId);
    const targetBtn = document.querySelector(`[data-section="${sectionId}"]`);

    if (target) {
        target.style.display = 'flex';
        target.classList.add('activeSection');
        
        // Trigger automatici per aggiornare i dati nella vista
        if (sectionId === 'calendar-view' && window.renderAgenda) renderAgenda();
        if (sectionId === 'calendar-insert' && window.renderCalendar) renderCalendar();
        if (sectionId === 'stats' && window.renderStats) renderStats();
    }

    if (targetBtn) targetBtn.classList.add('isActive');
};

