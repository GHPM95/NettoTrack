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
