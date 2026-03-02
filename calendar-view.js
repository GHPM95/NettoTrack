/* =========================
   calendar-view.js (Agenda)
   Monta in #calViewMount
   ✅ SOLO NTCal.loadDay (salvati)
   ❌ MAI loadDraft/saveDraft
   ========================= */
(() => {
  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];

  let mounted = false;

  // stato view
  let pageStartISO = null;   // lunedì della “pagina”
  let selectedISO = null;

  function getMount(){ return document.getElementById("calViewMount"); }

  function isActuallyMounted(mount){
    return !!(mount && mount.querySelector("#cviewRoot"));
  }

  function todayISO(){
    try{
      if (window.NTCal && typeof window.NTCal.todayParts === "function"){
        const t = window.NTCal.todayParts(); // {y,m,d} con m 0-11
        return `${t.y}-${String(t.m+1).padStart(2,"0")}-${String(t.d).padStart(2,"0")}`;
      }
    }catch(_){}
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function isoToDate(iso){
    const [y,m,d] = String(iso).split("-").map(n => parseInt(n,10));
    return new Date(y, (m||1)-1, d||1);
  }

  function dateToISO(dt){
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  }

  function addDaysISO(iso, n){
    const d = isoToDate(iso);
    d.setDate(d.getDate() + n);
    return dateToISO(d);
  }

  function startOfWeekISO(iso){
    const d = isoToDate(iso);
    const day = d.getDay(); // 0 dom, 1 lun
    const diff = (day === 0 ? -6 : 1 - day); // lunedì start
    d.setDate(d.getDate() + diff);
    d.setHours(12,0,0,0);
    return dateToISO(d);
  }

  function formatMonthYear(iso){
    const d = isoToDate(iso);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatLongDate(iso){
    const d = isoToDate(iso);
    const giorni = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
    const mesi = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
    return `${giorni[d.getDay()]} ${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
  }

  function timeToMin(t){
    if(!t || !String(t).includes(":")) return 999999;
    const [h,m] = String(t).split(":").map(x => parseInt(x,10));
    return (h*60) + (m||0);
  }

  /* -------------------------
     Mount UI
  ------------------------- */
  function mountIfNeeded(){
    const mount = getMount();
    if (!mount) return;

    if (mounted && isActuallyMounted(mount)) return;

    mount.innerHTML = `
      <div class="cviewRoot" id="cviewRoot">
        <header class="cviewHeader">
          <div class="cviewLeft">
            <button class="ntBtn" id="cvPrev" type="button" aria-label="Settimana precedente">‹</button>
            <button class="ntBtn" id="cvNext" type="button" aria-label="Settimana successiva">›</button>
          </div>

          <div class="cviewTitle" id="cvTitle">—</div>

          <button class="ntBtn" id="cvClose" type="button" aria-label="Chiudi">×</button>
        </header>

        <section class="cviewWeekStrip" aria-label="Selettore giorni settimana">
          <div class="cviewDays" id="cvDays"></div>
        </section>

        <section class="cviewSummary" aria-label="Riepilogo giornata selezionata">
          <div class="cviewSummaryTop">
            <div class="cviewSummaryDate" id="cvSummaryDate">—</div>
            <div class="cviewBadges" id="cvBadges"></div>
          </div>

          <div class="cviewLines" id="cvLines"></div>

          <div class="cviewNotes" id="cvNotesWrap" hidden>
            <div class="cviewNotesTitle">Note</div>
            <div class="cviewNotesText" id="cvNotesText"></div>
          </div>
        </section>

        <div class="cviewHint">Swipe down per chiudere</div>
      </div>
    `;

    mount.querySelector("#cvClose")?.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarView"));
    });

    mount.querySelector("#cvPrev")?.addEventListener("click", async () => {
      pageStartISO = addDaysISO(pageStartISO, -7);
      selectedISO = pageStartISO;
      renderHeaderAndWeek();
      await renderSummary(selectedISO);
    });

    mount.querySelector("#cvNext")?.addEventListener("click", async () => {
      pageStartISO = addDaysISO(pageStartISO, +7);
      selectedISO = pageStartISO;
      renderHeaderAndWeek();
      await renderSummary(selectedISO);
    });

    mounted = true;
  }

  /* -------------------------
     Data: SOLO saved (no draft)
  ------------------------- */
  function loadDaySavedOnly(iso){
    const cal = window.NTCal;
    if(!cal || typeof cal.loadDay !== "function"){
      return { shifts: [], badges: {overtime:false, holiday:false, sunday:false, advanced:""}, notes:"" };
    }

    let model = null;
    try { model = cal.loadDay(iso); } catch(_) {}

    const shiftsRaw = Array.isArray(model?.shifts) ? model.shifts : [];

    // normalizzo basandomi sul tuo Day Editor
    const shifts = shiftsRaw.map((s) => {
      const from = typeof s?.from === "string" ? s.from : "";
      const to   = typeof s?.to   === "string" ? s.to   : "";

      const tags = s?.tags || {};
      const advA = typeof s?.advA === "string" ? s.advA : "-";
      const advB = typeof s?.advB === "string" ? s.advB : "-";

      const st = String(s?.shiftType || "none");
      const typeMap = { morning:"Mattino", afternoon:"Pomeriggio", night:"Notte", none:"" };

      const adv = (advA && advA !== "-") ? advA : ((advB && advB !== "-") ? advB : "");

      // priorità dot (se ci sono più flag)
      // overtime > holiday > sunday > base
      const dotKind =
        tags.overtime ? "over" :
        tags.holiday  ? "holiday" :
        tags.sunday   ? "sunday" :
        "base";

      // stringa “extra” sotto (solo se presente)
      const extras = [];
      if(tags.overtime) extras.push("Straordinario");
      if(tags.holiday)  extras.push("Festivo");
      if(tags.sunday)   extras.push("Domenicale");
      if(typeMap[st])   extras.push(`Fascia: ${typeMap[st]}`);
      if(adv)           extras.push(`Avanzate: ${adv}`);

      const note = typeof s?.note === "string" ? s.note : "";
      if(note.trim()) extras.push(`Nota: ${note.trim()}`);

      return {
        start: from,
        end: to,
        dotKind,
        sub: extras.join(" · "),
      };
    });

    const badges = {
      overtime: shiftsRaw.some(s => !!s?.tags?.overtime),
      holiday:  shiftsRaw.some(s => !!s?.tags?.holiday),
      sunday:   shiftsRaw.some(s => !!s?.tags?.sunday),
      advanced:
        (shiftsRaw.find(s => s?.advA && s.advA !== "-")?.advA) ||
        (shiftsRaw.find(s => s?.advB && s.advB !== "-")?.advB) ||
        ""
    };

    const notes = typeof model?.notes === "string" ? model.notes : "";
    return { shifts, badges, notes };
  }

  /* -------------------------
     Render Header + Week
  ------------------------- */
  function renderHeaderAndWeek(){
    const mount = getMount();
    if(!mount) return;

    const titleEl = mount.querySelector("#cvTitle");
    const daysEl = mount.querySelector("#cvDays");
    if(titleEl) titleEl.textContent = formatMonthYear(selectedISO);

    if(!daysEl) return;
    daysEl.innerHTML = "";

    const today = todayISO();

    for(let i=0;i<7;i++){
      const iso = addDaysISO(pageStartISO, i);
      const d = isoToDate(iso);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cviewDayBtn";
      btn.dataset.iso = iso;

      const dow = document.createElement("div");
      dow.className = "cviewDow";
      // L M M G V S D (lunedì-start)
      dow.textContent = WDN[(d.getDay() + 6) % 7];

      const num = document.createElement("div");
      num.className = "cviewNum";
      num.textContent = String(d.getDate()).padStart(2,"0");

      btn.appendChild(dow);
      btn.appendChild(num);

      if(iso === today) btn.classList.add("isToday");
      if(iso === selectedISO) btn.classList.add("isSelected");

      btn.addEventListener("click", async () => {
        selectedISO = iso;
        renderHeaderAndWeek();
        await renderSummary(selectedISO);
      });

      daysEl.appendChild(btn);
    }
  }

  /* -------------------------
     Summary: DOT + “dalle… alle…”
  ------------------------- */
  async function renderSummary(iso){
    const mount = getMount();
    if(!mount) return;

    const dateEl = mount.querySelector("#cvSummaryDate");
    const badgesEl = mount.querySelector("#cvBadges");
    const linesEl = mount.querySelector("#cvLines");
    const notesWrap = mount.querySelector("#cvNotesWrap");
    const notesText = mount.querySelector("#cvNotesText");

    if(dateEl) dateEl.textContent = formatLongDate(iso);

    const day = loadDaySavedOnly(iso);

    // badges (in alto)
    if(badgesEl){
      badgesEl.innerHTML = "";
      const list = [];
      if(day.badges.holiday) list.push("Festività");
      if(day.badges.sunday) list.push("Domenicale");
      if(day.badges.overtime) list.push("Straordinari");
      if(day.badges.advanced) list.push(String(day.badges.advanced));

      list.forEach(t => {
        const b = document.createElement("div");
        b.className = "cviewBadge";
        b.textContent = t;
        badgesEl.appendChild(b);
      });
    }

    // righe turni ordinate
    const shifts = Array.isArray(day.shifts) ? day.shifts.slice() : [];
    shifts.sort((a,b) => timeToMin(a.start) - timeToMin(b.start));

    if(linesEl){
      linesEl.innerHTML = "";

      if(!shifts.length){
        const empty = document.createElement("div");
        empty.className = "cviewEmpty";
        empty.textContent = "Nessun turno salvato per questo giorno.";
        linesEl.appendChild(empty);
      }else{
        shifts.forEach(s => {
          const row = document.createElement("div");
          row.className = "cviewLine";

          const dot = document.createElement("div");
          dot.className = "cviewDot";
          if(s.dotKind === "over") dot.classList.add("isOver");
          if(s.dotKind === "holiday") dot.classList.add("isHoliday");
          if(s.dotKind === "sunday") dot.classList.add("isSunday");

          const txt = document.createElement("div");
          txt.className = "cviewLineText";

          const main = document.createElement("div");
          main.className = "cviewLineMain";
          main.textContent = `dalle ${s.start || "—"} alle ${s.end || "—"}`;

          txt.appendChild(main);

          if(s.sub && String(s.sub).trim()){
            const sub = document.createElement("div");
            sub.className = "cviewLineSub";
            sub.textContent = String(s.sub).trim();
            txt.appendChild(sub);
          }

          row.appendChild(dot);
          row.appendChild(txt);
          linesEl.appendChild(row);
        });
      }
    }

    // note giorno (se un domani le aggiungi)
    const notes = (day.notes || "").trim();
    if(notesWrap && notesText){
      if(notes){
        notesWrap.hidden = false;
        notesText.textContent = notes;
      }else{
        notesWrap.hidden = true;
        notesText.textContent = "";
      }
    }
  }

  /* -------------------------
     Open / Close hooks
  ------------------------- */
  function open(){
    mountIfNeeded();

    const t = todayISO();
    pageStartISO = startOfWeekISO(t);
    selectedISO = t;

    renderHeaderAndWeek();
    renderSummary(selectedISO);
  }

  document.addEventListener("nettotrack:calendarViewOpened", open);

  document.addEventListener("nettotrack:closeCalendarView", () => {
    mounted = false;
    pageStartISO = null;
    selectedISO = null;
  });
})();