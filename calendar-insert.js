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

  function renderMonth(){
    const mount = getMount();
    if(!mount) return;

    // title
    const t = mount.querySelector("#cinsTitle");
    if(t) t.textContent = `${MONTHS[m]} ${y}`;

    // grid
    const grid = mount.querySelector("#cinsGrid");
    if(!grid) return;
    grid.innerHTML = "";

    const first = new Date(y, m, 1);
    const firstDay = first.getDay(); // 0 dom
    const offset = (firstDay === 0 ? 6 : firstDay - 1); // lun=0
    const daysInMonth = new Date(y, m+1, 0).getDate();

    // range: 42 celle
    const total = 42;

    const today = todayParts();
    const todayKey = dateKey(today.y, today.m, today.d);

    for(let i=0;i<total;i++){
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cinsDay";

      const dayNum = (i - offset) + 1;
      const inMonth = dayNum >= 1 && dayNum <= daysInMonth;

      if(!inMonth){
        cell.classList.add("isOff");
        cell.disabled = true;
        grid.appendChild(cell);
        continue;
      }

      const dk = dateKey(y, m, dayNum);
      cell.dataset.key = dk;

      // label
      const n = document.createElement("div");
      n.className = "cinsNum";
      n.textContent = String(dayNum).padStart(2,"0");
      cell.appendChild(n);

      // dot check: saved OR draft?
      const saved = loadDay(dk);
      const draft = loadDraft?.(dk);

      const hasSaved = !!(saved && Array.isArray(saved.shifts) && saved.shifts.length);
      const hasDraft = !!(draft && Array.isArray(draft.shifts) && draft.shifts.length);

      if(hasSaved || hasDraft){
        const dot = document.createElement("div");
        dot.className = "cinsDot";
        cell.appendChild(dot);
      }

      // today
      if(dk === todayKey) cell.classList.add("isToday");

      // click -> open day editor
      cell.addEventListener("click", () => {
        const ev = new CustomEvent("nettotrack:openDayEditor", { detail: { key: dk }});
        document.dispatchEvent(ev);
      });

      grid.appendChild(cell);
    }
  }

  function open(){
    mountIfNeeded();
  }

  document.addEventListener("nettotrack:calendarInsertOpened", open);

  document.addEventListener("nettotrack:closeCalendarInsert", () => {
    mounted = false;
  });
})();