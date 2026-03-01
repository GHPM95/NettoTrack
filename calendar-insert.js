(() => {
  const { dateKey, todayParts, loadDay, loadDraft } = window.NTCal;

  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];

  let mounted = false;
  let y = todayParts().y;
  let m = todayParts().m;

  function getMount(){
    return document.getElementById("calInsertMount");
  }

  function isActuallyMounted(mount){
    return !!(mount && mount.querySelector("#cinsRoot"));
  }

  function mountIfNeeded() {
    const mount = getMount();
    if (!mount) return;

    // se la slide è stata chiusa/riaperta, il mount torna vuoto: rimonta
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
          <div class="cinsWeekdays" id="cinsWeekdays" aria-hidden="true"></div>
          <div class="cinsGrid" id="cinsGrid"></div>
        </div>

        <div class="cinsPickerLayer" id="cinsPickerLayer" aria-hidden="true">
          <div class="cinsPickerCard" id="cinsPickerCard" role="dialog" aria-label="Seleziona mese e anno">
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

    // Weekdays = DIV statici
    const wd = mount.querySelector("#cinsWeekdays");
    wd.innerHTML = WDN.map(x => `<div class="cinsW">${x}</div>`).join("");

    // refs
    const rootEl = mount.querySelector("#cinsRoot");
    const layer  = mount.querySelector("#cinsPickerLayer");
    const card   = mount.querySelector("#cinsPickerCard");

    // -------------------------
    // Picker open/close (API)
    // -------------------------
    function openPicker(on){
      layer.classList.toggle("isOn", !!on);
      layer.setAttribute("aria-hidden", on ? "false" : "true");
      rootEl.classList.toggle("isPickerOn", !!on);

      // reset eventuali drag style
      card.style.transition = "";
      card.style.transform = "";
      card.style.opacity = "";

      if (on) renderPicker();
    }

    function closePicker(){
      openPicker(false);
    }

    // espongo per eventuali chiamate esterne
    window.closeCinsPicker = closePicker;

    // -------------------------
    // Header events
    // -------------------------
    mount.querySelector("#cinsPrev").addEventListener("click", () => stepMonth(-1));
    mount.querySelector("#cinsNext").addEventListener("click", () => stepMonth(+1));
    mount.querySelector("#cinsClose").addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));
    });

    // picker open/close
    mount.querySelector("#cinsTitle").addEventListener("click", () => openPicker(true));
    mount.querySelector("#cinsPickerClose").addEventListener("click", () => closePicker());

    // year step
    mount.querySelector("#cinsYearMinus").addEventListener("click", () => { y -= 1; renderPicker(); });
    mount.querySelector("#cinsYearPlus").addEventListener("click",  () => { y += 1; renderPicker(); });

    // click fuori card chiude
    layer.addEventListener("click", (e) => {
      if (e.target === layer) closePicker();
    });

    // -------------------------
    // Month buttons
    // -------------------------
    const monthGrid = mount.querySelector("#cinsMonthGrid");
    monthGrid.innerHTML = MONTHS.map((name, idx) => (
      `<button class="cinsPickBtn" data-m="${idx}" type="button">${name.slice(0,3)}</button>`
    )).join("");

    monthGrid.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        m = Number(b.dataset.m);
        closePicker();
        renderMonth();
      });
    });

    // -------------------------
    // Swipe down to close (solo 1 sistema, stabile)
    // -------------------------
    let dragging = false;
    let startY = 0;
    let lastY = 0;

    function isPickerOpen(){
      return layer.classList.contains("isOn") && rootEl.classList.contains("isPickerOn");
    }

    card.addEventListener("pointerdown", (e) => {
      if (!isPickerOpen()) return;
      dragging = true;
      startY = e.clientY;
      lastY = startY;
      card.style.transition = "none";
      card.setPointerCapture?.(e.pointerId);
    }, { passive:true });

    card.addEventListener("pointermove", (e) => {
      if (!dragging || !isPickerOpen()) return;
      lastY = e.clientY;

      const dy = Math.max(0, lastY - startY); // solo verso il basso
      card.style.transform = `translateY(${dy}px)`;

      const fade = Math.max(0.55, 1 - dy / 420);
      card.style.opacity = String(fade);
    }, { passive:true });

    function endSwipe(){
      if (!dragging) return;
      dragging = false;

      const dy = Math.max(0, lastY - startY);
      const shouldClose = dy > 80;

      card.style.transition = "transform .18s ease, opacity .18s ease";
      card.style.transform = "";
      card.style.opacity = "";

      if (shouldClose) closePicker();
    }

    card.addEventListener("pointerup", endSwipe, { passive:true });
    card.addEventListener("pointercancel", endSwipe, { passive:true });

    // -------------------------
    // Render first
    // -------------------------
    mounted = true;
    renderMonth();

    // =========================
    // helpers inside mount
    // =========================
    function renderPicker(){
      mount.querySelector("#cinsYearVal").textContent = String(y);
    }
  }

  function stepMonth(delta) {
    m += delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    renderMonth();
  }

  function hasMeaningfulDayData(model) {
    if (!model || !Array.isArray(model.shifts) || model.shifts.length === 0) return false;

    return model.shifts.some((s) => {
      const hasTimes = !!(s?.from || s?.to);
      const hasPause = Number(s?.pauseMin || 0) > 0 || !!s?.pausePaid;
      const hasFascia = !!(s?.shiftType && s.shiftType !== "none");
      const hasExtra = !!(s?.tags && (s.tags.overtime || s.tags.holiday || s.tags.sunday));
      const hasAdv = (s?.advA && s.advA !== "-") || (s?.advB && s?.advB !== "-");
      const hasNote = !!(s?.note && String(s.note).trim().length);
      return hasTimes || hasPause || hasFascia || hasExtra || hasAdv || hasNote;
    });
  }

  function renderMonth() {
    const mount = getMount();
    if (!mount) return;

    const titleBtn = mount.querySelector("#cinsTitle");
    if (titleBtn) titleBtn.textContent = `${MONTHS[m]} ${y}`;

    const grid = mount.querySelector("#cinsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const first = new Date(y, m, 1);
    const firstDay = first.getDay(); // 0 Sun..6 Sat
    const offset = (firstDay === 0 ? 6 : firstDay - 1); // Monday-based

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const t = todayParts();
    const ty = Number(t.y), tm = Number(t.m), td = Number(t.d);

    for (let i = 0; i < 42; i++) {
      const dayNum = i - offset + 1;
      const isValid = dayNum >= 1 && dayNum <= daysInMonth;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cinsDay" + (isValid ? "" : " isOff");

      if (isValid) {
        const key = dateKey(y, m, dayNum);

        if (y === ty && m === tm && dayNum === td) btn.classList.add("isToday");

        // numero
        const num = document.createElement("span");
        num.className = "cinsNum";
        num.textContent = String(dayNum);
        btn.appendChild(num);

        // dot premium: saved o draft
        const saved = loadDay(key);
        const draft = loadDraft(key);
        const model = saved || draft;

        if (hasMeaningfulDayData(model)) {
          const hasExtra = !!model?.shifts?.some((s) =>
            !!(s?.tags && (s.tags.overtime || s.tags.holiday || s.tags.sunday))
          );

          const hasNormal = !!model?.shifts?.some((s) => {
            const meaningful =
              !!(s?.from || s?.to) ||
              Number(s?.pauseMin || 0) > 0 ||
              !!s?.pausePaid ||
              !!(s?.shiftType && s.shiftType !== "none") ||
              ((s?.advA && s.advA !== "-") || (s?.advB && s?.advB !== "-")) ||
              !!(s?.note && String(s.note).trim().length);

            const extra = !!(s?.tags && (s.tags.overtime || s.tags.holiday || s.tags.sunday));
            return meaningful && !extra;
          });

          const dots = document.createElement("div");
          dots.className = "cinsDots";

          if (hasNormal) {
            const base = document.createElement("div");
            base.className = "cinsDot premium";
            dots.appendChild(base);
          }

          if (hasExtra) {
            const extra = document.createElement("div");
            extra.className = "cinsDot premiumExtra";
            dots.appendChild(extra);
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

  document.addEventListener("nettotrack:calendarInsertOpened", () => {
    mountIfNeeded();
    const t = todayParts();
    y = t.y; m = t.m;
    renderMonth();
  });

  document.addEventListener("nettotrack:dataChanged", () => {
    const mount = getMount();
    if (!mount || !mount.querySelector("#cinsRoot")) return;
    renderMonth();
  });
})();