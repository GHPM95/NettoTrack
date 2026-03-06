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
    if (mounted && mount.querySelector("#cinsRoot")) return;

    mount.innerHTML = `
      <div class="cinsRoot" id="cinsRoot">
        <div class="cinsHeader">
          <div class="cinsLeft">
            <button class="ntBtn" id="cinsPrev" type="button" aria-label="Mese precedente">‹</button>
            <button class="ntBtn" id="cinsNext" type="button" aria-label="Mese successivo">›</button>
          </div>

          <button class="cinsTitleBtn" id="cinsTitle" type="button" aria-label="Seleziona mese e anno">—</button>

          <button class="ntBtn" id="cinsClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="cinsBody">
          <div class="cinsWeekdays" id="cinsWeekdays" aria-hidden="true"></div>
          <div class="cinsGrid" id="cinsGrid" aria-label="Giorni del mese"></div>
        </div>

        <div class="cinsPickerLayer" id="cinsPickerLayer" aria-hidden="true">
          <div class="cinsPickerCard" id="cinsPickerCard" role="dialog" aria-label="Seleziona mese e anno">
            <div class="cinsPickerTop">
              <div class="cinsPickerTitle">Seleziona mese e anno</div>
              <button class="ntBtn" id="cinsPickerClose" type="button" aria-label="Chiudi">×</button>
            </div>

            <div class="cinsYearRow">
              <button class="ntBtn" id="cinsYearMinus" type="button" aria-label="Anno precedente">‹</button>
              <div class="cinsYearVal" id="cinsYearVal">—</div>
              <button class="ntBtn" id="cinsYearPlus" type="button" aria-label="Anno successivo">›</button>
            </div>

            <div class="cinsMonthGrid" id="cinsMonthGrid"></div>

            <div class="cinsSwipeHint">Swipe down per chiudere</div>
          </div>
        </div>
      </div>
    `;

    const wd = mount.querySelector("#cinsWeekdays");
    wd.innerHTML = WDN.map(x => `<div class="cinsW">${x}</div>`).join("");

    mount.querySelector("#cinsPrev").addEventListener("click", () => stepMonth(-1));
    mount.querySelector("#cinsNext").addEventListener("click", () => stepMonth(+1));

    mount.querySelector("#cinsClose").addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));
    });

    mount.querySelector("#cinsTitle").addEventListener("click", () => openPicker(true));
    mount.querySelector("#cinsPickerClose").addEventListener("click", () => openPicker(false));

    mount.querySelector("#cinsYearMinus").addEventListener("click", () => {
      y -= 1;
      renderPicker();
    });

    mount.querySelector("#cinsYearPlus").addEventListener("click", () => {
      y += 1;
      renderPicker();
    });

    const layer = mount.querySelector("#cinsPickerLayer");
    layer.addEventListener("click", (e) => {
      if (e.target === layer) openPicker(false);
    });

    const monthGrid = mount.querySelector("#cinsMonthGrid");
    monthGrid.innerHTML = MONTHS.map((name, idx) => (
      `<button class="cinsPickBtn" type="button" data-m="${idx}" aria-label="${name}">${name.slice(0,3)}</button>`
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
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
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

        if (y === ty && m === tm && dayNum === td) {
          btn.classList.add("isToday");
        }

        const num = document.createElement("span");
        num.className = "cinsNum";
        num.textContent = String(dayNum);
        btn.appendChild(num);

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
    y = t.y;
    m = t.m;
    renderMonth();
  });

  document.addEventListener("nettotrack:dataChanged", () => {
    const mount = document.getElementById("calInsertMount");
    if (!mount || !mount.querySelector("#cinsRoot")) return;
    renderMonth();
  });
})();