/* =========================
   calendar-insert.js - NettoTrack
   Month grid + month/year picker
   ========================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const MONTHS_IT_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
  const MONTHS_IT_FULL  = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WEEK_IT = ["L","M","M","G","V","S","D"];

  const STORAGE_KEY = "nettotrack_days_v1";

  function pad2(n){ return String(n).padStart(2,"0"); }
  function dateKeyFromYMD(y,m,d){ return `${pad2(d)}/${pad2(m+1)}/${y}`; }

  function loadDB(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }

  function hasBaseExtraForDate(db, dateKey){
    const entry = db?.[dateKey];
    if (!entry) return { base:false, extra:false };

    let base = false, extra = false;

    if (Array.isArray(entry.shifts)){
      for (const s of entry.shifts){
        if (s?.isExtra || s?.type === "extra" || s?.extra === true) extra = true;
        if (s?.isBase  || s?.type === "base"  || s?.base  === true) base  = true;

        if (s?.straordinario === true) extra = true;
        if (s?.mattino || s?.pomeriggio || s?.notte) base = true;
      }
    }

    if (typeof entry.baseHours === "number" && entry.baseHours > 0) base = true;
    if (typeof entry.extraHours === "number" && entry.extraHours > 0) extra = true;

    if (entry.flags){
      if (entry.flags.base === true) base = true;
      if (entry.flags.extra === true) extra = true;
    }

    return { base, extra };
  }

  function buildTemplate(){
    return `
      <div class="cinsRoot" id="cinsRoot">
        <div class="cinsHeader">
          <!-- ✅ < > vicine a sinistra -->
          <div class="cinsNavLeft" aria-label="Navigazione mese">
            <button class="cinsIconBtn" id="cinsPrev" type="button" aria-label="Mese precedente">‹</button>
            <button class="cinsIconBtn" id="cinsNext" type="button" aria-label="Mese successivo">›</button>
          </div>

          <button class="cinsTitleBtn" id="cinsTitle" type="button" aria-label="Seleziona mese e anno">
            <span class="cinsMonth" id="cinsMonthLabel">Febbraio</span>
            <span class="cinsYear" id="cinsYearLabel">2026</span>
          </button>

          <button class="cinsCloseBtn" id="cinsCloseCard" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="cinsHint">
          Seleziona un giorno per inserire i dati (gestione dopo).
        </div>

        <div class="cinsWeekdays" id="cinsWeekdays"></div>

        <div class="cinsGrid" id="cinsGrid" aria-label="Calendario mese"></div>

        <!-- Picker layer -->
        <div class="cinsPickerLayer" id="cinsPickerLayer" aria-hidden="true">
          <div class="cinsPickerCard" id="cinsPickerCard" role="dialog" aria-label="Seleziona mese e anno">
            <div class="cinsPickerTop">
              <div class="cinsPickerTitle">Seleziona mese e anno</div>
              <button class="cinsCloseBtn" id="cinsPickerClose" type="button" aria-label="Chiudi selezione">×</button>
            </div>

            <div class="cinsPickerYearRow">
              <button class="cinsIconBtn" id="cinsYearPrev" type="button" aria-label="Anno precedente">‹</button>
              <div class="cinsPickerYear" id="cinsPickerYear">2026</div>
              <button class="cinsIconBtn" id="cinsYearNext" type="button" aria-label="Anno successivo">›</button>
            </div>

            <div class="cinsMonthGrid" id="cinsMonthGrid" aria-label="Seleziona mese"></div>

            <div class="cinsPickerFooter">Swipe down per chiudere</div>
          </div>
        </div>
      </div>
    `;
  }

  function mountCalendarInsert(mountEl){
    if (!mountEl) return;
    mountEl.innerHTML = buildTemplate();

    const root        = $("#cinsRoot", mountEl);
    const titleBtn    = $("#cinsTitle", mountEl);
    const monthLabel  = $("#cinsMonthLabel", mountEl);
    const yearLabel   = $("#cinsYearLabel", mountEl);
    const prevBtn     = $("#cinsPrev", mountEl);
    const nextBtn     = $("#cinsNext", mountEl);
    const closeBtn    = $("#cinsCloseCard", mountEl);
    const weekdaysEl  = $("#cinsWeekdays", mountEl);
    const gridEl      = $("#cinsGrid", mountEl);

    const pickerLayer = $("#cinsPickerLayer", mountEl);
    const pickerCard  = $("#cinsPickerCard", mountEl);
    const pickerClose = $("#cinsPickerClose", mountEl);
    const yearPrev    = $("#cinsYearPrev", mountEl);
    const yearNext    = $("#cinsYearNext", mountEl);
    const pickerYear  = $("#cinsPickerYear", mountEl);
    const monthGrid   = $("#cinsMonthGrid", mountEl);

    weekdaysEl.innerHTML = WEEK_IT.map(d => `<div class="cinsW">${d}</div>`).join("");

    let view = new Date();
    view.setDate(1);

    let selectedKey = null;

    const now = new Date();
    const todayKey = dateKeyFromYMD(now.getFullYear(), now.getMonth(), now.getDate());

    function setHeader(){
      monthLabel.textContent = MONTHS_IT_FULL[view.getMonth()] || "";
      yearLabel.textContent  = String(view.getFullYear());
    }

    function openPicker(){
      root.classList.add("isPickerOn");
      pickerLayer.setAttribute("aria-hidden", "false");
      pickerYear.textContent = String(view.getFullYear());
    }

    function closePicker(){
      root.classList.remove("isPickerOn");
      pickerLayer.setAttribute("aria-hidden", "true");
    }

    function renderMonthButtons(){
      monthGrid.innerHTML = "";
      MONTHS_IT_SHORT.forEach((mName, idx) => {
        const b = document.createElement("button");
        b.className = "cinsMonthBtn";
        b.type = "button";
        b.textContent = mName;

        b.addEventListener("click", () => {
          view.setMonth(idx);
          closePicker();
          render();
        });

        monthGrid.appendChild(b);
      });
    }

    function render(){
      setHeader();
      const db = loadDB();

      const y = view.getFullYear();
      const m = view.getMonth();

      const first = new Date(y, m, 1);

      let startDay = first.getDay();       // 0..6
      startDay = (startDay + 6) % 7;       // Mon=0..Sun=6

      const daysInMonth = new Date(y, m + 1, 0).getDate();

      const total = 42;
      gridEl.innerHTML = "";

      for (let i = 0; i < total; i++){
        const dayNum = i - startDay + 1;

        const cell = document.createElement("div");
        cell.className = "cinsCell";

        const btn = document.createElement("button");
        btn.className = "cinsDay";
        btn.type = "button";

        if (dayNum < 1 || dayNum > daysInMonth){
          btn.classList.add("isEmpty");
          btn.setAttribute("disabled", "disabled");
          btn.textContent = "";
          cell.appendChild(btn);
          gridEl.appendChild(cell);
          continue;
        }

        btn.textContent = String(dayNum);
        const key = dateKeyFromYMD(y, m, dayNum);

        if (key === todayKey) btn.classList.add("isToday");
        if (selectedKey && key === selectedKey) btn.classList.add("isSelected");

        const { base, extra } = hasBaseExtraForDate(db, key);
        if (base){
          const d = document.createElement("span");
          d.className = "cinsDot base";
          btn.appendChild(d);
        }
        if (extra){
          const d = document.createElement("span");
          d.className = "cinsDot extra";
          btn.appendChild(d);
        }

        btn.addEventListener("click", () => {
          selectedKey = key;
          try{
            document.dispatchEvent(new CustomEvent("nettotrack:openDayEditor", {
              detail: { dateKey: key }
            }));
          }catch{}
          render();
        });

        cell.appendChild(btn);
        gridEl.appendChild(cell);
      }
    }

    prevBtn.addEventListener("click", () => { view.setMonth(view.getMonth() - 1); render(); });
    nextBtn.addEventListener("click", () => { view.setMonth(view.getMonth() + 1); render(); });

    closeBtn.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));
    });

    titleBtn.addEventListener("click", openPicker);

    pickerClose.addEventListener("click", closePicker);

    yearPrev.addEventListener("click", () => {
      view.setFullYear(view.getFullYear() - 1);
      pickerYear.textContent = String(view.getFullYear());
    });

    yearNext.addEventListener("click", () => {
      view.setFullYear(view.getFullYear() + 1);
      pickerYear.textContent = String(view.getFullYear());
    });

    pickerLayer.addEventListener("click", (e) => {
      if (e.target === pickerLayer) closePicker();
    });

    let tStartY = 0;
    let tStartX = 0;
    let isSwiping = false;

    pickerCard.addEventListener("touchstart", (e) => {
      if (!root.classList.contains("isPickerOn")) return;
      const t = e.touches[0];
      tStartY = t.clientY;
      tStartX = t.clientX;
      isSwiping = true;
    }, { passive: true });

    pickerCard.addEventListener("touchmove", (e) => {
      if (!isSwiping) return;
      const t = e.touches[0];
      const dy = t.clientY - tStartY;
      const dx = t.clientX - tStartX;

      if (Math.abs(dx) > 55) { isSwiping = false; return; }

      if (dy > 90 && Math.abs(dx) < 55){
        isSwiping = false;
        closePicker();
      }
    }, { passive: true });

    pickerCard.addEventListener("touchend", () => { isSwiping = false; }, { passive: true });

    renderMonthButtons();
    render();
  }

  function onOpen(){
    const mountEl = document.getElementById("calInsertMount");
    if (!mountEl) return;
    mountCalendarInsert(mountEl);
  }

  document.addEventListener("nettotrack:calendarInsertOpened", onOpen);

  window.NettoTrackCalendarInsert = { mount: mountCalendarInsert };
})();