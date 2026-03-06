/* =====================================================
   NETTOTRACK - MENU & UI CONTROLLER
   ===================================================== */

window.switchSection = (sectionId) => {
    const sections = document.querySelectorAll('.appSection');
    const buttons = document.querySelectorAll('.navBtn');

    // 1. Spegni tutto
    sections.forEach(s => s.classList.remove('activeSection'));
    buttons.forEach(b => b.classList.remove('isActive'));

    // 2. Accendi la sezione scelta
    const target = document.getElementById(sectionId);
    const targetBtn = document.querySelector(`[data-section="${sectionId}"]`);

    if (target) {
        target.classList.add('activeSection');
        
        // Refresh dei dati quando cambi pagina
        if (sectionId === 'calendar-insert' && typeof renderCalendar === 'function') renderCalendar();
        if (sectionId === 'calendar-view' && typeof renderAgenda === 'function') renderAgenda();
        if (sectionId === 'stats' && typeof renderStats === 'function') renderStats();
    }

    if (targetBtn) targetBtn.classList.add('isActive');
};

// Al caricamento, mostra la prima pagina
document.addEventListener('DOMContentLoaded', () => {
    window.switchSection('calendar-insert');
});
