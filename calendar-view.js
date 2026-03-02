/* calendar-view.js
   Calendar View (Agenda)
   ✅ Legge SOLO i dati salvati (NTCal.loadDay)
   ❌ NON legge autosave/bozze (loadDraft)

   - Frecce: paginazione a blocchi di 7 giorni
   - Strip: 7 giorni visibili (L M M G V S D + numero)
   - Oggi: stesso design del calendar insert (token CSS today*)
   - Selezionato: glass neutro
   - Riepilogo read-only ordinato per orario
*/

(function(){
  const els = {
    title: document.getElementById('cvTitle'),
    prev: document.getElementById('cvPrev'),
    next: document.getElementById('cvNext'),
    close: document.getElementById('cvClose'),
    days: document.getElementById('cvDays'),
    sumDate: document.getElementById('cvSummaryDate'),
    badges: document.getElementById('cvSummaryBadges'),
    blocks: document.getElementById('cvBlocks'),
    notesWrap: document.getElementById('cvNotesWrap'),
    notesText: document.getElementById('cvNotesText'),
  };

  const state = {
    pageStart: startOfWeek(new Date()),   // lunedì
    selected: todayISO(),
    today: todayISO(),
  };

  function updateTitle(){
    const d = isoToDate(state.selected);
    els.title.textContent = formatMonthYear(d);
  }

  function renderWeek(){
    els.days.innerHTML = '';
    const start = new Date(state.pageStart);

    for(let i=0;i<7;i++){
      const d = addDays(start, i);
      const iso = dateToISO(d);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dayBtn';
      btn.dataset.iso = iso;

      const dow = document.createElement('div');
      dow.className = 'dayDow';
      dow.textContent = dowLetter(d);

      const num = document.createElement('div');
      num.className = 'dayNum';
      num.textContent = String(d.getDate()).padStart(2,'0');

      btn.appendChild(dow);
      btn.appendChild(num);

      if(iso === state.today) btn.classList.add('isToday');
      if(iso === state.selected) btn.classList.add('isSelected');

      btn.addEventListener('click', async () => {
        state.selected = iso;
        syncSelectedStyles();
        updateTitle();
        await renderSummary(iso);
      });

      els.days.appendChild(btn);
    }

    // se il selected non è dentro la pagina, lo allineo al primo giorno visibile
    if(!isISOInCurrentWeek(state.selected)){
      state.selected = dateToISO(start);
      updateTitle();
    }

    syncSelectedStyles();
  }

  function syncSelectedStyles(){
    const buttons = els.days.querySelectorAll('.dayBtn');
    buttons.forEach(b => {
      const iso = b.dataset.iso;
      b.classList.toggle('isSelected', iso === state.selected);
      b.classList.toggle('isToday', iso === state.today);
      // oggi resta “oggi” anche se selezionato
      if(iso === state.today && iso === state.selected){
        b.classList.add('isSelected');
        b.classList.add('isToday');
      }
    });
  }

  function isISOInCurrentWeek(iso){
    const start = dateToISO(state.pageStart);
    const end = dateToISO(addDays(state.pageStart, 6));
    return iso >= start && iso <= end;
  }

  /* =========================
     DATI: SOLO SAVED (NO DRAFT)
     ========================= */
  async function loadDaySavedOnly(iso){
    const cal = window.NTCal;
    if(!cal || typeof cal.loadDay !== "function"){
      return { shifts: [], hasOvertime:false, isHoliday:false, isSundayPay:false, advancedOption:"", notes:"" };
    }

    // ✅ SOLO definitivo
    let model = null;
    try { model = cal.loadDay(iso); } catch(_) {}

    const shiftsRaw = Array.isArray(model?.shifts) ? model.shifts : [];

    // Normalizzo nel formato VIEW
    const shifts = shiftsRaw.map((s) => {
      const from = typeof s?.from === "string" ? s.from : "";
      const to   = typeof s?.to   === "string" ? s.to   : "";

      const tags = s?.tags || {};
      const advA = typeof s?.advA === "string" ? s.advA : "-";
      const advB = typeof s?.advB === "string" ? s.advB : "-";

      const st = String(s?.shiftType || "none");
      const typeMap = { morning:"Mattino", afternoon:"Pomeriggio", night:"Notte", none:"" };

      const tagBits = [];
      if(tags.overtime) tagBits.push("Straordinario");
      if(tags.holiday)  tagBits.push("Festivo");
      if(tags.sunday)   tagBits.push("Domenicale");

      const adv = (advA && advA !== "-") ? advA : ((advB && advB !== "-") ? advB : "");

      return {
        start: from,
        end: to,
        type: typeMap[st] || "",
        tag: tagBits.join(" · "),
        advanced: adv,
        note: typeof s?.note === "string" ? s.note : ""
      };
    });

    // Flags giorno
    const hasOvertime = shiftsRaw.some(s => !!s?.tags?.overtime);
    const isHoliday   = shiftsRaw.some(s => !!s?.tags?.holiday);
    const isSundayPay = shiftsRaw.some(s => !!s?.tags?.sunday);

    const advancedOption =
      (shiftsRaw.find(s => s?.advA && s.advA !== "-")?.advA) ||
      (shiftsRaw.find(s => s?.advB && s.advB !== "-")?.advB) ||
      "";

    const notes = typeof model?.notes === "string" ? model.notes : "";

    return { shifts, hasOvertime, isHoliday, isSundayPay, advancedOption, notes };
  }

  /* =========================
     SUMMARY (READ ONLY)
     ========================= */
  async function renderSummary(iso){
    const d = isoToDate(iso);
    els.sumDate.textContent = formatLongDate(d);

    const day = await loadDaySavedOnly(iso);

    // badges
    els.badges.innerHTML = '';
    const badges = [];
    if(day.isHoliday) badges.push('Festività');
    if(day.isSundayPay) badges.push('Domenicale');
    if(day.hasOvertime) badges.push('Straordinari');
    if(day.advancedOption) badges.push(String(day.advancedOption));

    badges.forEach(t => {
      const b = document.createElement('div');
      b.className = 'badge';
      b.textContent = t;
      els.badges.appendChild(b);
    });

    // turni ordinati per ora
    const shifts = Array.isArray(day.shifts) ? day.shifts.slice() : [];
    shifts.sort((a,b) => timeToMin(a.start) - timeToMin(b.start));

    els.blocks.innerHTML = '';

    if(!shifts.length){
      const empty = document.createElement('div');
      empty.className = 'emptyState';
      empty.textContent = 'Nessun turno salvato per questo giorno.';
      els.blocks.appendChild(empty);
    }else{
      shifts.forEach(s => {
        const card = document.createElement('div');
        card.className = 'block';

        const top = document.createElement('div');
        top.className = 'blockTop';

        const time = document.createElement('div');
        time.className = 'blockTime';
        time.textContent = `${s.start || "—"} – ${s.end || "—"}`;

        const tag = document.createElement('div');
        tag.className = 'blockTag';
        tag.textContent = s.tag ? String(s.tag) : '';

        top.appendChild(time);
        top.appendChild(tag);

        const lines = [];
        if(s.type) lines.push(`Fascia: ${s.type}`);
        if(s.advanced) lines.push(`Avanzate: ${s.advanced}`);
        if(s.note && String(s.note).trim().length) lines.push(`Nota: ${String(s.note).trim()}`);

        card.appendChild(top);

        if(lines.length){
          const meta = document.createElement('div');
          meta.className = 'blockMeta';
          meta.textContent = lines.join(' · ');
          card.appendChild(meta);
        }

        els.blocks.appendChild(card);
      });
    }

    // note “giorno” (se un domani le aggiungi)
    const notes = (day.notes || '').trim();
    if(notes){
      els.notesWrap.hidden = false;
      els.notesText.textContent = notes;
    }else{
      els.notesWrap.hidden = true;
      els.notesText.textContent = '';
    }
  }

  /* =========================
     NAV (7 giorni)
     ========================= */
  els.prev.addEventListener('click', async () => {
    state.pageStart = addDays(state.pageStart, -7);
    state.selected = dateToISO(state.pageStart);
    updateTitle();
    renderWeek();
    await renderSummary(state.selected);
  });

  els.next.addEventListener('click', async () => {
    state.pageStart = addDays(state.pageStart, +7);
    state.selected = dateToISO(state.pageStart);
    updateTitle();
    renderWeek();
    await renderSummary(state.selected);
  });

  // X: chiudi card (hook)
  els.close.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('nt:calendarViewClose'));
  });

  /* =========================
     INIT
     ========================= */
  (async function init(){
    state.pageStart = startOfWeek(new Date());
    state.selected = state.today;
    updateTitle();
    renderWeek();
    await renderSummary(state.selected);
  })();

  /* =========================
     UTILS
     ========================= */
  function todayISO(){ return dateToISO(new Date()); }

  function dateToISO(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }

  function isoToDate(iso){
    const [y,m,d] = iso.split('-').map(n=>parseInt(n,10));
    return new Date(y, m-1, d);
  }

  function addDays(d, n){
    const x = new Date(d);
    x.setDate(x.getDate()+n);
    return x;
  }

  function startOfWeek(d){
    const x = new Date(d);
    const day = x.getDay(); // 0 dom, 1 lun...
    const diff = (day === 0 ? -6 : 1 - day); // lunedì start
    x.setDate(x.getDate() + diff);
    x.setHours(12,0,0,0);
    return x;
  }

  function dowLetter(d){
    const arr = ['D','L','M','M','G','V','S'];
    return arr[d.getDay()];
  }

  function formatMonthYear(d){
    const mesi = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    return `${mesi[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatLongDate(d){
    const giorni = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    const mesi = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
    return `${giorni[d.getDay()]} ${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
  }

  function timeToMin(t){
    if(!t || !t.includes(':')) return 999999;
    const [h,m] = t.split(':').map(n=>parseInt(n,10));
    return (h*60)+(m||0);
  }
})();