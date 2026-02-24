/* =========================================================
   calendar-insert.js
   Card "Inserisci dati" / Calendario (selezione giorno)
   - Giorni quadrati (senza .cinsCircle = niente doppio contorno)
   - Puntini base/extra: restano gestiti con .cinsDots/.cinsDot
   - Picker mese/anno: mantiene logica esistente
   ========================================================= */

(() => {
  "use strict";

  // Evita doppie inizializzazioni (hot reload / script doppio)
  if (window.__NettoTrack_CalendarInsert_Init) return;
  window.__NettoTrack_CalendarInsert_Init = true;

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // --- Stato interno
  let rootEl = null;
  let store = null;

  // mese/anno correnti per render
  let viewYear = null;
  let viewMonth = null; // 0..11

  // selezione (giorno cliccato)
  let selectedY = null;
  let selectedM = null;
  let selectedD = null;

  // --------- Template UI (card interna)
  const TEMPLATE = `
  <div class="cinsRoot" id="cinsRoot">
    <div class="cinsHeader">
      <div class="cinsTitleWrap">
        <div class="cinsTitle">Inserisci dati</div>
        <div class="cinsSub">Seleziona un giorno per inserire i dati (gestione dopo).</div>
      </div>

      <button class="cinsClose" id="cinsClose" type="button" aria-label="Chiudi">×</button>
    </div>

    <div class="cinsBody" id="cinsBody">
      <div class="cinsTopRow">
        <button class="cinsNavBtn" id="cinsPrev" type="button" aria-label="Mese precedente">‹</button>

        <button class="cinsMonthBtn" id="cinsMonthBtn" type="button" aria-label="Cambia mese e anno">
          <span class="cinsMonthText" id="cinsMonthText">—</span>
        </button>

        <button class="cinsNavBtn" id="cinsNext" type="button" aria-label="Mese successivo">›</button>
      </div>

      <div class="cinsWeek" id="cinsWeek">
        <div>L</div><div>M</div><div>M</div><div>G</div><div>V</div><div>S</div><div>D</div>
      </div>

      <div class="cinsGrid" id="cinsGrid"></div>

      <div class="cinsHint" id="cinsHint">Seleziona un giorno per inserire i dati (gestione dopo).</div>
    </div>

    <!-- Picker Mese/Anno -->
    <div class="cinsPickerLayer" id="cinsPickerLayer" aria-hidden="true">
      <div class="cinsPickerCard" id="cinsPickerCard" role="dialog" aria-modal="true" aria-label="Seleziona mese e anno">
        <div class="cinsPickerHeader">
          <div class="cinsPickerTitle">Seleziona mese e anno</div>
          <button class="cinsPickerClose" id="cinsPickerClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="cinsPickerYearRow">
          <button class="cinsPickerNav" id="cinsYearPrev" type="button" aria-label="Anno precedente">‹</button>
          <div class="cinsPickerYear" id="cinsPickerYear">—</div>
          <button class="cinsPickerNav" id="cinsYearNext" type="button" aria-label="Anno successivo">›</button>
        </div>

        <div class="cinsMonthsGrid" id="cinsMonthsGrid"></div>

        <div class="cinsPickerHint">Swipe down per chiudere</div>
      </div>
    </div>
  </div>
  `;

  // --------- API pubblica
  // mountCalendarInsert(mountEl, options)
  // options.store -> CalendarCore.getStore()
  // options.onClose -> callback
  // options.openDateStr -> "YYYY-MM-DD"
  window.mountCalendarInsert = function mountCalendarInsert(mountEl, options = {}) {
    if (!mountEl) return;

    // Se già montata, smonta e rimonta pulito
    mountEl.innerHTML = "";

    mountEl.innerHTML = TEMPLATE;
    rootEl = $("#cinsRoot", mountEl);

    store = options.store || (window.CalendarCore ? window.CalendarCore.getStore?.() : null);

    // set data iniziale (oggi o openDateStr)
    const now = new Date();
    let startY = now.getFullYear();
    let startM = now.getMonth();

    if (options.openDateStr && window.CalendarCore?.parseYMD) {
      const parsed = window.CalendarCore.parseYMD(options.openDateStr);
      if (parsed) {
        startY = parsed.y;
        startM = parsed.m;
      }
    }

    viewYear = startY;
    viewMonth = startM;

    // bind eventi base
    bindBaseEvents(mountEl, options);

    // render iniziale
    renderMonth(mountEl);

    // chiudi menu (se esiste) quando apri card
    document.body.classList.remove("isMenuOpen");
  };

  // Smonta (opzionale)
  window.unmountCalendarInsert = function unmountCalendarInsert(mountEl) {
    if (!mountEl) return;
    mountEl.innerHTML = "";
  };

  // --------- Events
  function bindBaseEvents(mountEl, options) {
    const closeBtn = $("#cinsClose", mountEl);
    const prevBtn = $("#cinsPrev", mountEl);
    const nextBtn = $("#cinsNext", mountEl);
    const monthBtn = $("#cinsMonthBtn", mountEl);

    closeBtn?.addEventListener("click", () => {
      if (typeof options.onClose === "function") options.onClose();
    });

    prevBtn?.addEventListener("click", () => {
      moveMonth(-1);
      renderMonth(mountEl);
    });

    nextBtn?.addEventListener("click", () => {
      moveMonth(+1);
      renderMonth(mountEl);
    });

    monthBtn?.addEventListener("click", () => {
      openPicker(mountEl);
    });

    // Picker close
    const pickerLayer = $("#cinsPickerLayer", mountEl);
    const pickerClose = $("#cinsPickerClose", mountEl);

    pickerClose?.addEventListener("click", () => closePicker(mountEl));
    pickerLayer?.addEventListener("click", (e) => {
      if (e.target === pickerLayer) closePicker(mountEl);
    });

    // Swipe down per chiudere (pointer)
    enablePickerSwipeToClose(mountEl);
  }

  function moveMonth(delta) {
    let y = viewYear;
    let m = viewMonth + delta;
    while (m < 0) {
      y -= 1;
      m += 12;
    }
    while (m > 11) {
      y += 1;
      m -= 12;
    }
    viewYear = y;
    viewMonth = m;
  }

  // --------- Render
  function renderMonth(mountEl) {
    if (!window.CalendarCore) return;

    // Header (mese/anno)
    const monthText = $("#cinsMonthText", mountEl);
    if (monthText) {
      monthText.textContent = CalendarCore.monthLabel(viewMonth) + " " + viewYear;
    }

    const grid = $("#cinsGrid", mountEl);
    if (!grid) return;
    grid.innerHTML = "";

    const todayStr = CalendarCore.todayYMD();
    const ym = CalendarCore.monthMatrix(viewYear, viewMonth);

    // ym è una matrice 6x7 di oggetti: { y,m,d, inMonth, dateStr }
    ym.forEach((week) => {
      week.forEach((cell) => {
        const isValid = !!cell.inMonth;
        const dayNum = cell.d;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cinsDay" + (isValid ? "" : " isOff");

        if (!isValid) {
          btn.disabled = true;
          btn.setAttribute("aria-hidden", "true");
          grid.appendChild(btn);
          return;
        }

        // Numero direttamente nel bottone (giorni "quadrati")
        btn.textContent = String(dayNum);

        btn.dataset.date = cell.dateStr;
        btn.setAttribute("aria-label", `Giorno ${dayNum}`);

        // Stato (base/extra/draft) dal tuo store
        const entry = readDayEntry(cell.dateStr);
        const hasBase = !!entry?.baseHours && entry.baseHours > 0;
        const hasExtra = !!entry?.extraHours && entry.extraHours > 0;
        const hasDraft = !!entry?.draft;

        // Puntini ore base/extra (sempre presenti: vuoti se non servono,
        // così il layout resta stabile)
        const dots = document.createElement("div");
        dots.className = "cinsDots";
        if (hasBase) {
          const d = document.createElement("div");
          d.className = "cinsDot base" + (hasDraft ? " draft" : "");
          dots.appendChild(d);
        }
        if (hasExtra) {
          const d = document.createElement("div");
          d.className = "cinsDot extra" + (hasDraft ? " draft" : "");
          dots.appendChild(d);
        }
        btn.appendChild(dots);

        // Selezionato
        if (
          selectedY === cell.y &&
          selectedM === cell.m &&
          selectedD === cell.d
        ) {
          btn.classList.add("isSelected");
        }

        // Oggi (soft ma visibile)
        if (cell.dateStr === todayStr) {
          btn.classList.add("isToday");
        }

        // Click -> apri day editor (se esiste) e aggiorna hint
        btn.addEventListener("click", () => {
          selectedY = cell.y;
          selectedM = cell.m;
          selectedD = cell.d;

          const hint = $("#cinsHint", mountEl);
          if (hint) {
            const dd = String(cell.d).padStart(2, "0");
            const mm = String(cell.m + 1).padStart(2, "0");
            hint.textContent = `Selezionato: ${dd}/${mm}/${cell.y}`;
          }

          // Apri editor giorno se disponibile
          if (typeof window.mountDayEditor === "function") {
            window.mountDayEditor(cell.dateStr);
          }

          // Rerender per evidenziare selezione
          renderMonth(mountEl);
        });

        grid.appendChild(btn);
      });
    });
  }

  function readDayEntry(dateStr) {
    // Tenta lettura store in modo compatibile con versioni diverse
    try {
      if (store?.getDay) return store.getDay(dateStr);
      if (store?.days && store.days[dateStr]) return store.days[dateStr];
      if (window.CalendarCore?.getDay && typeof window.CalendarCore.getDay === "function") {
        return window.CalendarCore.getDay(dateStr);
      }
    } catch (e) {}
    return null;
  }

  // --------- Picker mese/anno
  const MONTHS_SHORT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  function openPicker(mountEl) {
    const layer = $("#cinsPickerLayer", mountEl);
    const card = $("#cinsPickerCard", mountEl);
    const yearLabel = $("#cinsPickerYear", mountEl);
    const monthsGrid = $("#cinsMonthsGrid", mountEl);

    if (!layer || !card || !yearLabel || !monthsGrid) return;

    rootEl?.classList.add("isPickerOn");
    layer.setAttribute("aria-hidden", "false");

    // Setup UI
    yearLabel.textContent = String(viewYear);

    // (Re)build months grid
    monthsGrid.innerHTML = "";
    MONTHS_SHORT.forEach((label, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cinsMonthPickBtn" + (idx === viewMonth ? " isActive" : "");
      b.textContent = label;

      b.addEventListener("click", () => {
        viewMonth = idx;
        closePicker(mountEl);
        renderMonth(mountEl);
      });

      monthsGrid.appendChild(b);
    });

    // Year controls
    const yPrev = $("#cinsYearPrev", mountEl);
    const yNext = $("#cinsYearNext", mountEl);
    if (yPrev) {
      yPrev.onclick = () => {
        viewYear = clamp(viewYear - 1, 1970, 2100);
        yearLabel.textContent = String(viewYear);
      };
    }
    if (yNext) {
      yNext.onclick = () => {
        viewYear = clamp(viewYear + 1, 1970, 2100);
        yearLabel.textContent = String(viewYear);
      };
    }
  }

  function closePicker(mountEl) {
    const layer = $("#cinsPickerLayer", mountEl);
    if (!layer) return;

    rootEl?.classList.remove("isPickerOn");
    layer.setAttribute("aria-hidden", "true");
  }

  function enablePickerSwipeToClose(mountEl) {
    const layer = $("#cinsPickerLayer", mountEl);
    const card = $("#cinsPickerCard", mountEl);
    if (!layer || !card) return;

    let startY = 0;
    let lastY = 0;
    let active = false;

    const onDown = (e) => {
      // solo se picker visibile
      if (layer.getAttribute("aria-hidden") === "true") return;
      active = true;
      startY = e.clientY;
      lastY = startY;
      card.style.transition = "none";
    };

    const onMove = (e) => {
      if (!active) return;
      lastY = e.clientY;
      const dy = Math.max(0, lastY - startY);

      // trascina solo verso il basso
      card.style.transform = `translateY(${dy}px)`;
      card.style.opacity = String(1 - dy / 260);
    };

    const onUp = () => {
      if (!active) return;
      active = false;

      const dy = Math.max(0, lastY - startY);

      // soglia chiusura
      if (dy > 90) {
        card.style.transition = "transform .22s ease, opacity .22s ease";
        card.style.transform = `translateY(${dy + 120}px)`;
        card.style.opacity = "0";
        setTimeout(() => {
          card.style.transition = "";
          card.style.transform = "";
          card.style.opacity = "";
          closePicker(mountEl);
        }, 220);
        return;
      }

      // ritorno
      card.style.transition = "transform .22s ease, opacity .22s ease";
      card.style.transform = "";
      card.style.opacity = "";
      setTimeout(() => {
        card.style.transition = "";
      }, 240);
    };

    // Pointer events (cross device)
    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);

    // anche sul layer (se tocchi fuori)
    layer.addEventListener("pointerdown", (e) => {
      if (e.target !== layer) return;
      // tap fuori = close, swipe fuori non serve
    });
  }

})();