/* =========================
   calendar-insert.js (Month Grid)
   - FIX: non crasha se NTCal non è pronto (card non più vuota)
   - Month/Year picker
   - Dots: saved + draft (come prima)
   - NO "swipe down per chiudere" (rimosso)
   ========================= */
(() => {
  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];
  const $ = (sel, root=document) => root.querySelector(sel);

  let mounted = false;
  let y = null;
  let m = null;

  function getMount(){ return document.getElementById("calInsertMount"); }
  function isActuallyMounted(mount){ return !!(mount && mount.querySelector("#cinsRoot")); }

  function getCal(){
    return (window.NTCal && typeof window.NTCal.todayParts === "function") ? window.NTCal : null;
  }

  function safeTodayParts(){
    const cal = getCal();
    if (cal) return cal.todayParts();
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
  }

  function dateKeySafe(yy, mm, dd){
    const cal = getCal();
    if (cal && typeof cal.dateKey === "function") return cal.dateKey(yy, mm, dd);
    // fallback ISO
    return `${yy}-${String(mm+1).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
  }

  function loadDaySafe(key){
    const cal = getCal();
    if (cal && typeof cal.loadDay === "function") {
      try { return cal.loadDay(key); } catch(_) {}
    }
    return null;
  }

  function loadDraftSafe(key){
    const cal = getCal();
    if (cal && typeof cal.loadDraft === "function") {
      try { return cal.loadDraft(key); } catch(_) {}
    }
    return null;
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

  function ensureInitYM(){
    const t = safeTodayParts();
    if (typeof y !== "number") y = Number(t.y);
    if (typeof m !== "number") m = Number(t.m);
  }

  function mountIfNeeded() {
    const mount = getMount();
    if (!mount) return;
    if (mounted && isActuallyMounted(mount)) return;

    mount.innerHTML = `
      <div class="cinsRoot" id="cinsRoot">
        <div class="cinsHeader">
          <div class="cinsLeft">
            <button class="ntBtn" id="cinsPrev" type="button" aria-label="Mese precedente">‹</button>
            <button class="ntBtn" id="cinsNext" type="button" aria-label="Mese successivo">›</button>
          </div>

          <button class="cinsTitle" id="cinsTitle" type="button" aria-label="Seleziona mese e anno">—</button>

          <button class="ntBtn" id="cinsClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="cinsWeekdays" id="cinsWeekdays" aria-hidden="true"></div>

        <div class="cinsGrid" id="cinsGrid" aria-label="Giorni del mese"></div>

        <!-- Picker layer -->
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
          </div>
        </div>
      </div>
    `;

    // weekdays static
    const wd = $("#cinsWeekdays", mount);
    if (wd) wd.innerHTML = WDN.map(x => `<div class="cinsWD">${x}</div>`).join("");

    // picker month buttons
    const monthGrid = $("#cinsMonthGrid", mount);
    if (monthGrid){
      monthGrid.innerHTML = MONTHS.map((name, idx) =>
        `<button class="cinsMonthBtn" type="button" data-m="${idx}" aria-label="${name}">${name.slice(0,3)}</button>`
      ).join("");

      monthGrid.querySelectorAll("button").forEach(b => {
        b.addEventListener("click", () => {
          m = Number(b.dataset.m);
          closePicker();
          renderMonth();
        });
      });
    }

    // refs
    const layer = $("#cinsPickerLayer", mount);
    const rootEl = $("#cinsRoot", mount);

    function openPicker(on){
      if (!layer || !rootEl) return;
      layer.classList.toggle("isOn", !!on);
      layer.setAttribute("aria-hidden", on ? "false" : "true");
      rootEl.classList.toggle("isPickerOn", !!on);
      if (on) renderPicker();
    }
    function closePicker(){ openPicker(false); }
    window.closeCinsPicker = closePicker;

    // header events
    $("#cinsPrev", mount)?.addEventListener("click", () => stepMonth(-1));
    $("#cinsNext", mount)?.addEventListener("click", () => stepMonth(+1));
    $("#cinsClose", mount)?.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));
    });

    $("#cinsTitle", mount)?.addEventListener("click", () => openPicker(true));
    $("#cinsPickerClose", mount)?.addEventListener("click", () => closePicker());

    $("#cinsYearMinus", mount)?.addEventListener("click", () => { y -= 1; renderPicker(); });
    $("#cinsYearPlus", mount)?.addEventListener("click", () => { y += 1; renderPicker(); });

    // click fuori card chiude
    layer?.addEventListener("click", (e) => {
      if (e.target === layer) closePicker();
    });

    function renderPicker(){
      const yEl = $("#cinsYearVal", mount);
      if (yEl) yEl.textContent = String(y);
    }

    mounted = true;
    ensureInitYM();
    renderMonth();
  }

  function stepMonth(delta) {
    ensureInitYM();
    m += delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    renderMonth();
  }

  function renderMonth() {
    const mount = getMount();
    if (!mount) return;
    if (!mount.querySelector("#cinsRoot")) return;

    ensureInitYM();

    const titleBtn = $("#cinsTitle", mount);
    if (titleBtn) titleBtn.textContent = `${MONTHS[m]} ${y}`;

    const grid = $("#cinsGrid", mount);
    if (!grid) return;
    grid.innerHTML = "";

    const first = new Date(y, m, 1);
    const firstDay = first.getDay(); // 0 Sun..6 Sat
    const offset = (firstDay === 0 ? 6 : firstDay - 1); // Monday-based
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const t = safeTodayParts();
    const ty = Number(t.y), tm = Number(t.m), td = Number(t.d);

    for (let i = 0; i < 42; i++) {
      const dayNum = i - offset + 1;
      const isValid = dayNum >= 1 && dayNum <= daysInMonth;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cinsDay" + (isValid ? "" : " isOff");

      if (isValid) {
        const key = dateKeySafe(y, m, dayNum);

        // today marker
        if (y === ty && m === tm && dayNum === td) btn.classList.add("isToday");

        // num
        const num = document.createElement("span");
        num.className = "cinsNum";
        num.textContent = String(dayNum);
        btn.appendChild(num);

        // dots: saved or draft (insert li mostra entrambi)
        const saved = loadDaySafe(key);
        const draft = loadDraftSafe(key);
        const model = saved || draft;

        if (hasMeaningfulDayData(model)) {
          const hasExtra = !!model?.shifts?.some((s) => !!(s?.tags && (s.tags.overtime || s.tags.holiday || s.tags.sunday)));
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
            const ex = document.createElement("div");
            ex.className = "cinsDot premiumExtra";
            dots.appendChild(ex);
          }
          btn.appendChild(dots);
        }

        btn.addEventListener("click", () => {
          // apre editor giorno
          if (window.NettoTrackUI && typeof window.NettoTrackUI.openDayEditor === "function") {
            window.NettoTrackUI.openDayEditor(key);
          } else {
            document.dispatchEvent(new CustomEvent("nettotrack:dayEditorOpened", { detail: { dateKey: key } }));
          }
        });
      }

      grid.appendChild(btn);
    }
  }

  // Open
  document.addEventListener("nettotrack:calendarInsertOpened", () => {
    mountIfNeeded();
    const t = safeTodayParts();
    y = Number(t.y);
    m = Number(t.m);
    renderMonth();
  });

  // refresh dots after save
  document.addEventListener("nettotrack:dataChanged", () => {
    const mount = getMount();
    if (!mount || !mount.querySelector("#cinsRoot")) return;
    renderMonth();
  });
})();