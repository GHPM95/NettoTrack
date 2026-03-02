/* =========================
   calendar-view.js (Agenda)
   - Monta in #calViewMount (no HTML separato)
   - ✅ SOLO NTCal.loadDay (salvati), ❌ MAI draft/autosave
   - Strip a carousel: prev | current | next (drag live + snap)
   - Cambio settimana mantiene lo stesso giorno della settimana
   - Titolo (mese/anno) segue live la settimana in preview durante il drag
   - Riepilogo con dot piccoli accanto alle ore
   ========================= */
(() => {
  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];
  const $ = (sel, root=document) => root.querySelector(sel);

  let mounted = false;

  // settimana corrente mostrata (lunedi)
  let pageStartISO = null;
  // giorno selezionato
  let selectedISO = null;

  // gesture / carousel
  let dragging = false;
  let dragStartX = 0;
  let dragDx = 0;
  let dragMoved = false;
  let lock = false;

  // misure track
  let wrapW = 0;
  let baseX = 0; // posizione centro = -wrapW

  // title preview
  let liveWeekPreview = 0;  // -1 prev, 0 current, +1 next
  let selectedOffset = 0;   // 0..6 offset del selected nella settimana corrente

  function getMount(){ return document.getElementById("calViewMount"); }
  function isActuallyMounted(mount){ return !!(mount && mount.querySelector("#cviewRoot")); }

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
    const day = d.getDay(); // 0 dom
    const diff = (day === 0 ? -6 : 1 - day);
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

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function dayDiffISO(aISO, bISO){
    const a = isoToDate(aISO); a.setHours(12,0,0,0);
    const b = isoToDate(bISO); b.setHours(12,0,0,0);
    return Math.round((a - b) / 86400000);
  }

  function updateSelectedOffset(){
    const rawOff = dayDiffISO(selectedISO, pageStartISO);
    selectedOffset = clamp(rawOff, 0, 6);
  }

  function setTitleForPreviewWeek(previewDir){
    const mount = getMount();
    if(!mount) return;
    const titleEl = $("#cvTitle", mount);
    if(!titleEl) return;

    const wkStart = addDaysISO(pageStartISO, previewDir * 7);
    const previewSelected = addDaysISO(wkStart, selectedOffset);
    titleEl.textContent = formatMonthYear(previewSelected);
  }

  /* =========================
     Data: SOLO saved (NO draft)
     ========================= */
  function loadDaySavedOnly(iso){
    const cal = window.NTCal;
    if(!cal || typeof cal.loadDay !== "function"){
      return { shifts: [], badges: {overtime:false, holiday:false, sunday:false, advanced:""}, notes:"" };
    }

    let model = null;
    try { model = cal.loadDay(iso); } catch(_) {}

    const shiftsRaw = Array.isArray(model?.shifts) ? model.shifts : [];

    const shifts = shiftsRaw.map((s) => {
      const from = typeof s?.from === "string" ? s.from : "";
      const to   = typeof s?.to   === "string" ? s.to   : "";

      const tags = s?.tags || {};
      const advA = typeof s?.advA === "string" ? s.advA : "-";
      const advB = typeof s?.advB === "string" ? s.advB : "-";

      const st = String(s?.shiftType || "none");
      const typeMap = { morning:"Mattino", afternoon:"Pomeriggio", night:"Notte", none:"" };

      const adv = (advA && advA !== "-") ? advA : ((advB && advB !== "-") ? advB : "");

      // Dot priority: overtime > holiday > sunday > base
      const dotKind =
        tags.overtime ? "over" :
        tags.holiday  ? "holiday" :
        tags.sunday   ? "sunday" :
        "base";

      const extras = [];
      if(tags.overtime) extras.push("Straordinario");
      if(tags.holiday)  extras.push("Festivo");
      if(tags.sunday)   extras.push("Domenicale");
      if(typeMap[st])   extras.push(`Fascia: ${typeMap[st]}`);
      if(adv)           extras.push(`Avanzate: ${adv}`);

      const note = typeof s?.note === "string" ? s.note : "";
      if(note.trim()) extras.push(`Nota: ${note.trim()}`);

      return { start: from, end: to, dotKind, sub: extras.join(" · ") };
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

  /* =========================
     Mount UI
     ========================= */
  function mountIfNeeded(){
    const mount = getMount();
    if(!mount) return;
    if(mounted && isActuallyMounted(mount)) return;

    mount.innerHTML = `
      <div class="cviewRoot" id="cviewRoot">
        <header class="cviewHeader">
          <div class="cviewHeaderSpacer" aria-hidden="true"></div>
          <div class="cviewTitle" id="cvTitle">—</div>
          <button class="cviewClose" id="cvClose" type="button" aria-label="Chiudi">×</button>
        </header>

        <section class="cviewWeekStrip" id="cvStrip" aria-label="Selettore giorni settimana">
          <button class="ntBtn" id="cvPrev" type="button" aria-label="Settimana precedente">‹</button>

          <div class="cviewDaysWrap" id="cvDaysWrap">
            <div class="cviewTrack" id="cvTrack">
              <div class="cviewPage"><div class="cviewDays" id="cvDaysPrev"></div></div>
              <div class="cviewPage"><div class="cviewDays" id="cvDaysCur"></div></div>
              <div class="cviewPage"><div class="cviewDays" id="cvDaysNext"></div></div>
            </div>
          </div>

          <button class="ntBtn" id="cvNext" type="button" aria-label="Settimana successiva">›</button>
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
      </div>
    `;

    $("#cvClose", mount)?.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarView"));
    });

    $("#cvPrev", mount)?.addEventListener("click", async () => {
      await animateAndCommit(-1);
    });

    $("#cvNext", mount)?.addEventListener("click", async () => {
      await animateAndCommit(+1);
    });

    attachCarouselHandlers(mount);

    measure(mount);
    window.addEventListener("resize", () => measure(mount), { passive:true });

    mounted = true;
  }

  function measure(mount){
    const wrap = $("#cvDaysWrap", mount);
    const track = $("#cvTrack", mount);
    if(!wrap || !track) return;

    wrapW = Math.max(1, Math.round(wrap.getBoundingClientRect().width));
    baseX = -wrapW;

    track.classList.remove("isSnap");
    track.style.transform = `translateX(${baseX}px)`;
  }

  /* =========================
     Render: title + 3 weeks
     ========================= */
  function renderHeaderAndWeeks(){
    const mount = getMount();
    if(!mount) return;

    const titleEl = $("#cvTitle", mount);
    if(titleEl) titleEl.textContent = formatMonthYear(selectedISO);

    renderWeekGrid($("#cvDaysPrev", mount), addDaysISO(pageStartISO, -7));
    renderWeekGrid($("#cvDaysCur", mount), pageStartISO);
    renderWeekGrid($("#cvDaysNext", mount), addDaysISO(pageStartISO, +7));

    const track = $("#cvTrack", mount);
    if(track){
      track.classList.remove("isSnap");
      track.style.transform = `translateX(${baseX}px)`;
    }
  }

  function renderWeekGrid(host, weekStartISO){
    if(!host) return;
    host.innerHTML = "";

    const today = todayISO();

    for(let i=0;i<7;i++){
      const iso = addDaysISO(weekStartISO, i);
      const d = isoToDate(iso);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cviewDayBtn";
      btn.dataset.iso = iso;

      const dow = document.createElement("div");
      dow.className = "cviewDow";
      dow.textContent = WDN[(d.getDay() + 6) % 7];

      const num = document.createElement("div");
      num.className = "cviewNum";
      num.textContent = String(d.getDate()).padStart(2,"0");

      btn.appendChild(dow);
      btn.appendChild(num);

      if(iso === today) btn.classList.add("isToday");
      if(iso === selectedISO) btn.classList.add("isSelected");

      btn.addEventListener("click", async () => {
        if(dragMoved) return;

        selectedISO = iso;
        pageStartISO = startOfWeekISO(selectedISO);

        updateSelectedOffset();
        liveWeekPreview = 0;
        setTitleForPreviewWeek(0);

        renderHeaderAndWeeks();
        await renderSummary(selectedISO);
      });

      host.appendChild(btn);
    }
  }

  /* =========================
     Summary (DOT + testo)
     ========================= */
  async function renderSummary(iso){
    const mount = getMount();
    if(!mount) return;

    const dateEl = $("#cvSummaryDate", mount);
    const badgesEl = $("#cvBadges", mount);
    const linesEl = $("#cvLines", mount);
    const notesWrap = $("#cvNotesWrap", mount);
    const notesText = $("#cvNotesText", mount);

    if(dateEl) dateEl.textContent = formatLongDate(iso);

    const day = loadDaySavedOnly(iso);

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

  /* =========================
     Carousel handlers
     ========================= */
  function attachCarouselHandlers(mount){
    const strip = $("#cvStrip", mount);
    const wrap = $("#cvDaysWrap", mount);
    const track = $("#cvTrack", mount);
    if(!strip || !wrap || !track) return;

    const down = (e) => {
      if(lock) return;

      const t = e.target;
      if(t && t.closest && t.closest("#cvPrev")) return;
      if(t && t.closest && t.closest("#cvNext")) return;

      dragging = true;
      dragMoved = false;
      dragDx = 0;
      liveWeekPreview = 0;

      dragStartX = (e.touches ? e.touches[0].clientX : e.clientX);

      track.classList.remove("isSnap");
      try { track.setPointerCapture?.(e.pointerId); } catch(_) {}
    };

    const move = (e) => {
      if(!dragging || lock) return;

      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      dragDx = x - dragStartX;

      if(Math.abs(dragDx) > 6) dragMoved = true;

      track.style.transform = `translateX(${baseX + dragDx}px)`;

      // preview titolo se ti avvicini alla pagina successiva/precedente
      if(wrapW > 0){
        const threshold = Math.max(42, wrapW * 0.18);
        let dirPreview = 0;

        if(dragDx <= -threshold) dirPreview = +1;
        else if(dragDx >= threshold) dirPreview = -1;

        if(dirPreview !== liveWeekPreview){
          liveWeekPreview = dirPreview;
          setTitleForPreviewWeek(liveWeekPreview);
        }
      }
    };

    const up = async () => {
      if(!dragging) return;
      dragging = false;

      const threshold = Math.max(42, wrapW * 0.18);

      if(dragMoved && Math.abs(dragDx) >= threshold){
        const dir = (dragDx < 0) ? +1 : -1;
        await animateAndCommit(dir);
      }else{
        track.classList.add("isSnap");
        track.style.transform = `translateX(${baseX}px)`;
        setTimeout(() => track.classList.remove("isSnap"), 260);

        liveWeekPreview = 0;
        setTitleForPreviewWeek(0);
      }

      dragDx = 0;
      dragMoved = false;
    };

    strip.addEventListener("pointerdown", down, { passive:true });
    window.addEventListener("pointermove", move, { passive:true });
    window.addEventListener("pointerup", up, { passive:true });
    window.addEventListener("pointercancel", up, { passive:true });

    strip.addEventListener("touchstart", down, { passive:true });
    strip.addEventListener("touchmove", move, { passive:true });
    strip.addEventListener("touchend", up, { passive:true });
    strip.addEventListener("touchcancel", up, { passive:true });
  }

  async function animateAndCommit(dir){
    const mount = getMount();
    if(!mount) return;
    const track = $("#cvTrack", mount);
    if(!track) return;
    if(lock) return;

    lock = true;

    const targetX = baseX + (dir * -wrapW);
    track.classList.add("isSnap");
    track.style.transform = `translateX(${targetX}px)`;

    await wait(230);

    // commit: cambia settimana mantenendo lo stesso giorno della settimana
    const oldStart = pageStartISO;
    const off = selectedOffset;

    pageStartISO = addDaysISO(oldStart, dir * 7);
    selectedISO = addDaysISO(pageStartISO, off);

    updateSelectedOffset();
    liveWeekPreview = 0;

    renderHeaderAndWeeks();
    setTitleForPreviewWeek(0);
    await renderSummary(selectedISO);

    track.classList.remove("isSnap");
    track.style.transform = `translateX(${baseX}px)`;

    lock = false;
  }

  function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

  /* =========================
     Open / Close
     ========================= */
  function open(){
    mountIfNeeded();

    const t = todayISO();
    pageStartISO = startOfWeekISO(t);
    selectedISO = t;

    updateSelectedOffset();
    liveWeekPreview = 0;

    const mount = getMount();
    if(mount) measure(mount);

    renderHeaderAndWeeks();
    setTitleForPreviewWeek(0);
    renderSummary(selectedISO);
  }

  document.addEventListener("nettotrack:calendarViewOpened", open);

  document.addEventListener("nettotrack:closeCalendarView", () => {
    mounted = false;
    pageStartISO = null;
    selectedISO = null;

    dragging = false;
    dragMoved = false;
    dragDx = 0;
    lock = false;

    wrapW = 0;
    baseX = 0;

    liveWeekPreview = 0;
    selectedOffset = 0;
  });
})();