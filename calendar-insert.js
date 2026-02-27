(() => {
  const { dateKey, todayParts, loadDay, loadDraft } = window.NTCal;

  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];

  let mounted = false;
  let y = todayParts().y;
  let m = todayParts().m;

  function mountIfNeeded() {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    // se la slide è stata chiusa/riaperta, il mount torna vuoto: rimonta
    if (mounted && mount.querySelector("#cinsRoot")) return;

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
          <!-- ✅ NON BUTTON: solo div -->
          <div class="cinsWeekdays" id="cinsWeekdays" aria-hidden="true"></div>

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

    // ✅ Weekdays = DIV statici (nessun button)
    const wd = mount.querySelector("#cinsWeekdays");
    wd.innerHTML = WDN.map(x => `<div class="cinsW">${x}</div>`).join("");

    // events header
    mount.querySelector("#cinsPrev").addEventListener("click", () => { stepMonth(-1); });
    mount.querySelector("#cinsNext").addEventListener("click", () => { stepMonth(+1); });
    mount.querySelector("#cinsClose").addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));
    });

    // picker open/close
    mount.querySelector("#cinsTitle").addEventListener("click", () => openPicker(true));
    mount.querySelector("#cinsPickerClose").addEventListener("click", () => openPicker(false));

    mount.querySelector("#cinsYearMinus").addEventListener("click", () => { y -= 1; renderPicker(); });
    mount.querySelector("#cinsYearPlus").addEventListener("click", () => { y += 1; renderPicker(); });
// =========================
// Swipe down per chiudere picker
// =========================
(function enablePickerSwipeDown(){
  const rootEl = document.querySelector('.cinsRoot');
  if (!rootEl) return;

  const pickerLayer = rootEl.querySelector('.cinsPickerLayer');
  const pickerCard  = rootEl.querySelector('.cinsPickerCard');
  if (!pickerLayer || !pickerCard) return;

  let startY = 0;
  let lastY = 0;
  let dragging = false;

  function isPickerOpen(){
    return pickerLayer.classList.contains('isOn') && rootEl.classList.contains('isPickerOn');
  }

  // 🔧 Devi avere già una funzione "closePicker()" nel tuo file.
  // Se si chiama diversamente, rinominala qui.
  function closePickerSafe(){
    if (typeof window.closeCinsPicker === 'function') {
      window.closeCinsPicker();
      return;
    }
    // fallback: chiude via classi (non rompe nulla)
    pickerLayer.classList.remove('isOn');
    rootEl.classList.remove('isPickerOn');
  }

  pickerCard.addEventListener('touchstart', (e) => {
    if (!isPickerOpen()) return;
    if (!e.touches || !e.touches.length) return;
    dragging = true;
    startY = e.touches[0].clientY;
    lastY = startY;
    pickerCard.style.transition = 'none';
  }, { passive: true });

  pickerCard.addEventListener('touchmove', (e) => {
    if (!dragging || !isPickerOpen()) return;
    if (!e.touches || !e.touches.length) return;

    lastY = e.touches[0].clientY;
    const dy = Math.max(0, lastY - startY); // solo verso il basso

    // piccola traslazione + fade leggero
    pickerCard.style.transform = `translateY(${dy}px)`;
    const fade = Math.max(0.55, 1 - dy / 420);
    pickerCard.style.opacity = String(fade);
  }, { passive: true });

  pickerCard.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;

    const dy = Math.max(0, lastY - startY);
    const shouldClose = dy > 80; // soglia

    pickerCard.style.transition = 'transform .18s ease, opacity .18s ease';

    if (shouldClose) {
      // reset stile e chiudi
      pickerCard.style.transform = '';
      pickerCard.style.opacity = '';
      closePickerSafe();
      return;
    }

    // torna su
    pickerCard.style.transform = '';
    pickerCard.style.opacity = '';
  }, { passive: true });

  // anche clic sul velo scuro chiude (se vuoi tenerlo)
  pickerLayer.addEventListener('click', (e) => {
    if (e.target === pickerLayer) closePickerSafe();
  });
})();
    // swipe down (pointer) sul pickerCard
    const layer = mount.querySelector("#cinsPickerLayer");
    const card = mount.querySelector("#cinsPickerCard");

    let pDown = false;
    let x0 = 0, y0 = 0;

    card.addEventListener("pointerdown", (e) => {
      pDown = true;
      x0 = e.clientX;
      y0 = e.clientY;
      card.setPointerCapture?.(e.pointerId);
    }, { passive:true });

    card.addEventListener("pointermove", (e) => {
      if (!pDown) return;
      const dy = e.clientY - y0;
      const dx = e.clientX - x0;
      if (dy > 80 && Math.abs(dx) < 60) {
        pDown = false;
        openPicker(false);
      }
    }, { passive:true });

    card.addEventListener("pointerup", () => { pDown = false; }, { passive:true });
    card.addEventListener("pointercancel", () => { pDown = false; }, { passive:true });

    // click fuori card chiude
    layer.addEventListener("click", (e) => {
      if (e.target === layer) openPicker(false);
    });

    // month buttons
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
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;
    const layer = mount.querySelector("#cinsPickerLayer");
    layer.classList.toggle("isOn", !!on);
    layer.setAttribute("aria-hidden", on ? "false" : "true");
    mount.querySelector("#cinsRoot")?.classList.toggle("isPickerOn", !!on);
    if (on) renderPicker();
  }

  function renderPicker() {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;
    mount.querySelector("#cinsYearVal").textContent = String(y);
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
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    mount.querySelector("#cinsTitle").textContent = `${MONTHS[m]} ${y}`;

    const grid = mount.querySelector("#cinsGrid");
    grid.innerHTML = "";

    const first = new Date(y, m, 1);
    const firstDay = first.getDay(); // 0 Sun..6 Sat
    const offset = (firstDay === 0 ? 6 : firstDay - 1); // Monday-based

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
  const dots = document.createElement("div");
  dots.className = "cinsDots";

  // dot blu (sempre, se il giorno è "compilato")
  const base = document.createElement("div");
  base.className = "cinsDot premium";
  dots.appendChild(base);

  // extra: straordinario / festivo / domenicale
  const hasExtra =
    !!model?.shifts?.some((s) => !!(s?.tags && (s.tags.overtime || s.tags.holiday || s.tags.sunday)));

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
    const mount = document.getElementById("calInsertMount");
    if (!mount || !mount.querySelector("#cinsRoot")) return;
    renderMonth();
  });
})();