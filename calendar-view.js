/* =========================
   calendar-view.js (Agenda)
   - ✅ SOLO NTCal.loadDay (salvati), ❌ MAI draft/autosave
   - Carousel settimane: prev | current | next (drag + snap)
   - ✅ Capsule: "09:00 - 10:00" + tags dx / dettagli / note
   ========================= */
(() => {
  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];
  const $ = (sel, root=document) => root.querySelector(sel);

  let mounted = false;

  let pageStartISO = null;
  let selectedISO = null;

  let dragging = false;
  let dragStartX = 0;
  let dragDx = 0;
  let dragMoved = false;
  let lock = false;

  let wrapW = 0;
  let baseX = 0;

  let liveWeekPreview = 0;
  let selectedOffset = 0;

  function getMount(){ return document.getElementById("calViewMount"); }
  function isActuallyMounted(mount){ return !!(mount && mount.querySelector("#cviewRoot")); }

  function todayISO(){
    try{
      if (window.NTCal && typeof window.NTCal.todayParts === "function"){
        const t = window.NTCal.todayParts();
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
    const day = d.getDay();
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

  function makeTag(label){
    const t = document.createElement("span");
    t.className = "cviewInlineTag";
    t.textContent = label;
    return t;
  }

  /* =========================
     Data: SOLO saved (NO draft)
     ========================= */
  function loadDaySavedOnly(iso){
    const cal = window.NTCal;
    if(!cal || typeof cal.loadDay !== "function"){
      return { shifts: [], notes:"" };
    }

    let model = null;
    try { model = cal.loadDay(iso); } catch(_) {}

    const shiftsRaw = Array.isArray(model?.shifts) ? model.shifts : [];

    const typeMap = { morning:"Mattino", afternoon:"Pomeriggio", night:"Notte", none:"" };

    const shifts = shiftsRaw.map((s) => {
      const from = typeof s?.from === "string" ? s.from : "";
      const to   = typeof s?.to   === "string" ? s.to   : "";

      const tags = s?.tags || {};
      const st = String(s?.shiftType || "none");

      const pauseMin = Number.isFinite(Number(s?.pauseMin)) ? Number(s.pauseMin) : 0;
      const pausePaid = !!s?.pausePaid;

      const advA = typeof s?.advA === "string" ? s.advA : "-";
      const advB = typeof s?.advB === "string" ? s.advB : "-";

      let advLabel = "";
      let advValue = "";
      if(advA && advA !== "-"){ advLabel = "Assenza"; advValue = advA; }
      else if(advB && advB !== "-"){ advLabel = "Congedo"; advValue = advB; }

      const dotKind =
        tags.overtime ? "over" :
        tags.holiday  ? "holiday" :
        tags.sunday   ? "sunday" :
        "base";

      const note = typeof s?.note === "string" ? s.note.trim() : "";

      return {
        start: from,
        end: to,
        dotKind,
        overtime: !!tags.overtime,
        holiday: !!tags.holiday,
        sunday: !!tags.sunday,
        shiftLabel: typeMap[st] || "",
        pauseMin,
        pausePaid,
        advLabel,
        advValue,
        note
      };
    });

    const notes = typeof model?.notes === "string" ? model.notes : "";
    return { shifts, notes };
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
          <button class="cviewNavBtn" id="cvPrev" type="button" aria-label="Settimana precedente">‹</button>

          <div class="cviewDaysWrap" id="cvDaysWrap">
            <div class="cviewTrack" id="cvTrack">
              <div class="cviewPage"><div class="cviewDays" id="cvDaysPrev"></div></div>
              <div class="cviewPage"><div class="cviewDays" id="cvDaysCur"></div></div>
              <div class="cviewPage"><div class="cviewDays" id="cvDaysNext"></div></div>
            </div>
          </div>

          <button class="cviewNavBtn" id="cvNext" type="button" aria-label="Settimana successiva">›</button>
        </section>

        <div class="cviewDivider" aria-hidden="true"></div>

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
    window.addEventListener("resize", () => {
      const m = getMount();
      if(!m) return;
      measure(m);
      renderHeaderAndWeeks();
      setTitleForPreviewWeek(0);
    }, { passive:true });

    mounted = true;
  }

  function measure(mount){
    const wrap  = $("#cvDaysWrap", mount);
    const track = $("#cvTrack", mount);
    if(!wrap || !track) return;

    const rect = wrap.getBoundingClientRect();
    wrapW = Math.max(1, Math.round(rect.width));
    baseX = -wrapW;

    track.style.width = `${wrapW * 3}px`;

    const pages = track.querySelectorAll(".cviewPage");
    pages.forEach(p => {
      p.style.width = `${wrapW}px`;
      p.style.flex = "0 0 auto";
    });

    track.classList.remove("isSnap");
    track.style.transform = `translate3d(${baseX}px, 0, 0)`;
  }

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
      track.style.transform = `translate3d(${baseX}px, 0, 0)`;
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

  function dotClass(kind){
    if(kind === "over") return "isOver";
    if(kind === "holiday") return "isHoliday";
    if(kind === "sunday") return "isSunday";
    return "";
  }

  async function renderSummary(iso){
    const mount = getMount();
    if(!mount) return;

    const dateEl = $("#cvSummaryDate", mount);
    const linesEl = $("#cvLines", mount);
    const summaryEl = linesEl ? linesEl.closest(".cviewSummary") : null; /* ✅ NEW */
    const notesWrap = $("#cvNotesWrap", mount);
    const notesText = $("#cvNotesText", mount);

    if(dateEl) dateEl.textContent = formatLongDate(iso);

    const day = loadDaySavedOnly(iso);

    const shifts = Array.isArray(day.shifts) ? day.shifts.slice() : [];
    shifts.sort((a,b) => timeToMin(a.start) - timeToMin(b.start));

    if(linesEl){
      linesEl.innerHTML = "";

      // ✅ FIX: gancio per il CSS di centratura verticale del vuoto
      const isEmpty = shifts.length === 0;
      linesEl.classList.toggle("isEmpty", isEmpty);
      if(summaryEl) summaryEl.classList.toggle("isEmpty", isEmpty); /* ✅ NEW */

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
          dot.className = `cviewDot ${dotClass(s.dotKind)}`.trim();

          const txt = document.createElement("div");
          txt.className = "cviewLineText";

          const header = document.createElement("div");
          header.className = "cviewLineHeader";

          const time = document.createElement("div");
          time.className = "cviewLineTime";
          time.textContent = `${s.start || "—"} - ${s.end || "—"}`;

          const tagsWrap = document.createElement("div");
          tagsWrap.className = "cviewLineTags";

          if(s.sunday) tagsWrap.appendChild(makeTag("Domenicale"));
          if(s.holiday) tagsWrap.appendChild(makeTag("Festivo"));
          if(s.overtime) tagsWrap.appendChild(makeTag("Straordinario"));

          header.appendChild(time);
          header.appendChild(tagsWrap);

          const details = [];
          if(s.pauseMin && s.pauseMin > 0){
            details.push(`Pausa: ${s.pauseMin} min${s.pausePaid ? " (pagata)" : ""}`);
          }
          if(s.shiftLabel){
            details.push(`Turno: ${s.shiftLabel}`);
          }
          if(s.advLabel && s.advValue){
            details.push(`${s.advLabel}: ${s.advValue}`);
          }

          txt.appendChild(header);

          if(details.length){
            const d = document.createElement("div");
            d.className = "cviewLineDetails";
            d.textContent = details.join(" · ");
            txt.appendChild(d);
          }

          if(s.note){
            const n = document.createElement("div");
            n.className = "cviewLineNote";
            n.textContent = `Nota: ${s.note}`;
            txt.appendChild(n);
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

  function attachCarouselHandlers(mount){
    const strip = $("#cvStrip", mount);
    const track = $("#cvTrack", mount);
    if(!strip || !track) return;

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

      track.style.transform = `translate3d(${baseX + dragDx}px, 0, 0)`;

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
        track.style.transform = `translate3d(${baseX}px, 0, 0)`;
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
    track.style.transform = `translate3d(${targetX}px, 0, 0)`;

    await new Promise(r => setTimeout(r, 230));

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
    track.style.transform = `translate3d(${baseX}px, 0, 0)`;

    lock = false;
  }

  function open(){
    mountIfNeeded();

    const t = todayISO();
    pageStartISO = startOfWeekISO(t);
    selectedISO = t;

    updateSelectedOffset();
    liveWeekPreview = 0;

    const mount = getMount();
    if(!mount) return;

    requestAnimationFrame(() => {
      measure(mount);
      renderHeaderAndWeeks();
      setTitleForPreviewWeek(0);
    });

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