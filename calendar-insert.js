/* =========================
   calendar-insert.js
   NettoTrack — Month grid + month/year picker
   (FIX: template coerente con calendar-insert.css + weekdays quadrati + dots wrapper + swipe down OK)
   ========================= */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const MONTHS_FULL = [
    "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
  ];
  const MONTHS_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
  const WEEK_IT = ["L","M","M","G","V","S","D"];

  const NT = window.NTCal; // calendar-core.js (YYYY-MM-DD + storage per dayKey)

  let mounted = false;

  function isActuallyMounted(mountEl) {
    return !!(mountEl && mountEl.querySelector(".cinsRoot"));
  }

  function buildTemplate() {
    // Struttura pensata per calendar-insert.css (classi/ID coerenti)
    return `
      <div class="cinsRoot" id="cinsRoot">
        <div class="cinsWrap">
          <div class="cinsHeader">
            <div class="cinsNavLeft">
              <button class="cinsIconBtn" id="cinsPrev" type="button" aria-label="Mese precedente">‹</button>
              <button class="cinsIconBtn" id="cinsNext" type="button" aria-label="Mese successivo">›</button>
            </div>

            <button class="cinsTitleBtn" id="cinsTitle" type="button" aria-label="Seleziona mese e anno">
              <span class="cinsMonth" id="cinsMonthLabel">—</span>
              <span class="cinsYear" id="cinsYearLabel">—</span>
            </button>

            <button class="cinsCloseBtn" id="cinsCloseCard" type="button" aria-label="Chiudi">×</button>
          </div>

          <div class="cinsWeekdays" id="cinsWeekdays"></div>

          <div class="cinsGrid" id="cinsGrid" aria-label="Calendario mese"></div>

          <div class="cinsHint" id="cinsHint"></div>
        </div>

        <!-- Picker overlay (1 solo layer) -->
        <div class="cinsPickerOverlay" id="cinsPickerLayer" aria-hidden="true">
          <div class="cinsPickerShade" aria-hidden="true"></div>

          <div class="cinsPickerCard" id="cinsPickerCard" role="dialog" aria-label="Seleziona mese e anno">
            <div class="cinsPickerTop">
              <div></div>
              <div class="cinsPickerTitle">Seleziona mese e anno</div>
              <button class="cinsCloseBtn" id="cinsPickerClose" type="button" aria-label="Chiudi selezione">×</button>
            </div>

            <div class="cinsPickerYearRow">
              <button class="cinsPBtn" id="cinsYearPrev" type="button" aria-label="Anno precedente">‹</button>
              <div class="cinsPickerYear" id="cinsPickerYear">—</div>
              <button class="cinsPBtn" id="cinsYearNext" type="button" aria-label="Anno successivo">›</button>
            </div>

            <div class="cinsMonths" id="cinsMonthGrid"></div>

            <div class="cinsSwipeHint">Swipe down per chiudere</div>
          </div>
        </div>
      </div>
    `;
  }

  function mountIfNeeded() {
    const mountEl = document.getElementById("calInsertMount");
    if (!mountEl) return;

    // ✅ se la slide è stata chiusa e riaperta, il mount nuovo è vuoto → rimonta
    if (mounted && isActuallyMounted(mountEl)) return;

    mountEl.innerHTML = buildTemplate();

    const weekdaysEl = $("#cinsWeekdays", mountEl);
    weekdaysEl.innerHTML = WEEK_IT.map(d => `<div class="cinsW">${d}</div>`).join("");

    // mesi picker
    const monthGrid = $("#cinsMonthGrid", mountEl);
    monthGrid.innerHTML = MONTHS_SHORT.map((m, idx) =>
      `<button class="cinsMBtn" type="button" data-m="${idx}">${m}</button>`
    ).join("");

    mounted = true;
  }

  // --- state mese corrente
  let view = new Date();
  view.setHours(0,0,0,0);
  view.setDate(1);

  function todayKey() {
    const t = NT.todayParts();
    return NT.dateKey(t.y, t.m, t.d); // YYYY-MM-DD
  }

  function setHeader(mountEl) {
    $("#cinsMonthLabel", mountEl).textContent = MONTHS_FULL[view.getMonth()];
    $("#cinsYearLabel", mountEl).textContent = String(view.getFullYear());
  }

  function openPicker(mountEl) {
    const root = $("#cinsRoot", mountEl);
    const layer = $("#cinsPickerLayer", mountEl);
    root.classList.add("isPickerOn");
    layer.setAttribute("aria-hidden", "false");
    $("#cinsPickerYear", mountEl).textContent = String(view.getFullYear());
  }

  function closePicker(mountEl) {
    const root = $("#cinsRoot", mountEl);
    const layer = $("#cinsPickerLayer", mountEl);
    root.classList.remove("isPickerOn");
    layer.setAttribute("aria-hidden", "true");
  }

  function computeBaseExtraFromDayObj(dayObj) {
    // dayObj: struttura salvata da day-editor.js (shifts + flags)
    let base = false, extra = false;
    const shifts = Array.isArray(dayObj?.shifts) ? dayObj.shifts : [];
    for (const s of shifts) {
      const isExtra = !!(s?.flags?.straordinario || s?.flags?.festivo || s?.flags?.domenicale);
      if (isExtra) extra = true;
      else base = true;
    }
    return { base, extra };
  }

  function render(mountEl) {
    if (!mountEl) return;

    setHeader(mountEl);

    const gridEl = $("#cinsGrid", mountEl);
    gridEl.innerHTML = "";

    const y = view.getFullYear();
    const m = view.getMonth();

    const first = new Date(y, m, 1);
    let start = first.getDay();          // 0..6 Sun..Sat
    start = (start + 6) % 7;             // Mon=0..Sun=6

    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const tKey = todayKey();

    for (let i = 0; i < 42; i++) {
      const dayNum = i - start + 1;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cinsDay";

      if (dayNum < 1 || dayNum > daysInMonth) {
        btn.classList.add("isEmpty");
        btn.disabled = true;
        btn.innerHTML = `<span class="cinsNum"></span>`;
        gridEl.appendChild(btn);
        continue;
      }

      const key = NT.dateKey(y, m, dayNum);

      // numero (in span per z-index corretto con ::after “oggi”)
      const num = document.createElement("span");
      num.className = "cinsNum";
      num.textContent = String(dayNum);
      btn.appendChild(num);

      if (key === tKey) btn.classList.add("isToday");

      // dots: saved ha priorità, altrimenti draft
      const saved = NT.loadDay(key);
      const draft = NT.loadDraft(key);
      const model = saved || draft;

      if (model) {
        const { base, extra } = computeBaseExtraFromDayObj(model);
        if (base || extra) {
          const dots = document.createElement("div");
          dots.className = "cinsDots";

          if (base) {
            const d = document.createElement("span");
            d.className = "cinsDot base";
            dots.appendChild(d);
          }
          if (extra) {
            const d = document.createElement("span");
            d.className = "cinsDot extra";
            dots.appendChild(d);
          }

          btn.appendChild(dots);
        }
      }

      btn.addEventListener("click", () => {
        // apri editor turni (usa l’API UI che dispatcha l’evento giusto)
        window.NettoTrackUI?.openDayEditor(key);
      });

      gridEl.appendChild(btn);
    }
  }

  function wireEvents() {
    const mountEl = document.getElementById("calInsertMount");
    if (!mountEl) return;

    // header
    $("#cinsPrev", mountEl).onclick = () => { view.setMonth(view.getMonth() - 1); render(mountEl); };
    $("#cinsNext", mountEl).onclick = () => { view.setMonth(view.getMonth() + 1); render(mountEl); };
    $("#cinsCloseCard", mountEl).onclick = () => document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));

    $("#cinsTitle", mountEl).onclick = () => openPicker(mountEl);

    // picker
    $("#cinsPickerClose", mountEl).onclick = () => closePicker(mountEl);
    $("#cinsYearPrev", mountEl).onclick = () => {
      view.setFullYear(view.getFullYear() - 1);
      $("#cinsPickerYear", mountEl).textContent = String(view.getFullYear());
    };
    $("#cinsYearNext", mountEl).onclick = () => {
      view.setFullYear(view.getFullYear() + 1);
      $("#cinsPickerYear", mountEl).textContent = String(view.getFullYear());
    };

    $("#cinsMonthGrid", mountEl).querySelectorAll("button[data-m]").forEach(b => {
      b.addEventListener("click", () => {
        const mm = Number(b.dataset.m);
        view.setMonth(mm);
        closePicker(mountEl);
        render(mountEl);
      });
    });

    // click sullo shade per chiudere
    const layer = $("#cinsPickerLayer", mountEl);
    layer.addEventListener("click", (e) => {
      if (e.target === layer || e.target.classList.contains("cinsPickerShade")) closePicker(mountEl);
    });

    // ✅ swipe down (touch + mouse) sulla pickerCard
    const card = $("#cinsPickerCard", mountEl);
    let pDown = false;
    let x0 = 0, y0 = 0;

    const onDown = (e) => {
      // solo se picker aperto
      const root = $("#cinsRoot", mountEl);
      if (!root.classList.contains("isPickerOn")) return;

      pDown = true;
      x0 = e.clientX;
      y0 = e.clientY;
      card.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e) => {
      if (!pDown) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;

      // evita “diagonali” grandi
      if (Math.abs(dx) > 70) { pDown = false; return; }

      if (dy > 90 && Math.abs(dx) < 55) {
        pDown = false;
        closePicker(mountEl);
      }
    };

    const onUp = () => { pDown = false; };

    card.addEventListener("pointerdown", onDown, { passive: true });
    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerup", onUp, { passive: true });
    card.addEventListener("pointercancel", onUp, { passive: true });
  }

  function onOpen() {
    mountIfNeeded();

    const mountEl = document.getElementById("calInsertMount");
    if (!mountEl) return;

    // reset su mese corrente
    const t = NT.todayParts();
    view = new Date(t.y, t.m, 1);
    view.setHours(0,0,0,0);

    wireEvents();
    render(mountEl);
  }

  // quando apri la card
  document.addEventListener("nettotrack:calendarInsertOpened", onOpen);

  // se cambiano i dati, aggiorna i dots
  document.addEventListener("nettotrack:dataChanged", () => {
    const mountEl = document.getElementById("calInsertMount");
    if (!mountEl || !isActuallyMounted(mountEl)) return;
    render(mountEl);
  });

  // export (debug)
  window.NettoTrackCalendarInsert = {
    remount() {
      mounted = false;
      onOpen();
    }
  };
})();