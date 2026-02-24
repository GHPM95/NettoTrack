(() => {
  const { dateKey, todayParts, isSunday, loadDay, saveDay, removeDay, loadDraft, saveDraft, removeDraft, pad2 } = window.NTCal;

  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];

  let mounted = false;
  let y = todayParts().y;
  let m = todayParts().m;

  function mountIfNeeded() {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    // ✅ se la slide è stata chiusa e riaperta, il mount torna vuoto: rimonta
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
          <div class="cinsWeekdays" id="cinsWeekdays"></div>
          <div class="cinsGrid" id="cinsGrid"></div>
        </div>

        <!-- picker overlay -->
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

    // weekdays (✅ ogni cella ha classe cinsW -> CSS quadrati)
    const wd = mount.querySelector("#cinsWeekdays");
    wd.innerHTML = WDN.map(x => `<div class="cinsW">${x}</div>`).join("");

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

    // swipe down to close picker (✅ pointer, funziona anche su desktop)
    const layer = mount.querySelector("#cinsPickerLayer");
    const card = mount.querySelector("#cinsPickerCard");
    let pDown = false;
    let pY0 = 0;
    let pX0 = 0;

    // ascolta sul CARD (così lo swipe non “becca” il layer esterno)
    card.addEventListener("pointerdown", (e) => {
      pDown = true;
      pY0 = e.clientY;
      pX0 = e.clientX;
      card.setPointerCapture?.(e.pointerId);
    }, { passive:true });

    card.addEventListener("pointermove", (e) => {
      if (!pDown) return;
      const dy = e.clientY - pY0;
      const dx = e.clientX - pX0;
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
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;
    const layer = mount.querySelector("#cinsPickerLayer");
    layer.classList.toggle("isOn", !!on);
    layer.setAttribute("aria-hidden", on ? "false" : "true");

    // ✅ classe sul root per nascondere sotto (CSS)
    mount.querySelector("#cinsRoot")?.classList.toggle("isPickerOn", !!on);

    if (on) renderPicker();
  }

  function renderPicker() {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;
    mount.querySelector("#cinsYearVal").textContent = String(y);
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
        const saved = loadDay(key);
        const draft = loadDraft(key);

        const isToday = (y === ty && m === tm && dayNum === td);
        if (isToday) btn.classList.add("isToday");

        // ✅ NUMERO (niente cerchi)
        const num = document.createElement("span");
        num.className = "cinsNum";
        num.textContent = String(dayNum);
        btn.appendChild(num);

        // dots (base/extra)
        const model = saved || draft;
        let hasBase = false;
        let hasExtra = false;

        if (model?.shifts?.length) {
          for (const s of model.shifts) {
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
            d.className = "cinsDot base";
            dots.appendChild(d);
          }
          if (hasExtra) {
            const d = document.createElement("div");
            d.className = "cinsDot extra";
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

  // --- events
  document.addEventListener("nettotrack:calendarInsertOpened", () => {
    mountIfNeeded();
    const t = todayParts();
    y = t.y; m = t.m;
    renderMonth();
  });

  document.addEventListener("nettotrack:dataChanged", () => {
    if (mounted) renderMonth();
  });
})();