(() => {
  const { dateKey, todayParts, isSunday, loadDay, saveDay, removeDay, loadDraft, saveDraft, removeDraft, pad2 } = window.NTCal;

  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];

  let mounted = false;
  let y = todayParts().y;
  let m = todayParts().m;

  function getMount() {
    return document.getElementById("calInsertMount");
  }

  function isActuallyMounted(mount) {
    // ✅ se la card è stata chiusa (slide rimosso), il mount nuovo sarà vuoto
    return !!(mount && mount.querySelector("#cinsRoot"));
  }

  function mountIfNeeded() {
    const mount = getMount();
    if (!mount) return;

    // ✅ FIX: se mounted=true ma il DOM non c’è più, rimonta
    if (mounted && isActuallyMounted(mount)) return;

    mount.innerHTML = `
      <div class="cinsRoot" id="cinsRoot">
        <div class="cinsHeader">
          <div class="cinsLeft">
            <button class="ntBtn" id="cinsPrev" type="button" aria-label="Mese precedente">‹</button>
            <button class="ntBtn" id="cinsNext" type="button" aria-label="Mese successivo">›</button>
          </div>

          <button class="cinsTitleBtn" id="cinsTitle" type="button" aria-label="Scegli mese e anno"></button>

          <button class="ntBtn" id="cinsClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="cinsBody">
          <div class="cinsWeekdays" id="cinsWeekdays"></div>
          <div class="cinsGrid" id="cinsGrid"></div>
        </div>

        <div class="cinsPickerLayer" id="cinsPickerLayer" aria-hidden="true">
          <div class="cinsPickerCard" id="cinsPickerCard">
            <div class="cinsPickerTop">
              <div class="cinsPickerTitle">Seleziona mese e anno</div>
              <button class="ntBtn" id="cinsPickerClose" type="button" aria-label="Chiudi selezione">×</button>
            </div>

            <div class="cinsYearRow">
              <button class="ntBtn" id="cinsYearMinus" type="button" aria-label="Anno precedente">‹</button>
              <div class="cinsYearVal" id="cinsYearVal"></div>
              <button class="ntBtn" id="cinsYearPlus" type="button" aria-label="Anno successivo">›</button>
            </div>

            <div class="cinsMonthGrid" id="cinsMonthGrid"></div>

            <div class="cinsSwipeHint">Swipe down per chiudere</div>
          </div>
        </div>
      </div>
    `;

    // weekdays
    const wd = mount.querySelector("#cinsWeekdays");
    wd.innerHTML = WDN.map(x => `<div>${x}</div>`).join("");

    // events
    mount.querySelector("#cinsPrev").addEventListener("click", () => { stepMonth(-1); });
    mount.querySelector("#cinsNext").addEventListener("click", () => { stepMonth(+1); });
    mount.querySelector("#cinsClose").addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));
    });

    mount.querySelector("#cinsTitle").addEventListener("click", () => openPicker(true));
    mount.querySelector("#cinsPickerClose").addEventListener("click", () => openPicker(false));

    mount.querySelector("#cinsYearMinus").addEventListener("click", () => { y -= 1; renderPicker(); });
    mount.querySelector("#cinsYearPlus").addEventListener("click", () => { y += 1; renderPicker(); });

    // swipe down to close picker
    const layer = mount.querySelector("#cinsPickerLayer");
    let pDown = false;
    let pY0 = 0;
    layer.addEventListener("pointerdown", (e) => { pDown = true; pY0 = e.clientY; layer.setPointerCapture?.(e.pointerId); }, { passive:true });
    layer.addEventListener("pointermove", (e) => {
      if (!pDown) return;
      const dy = e.clientY - pY0;
      if (dy > 60) { pDown = false; openPicker(false); }
    }, { passive:true });
    layer.addEventListener("pointerup", () => { pDown = false; }, { passive:true });
    layer.addEventListener("pointercancel", () => { pDown = false; }, { passive:true });

    // month buttons in picker
    const monthGrid = mount.querySelector("#cinsMonthGrid");
    monthGrid.innerHTML = MONTHS.map((name, idx) => (
      `<button class="cinsPickBtn" data-m="${idx}" type="button">${name.slice(0,3)}</button>`
    )).join("");
    monthGrid.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        m = Number(b.dataset.m);
        openPicker(false);
        renderMonth();
      });
    });

    mounted = true;
    renderMonth();
  }

  function stepMonth(delta) {
    m += delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    renderMonth();
  }

  function openPicker(on) {
    const mount = getMount();
    if (!mount) return;
    const layer = mount.querySelector("#cinsPickerLayer");
    if (!layer) return;

    layer.classList.toggle("isOn", !!on);
    layer.setAttribute("aria-hidden", on ? "false" : "true");
    if (on) renderPicker();
  }

  function renderPicker() {
    const mount = getMount();
    if (!mount) return;
    const yv = mount.querySelector("#cinsYearVal");
    if (yv) yv.textContent = String(y);
  }

  function renderMonth() {
    const mount = getMount();
    if (!mount) return;

    const title = mount.querySelector("#cinsTitle");
    if (title) title.textContent = `${MONTHS[m]} ${y}`;

    const grid = mount.querySelector("#cinsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const first = new Date(y, m, 1);
    const firstDay = first.getDay();
    const offset = (firstDay === 0 ? 6 : firstDay - 1);

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const { y:ty, m:tm, d:td } = todayParts();

    for (let i = 0; i < 42; i++) {
      const dayNum = i - offset + 1;
      const isValid = dayNum >= 1 && dayNum <= daysInMonth;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cinsDay" + (isValid ? "" : " isOff");

      if (isValid) {
        const key = dateKey(y, m, dayNum);
        const saved = loadDay(key);
        const draft = loadDraft(key);

        const isToday = (y === ty && m === tm && dayNum === td);
        if (isToday) btn.classList.add("isToday");

        const circle = document.createElement("div");
        circle.className = "cinsCircle";
        circle.textContent = String(dayNum);
        btn.appendChild(circle);

        const hasSaved = !!saved;
        const hasDraft = !!draft && !hasSaved;

        let hasBase = false;
        let hasExtra = false;

        const src = (saved?.shifts?.length ? saved : (draft?.shifts?.length ? draft : null));
        if (src?.shifts?.length) {
          for (const s of src.shifts) {
            const isExtra = !!(s?.flags?.straordinario || s?.flags?.festivo || s?.flags?.domenicale);
            if (isExtra) hasExtra = true;
            else hasBase = true;
          }
        }

        if (hasBase || hasExtra) {
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
        }

        btn.addEventListener("click", () => {
          window.NettoTrackUI?.openDayEditor(key);
        });
      }

      grid.appendChild(btn);
    }
  }

  // ===== Day Editor: evento gestito dal file day-editor.js (separato) =====
  // Qui manteniamo solo la parte calendario mese.

  // --- events
  document.addEventListener("nettotrack:calendarInsertOpened", () => {
    // ✅ assicurati che rimonti anche dopo aver chiuso la tab con X
    mountIfNeeded();

    const t = todayParts();
    y = t.y; m = t.m;
    renderMonth();
  });

  document.addEventListener("nettotrack:dataChanged", () => {
    if (mounted) renderMonth();
  });
})();