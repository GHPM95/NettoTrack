/* day-editor.js
   Card "Turni" separata dal calendario (NON tocca calendar-insert.js)
*/
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const SLIDE_ID = "dayEditor";
  const STORAGE_PREFIX = "nettotrack:turni:";

  let currentKey = null;
  let mount = null;
  let state = null;
  let saveTimer = null;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function formatDateKeyToIT(dateKey) {
    if (!dateKey || typeof dateKey !== "string" || !dateKey.includes("-")) return dateKey || "";
    const [y, m, d] = dateKey.split("-");
    if (!y || !m || !d) return dateKey;
    return `${d}/${m}/${y}`;
  }

  function isSundayKey(dateKey) {
    // usa core se esiste, altrimenti Date
    try {
      if (window.NTCal && typeof window.NTCal.isSunday === "function") {
        const [yy, mm, dd] = String(dateKey).split("-").map(Number);
        return window.NTCal.isSunday(yy, mm - 1, dd);
      }
    } catch (_) {}
    try {
      const [yy, mm, dd] = String(dateKey).split("-").map(Number);
      const dt = new Date(yy, (mm - 1), dd);
      return dt.getDay() === 0;
    } catch (_) {}
    return false;
  }

  function defaultState(dateKey) {
    return {
      dateKey,
      shifts: [
        {
          from: "08:00",
          to: "17:00",
          pauseMin: 0,
          pausePaid: false,
          shiftType: "", // "morning" | "afternoon" | "night" | ""
          tags: {
            morning: false,
            afternoon: false,
            night: false,
            overtime: false,
            holiday: false,
            sunday: false
          },
          note: ""
        }
      ]
    };
  }

  function normalizeShift(s) {
    const base = defaultState("x").shifts[0];
    if (!s || typeof s !== "object") return { ...base };

    const tags = {
      morning: !!(s.tags && s.tags.morning),
      afternoon: !!(s.tags && s.tags.afternoon),
      night: !!(s.tags && s.tags.night),
      overtime: !!(s.tags && s.tags.overtime),
      holiday: !!(s.tags && s.tags.holiday),
      sunday: !!(s.tags && s.tags.sunday)
    };

    let shiftType = "";
    if (typeof s.shiftType === "string") shiftType = s.shiftType;
    else {
      if (tags.morning) shiftType = "morning";
      if (tags.afternoon) shiftType = "afternoon";
      if (tags.night) shiftType = "night";
    }

    tags.morning = shiftType === "morning";
    tags.afternoon = shiftType === "afternoon";
    tags.night = shiftType === "night";

    return {
      from: typeof s.from === "string" ? s.from : base.from,
      to: typeof s.to === "string" ? s.to : base.to,
      pauseMin: Number.isFinite(Number(s.pauseMin)) ? clamp(Number(s.pauseMin), 0, 999) : base.pauseMin,
      pausePaid: !!s.pausePaid,
      shiftType,
      tags,
      note: typeof s.note === "string" ? s.note : base.note
    };
  }

  function loadState(dateKey) {
    const core = window.NettoTrackCalendarCore;
    try {
      if (core && typeof core.getDayData === "function") {
        const data = core.getDayData(dateKey);
        if (data && typeof data === "object") {
          return {
            dateKey,
            shifts: Array.isArray(data.shifts) && data.shifts.length
              ? data.shifts.map(normalizeShift)
              : defaultState(dateKey).shifts
          };
        }
      }
    } catch (_) {}

    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + dateKey);
      if (!raw) return defaultState(dateKey);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return defaultState(dateKey);
      return {
        dateKey,
        shifts: Array.isArray(parsed.shifts) && parsed.shifts.length
          ? parsed.shifts.map(normalizeShift)
          : defaultState(dateKey).shifts
      };
    } catch (_) {
      return defaultState(dateKey);
    }
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 220);
  }

  function saveNow() {
    if (!currentKey || !state) return;

    const core = window.NettoTrackCalendarCore;
    try {
      if (core && typeof core.setDayData === "function") {
        core.setDayData(currentKey, { shifts: state.shifts });
      }
    } catch (_) {}

    try {
      localStorage.setItem(STORAGE_PREFIX + currentKey, JSON.stringify({ shifts: state.shifts }));
    } catch (_) {}
  }

  function ensureMount() {
    const id = `${SLIDE_ID}Mount`;
    mount = document.getElementById(id) || $(`#${id}`) || document.querySelector(`#${id}`);
    return !!mount;
  }

  function render() {
    if (!ensureMount() || !state) return;

    mount.innerHTML = `
      <div class="deRoot">
        <div class="deHeader">
          <div class="deTitle">Turni · ${formatDateKeyToIT(state.dateKey)}</div>
          <button class="deClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="deShifts" id="deShifts"></div>

        <div class="deActions">
          <button class="deAddShift" id="deAddShift" type="button">+ Aggiungi turno</button>
        </div>
      </div>
    `;

    $(".deClose", mount)?.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
    });

    renderShifts();

    $("#deAddShift", mount)?.addEventListener("click", () => {
      state.shifts.push(defaultState(state.dateKey).shifts[0]);
      renderShifts();
      scheduleSave();
    });
  }

  function enforceSundayRule() {
    const isSun = isSundayKey(currentKey);
    // forza domenicale ON/OFF su TUTTI i turni
    for (const s of state.shifts) {
      s.tags = s.tags || {};
      s.tags.sunday = isSun ? true : false;
    }
    return isSun;
  }

  function renderShifts() {
    const host = $("#deShifts", mount);
    if (!host) return;

    const isSun = enforceSundayRule(); // ✅ applica la regola prima di disegnare

    host.innerHTML = state.shifts.map((s, idx) => {
      const n = idx + 1;

      return `
        <div class="deShiftCard" data-idx="${idx}">
          <div class="deShiftTop">
            <button class="deRemoveShift" type="button" aria-label="Rimuovi turno">−</button>
            <div class="deShiftTitle">Turno ${n}</div>

            <!-- ✅ Domenicale: ON automatico solo di domenica, altrimenti disabilitato -->
            <button
              class="deChip deChipMini ${isSun ? "isOn" : "isDisabled"}"
              type="button"
              data-tag="sunday"
              ${isSun ? "" : "disabled"}
              aria-disabled="${isSun ? "false" : "true"}"
              aria-pressed="${isSun ? "true" : "false"}"
              title="Domenicale"
            >Domenicale</button>
          </div>

          <!-- Fascia -->
          <div class="deGrid" style="margin-bottom:10px;">
            <label class="deField" style="grid-column:1 / -1;">
              <span class="deFieldLbl">Fascia</span>
              <select class="deSelect" data-k="shiftType">
                <option value="" ${s.shiftType ? "" : "selected"}>—</option>
                <option value="morning" ${s.shiftType === "morning" ? "selected" : ""}>Mattino</option>
                <option value="afternoon" ${s.shiftType === "afternoon" ? "selected" : ""}>Pomeriggio</option>
                <option value="night" ${s.shiftType === "night" ? "selected" : ""}>Notte</option>
              </select>
            </label>
          </div>

          <div class="deGrid">
            <label class="deField">
              <span class="deFieldLbl">Da (HH:MM)</span>
              <input class="deInput" type="time" data-k="from" value="${escapeHtml(s.from)}">
            </label>

            <label class="deField">
              <span class="deFieldLbl">A (HH:MM)</span>
              <input class="deInput" type="time" data-k="to" value="${escapeHtml(s.to)}">
            </label>

            <label class="deField">
              <span class="deFieldLbl">Pausa (min)</span>
              <input class="deInput" type="number" inputmode="numeric" min="0" max="999" data-k="pauseMin" value="${Number(s.pauseMin) || 0}">
            </label>

            <label class="deField">
              <span class="deFieldLbl">Pausa pagata</span>
              <select class="deSelect" data-k="pausePaid">
                <option value="false" ${s.pausePaid ? "" : "selected"}>No</option>
                <option value="true" ${s.pausePaid ? "selected" : ""}>Sì</option>
              </select>
            </label>
          </div>

          <!-- Straordinario + Festivo prima della nota -->
          <div class="deChips deChipsExtra">
            ${chip("Straordinario", "overtime", !!s.tags.overtime)}
            ${chip("Festivo", "holiday", !!s.tags.holiday)}
          </div>

          <div class="deBlock deShiftNoteBlock">
            <div class="deLabel">Nota turno (opzionale)</div>
            <textarea class="deTextarea deTextareaSmall" data-k="note" placeholder="Nota...">${escapeHtml(s.note || "")}</textarea>
          </div>
        </div>
      `;
    }).join("");

    // bind events
    Array.from(host.querySelectorAll(".deShiftCard")).forEach((card) => {
      const idx = Number(card.getAttribute("data-idx"));
      const shift = state.shifts[idx];

      card.querySelector(".deRemoveShift")?.addEventListener("click", () => {
        if (state.shifts.length <= 1) {
          state.shifts[0] = defaultState(state.dateKey).shifts[0];
        } else {
          state.shifts.splice(idx, 1);
        }
        renderShifts();
        scheduleSave();
      });

      Array.from(card.querySelectorAll("[data-k]")).forEach((el) => {
        const k = el.getAttribute("data-k");
        if (!k) return;

        if (el.tagName === "INPUT") {
          el.addEventListener("input", () => {
            if (k === "pauseMin") shift.pauseMin = clamp(Number(el.value || 0), 0, 999);
            else shift[k] = el.value;
            scheduleSave();
          });
        } else if (el.tagName === "SELECT") {
          el.addEventListener("change", () => {
            if (k === "pausePaid") {
              shift.pausePaid = el.value === "true";
            } else if (k === "shiftType") {
              shift.shiftType = el.value || "";
              shift.tags = shift.tags || {};
              shift.tags.morning = shift.shiftType === "morning";
              shift.tags.afternoon = shift.shiftType === "afternoon";
              shift.tags.night = shift.shiftType === "night";
            }
            scheduleSave();
          });
        } else if (el.tagName === "TEXTAREA") {
          el.addEventListener("input", () => {
            shift.note = el.value;
            scheduleSave();
          });
        }
      });

      // Chips extra: overtime/holiday (sunday è disabilitato o forzato)
      Array.from(card.querySelectorAll(".deChip")).forEach((chipEl) => {
        const tag = chipEl.getAttribute("data-tag");
        if (!tag) return;

        chipEl.addEventListener("click", () => {
          // ✅ blocca completamente domenicale se non domenica
          if (tag === "sunday") return;

          shift.tags = shift.tags || {};
          shift.tags[tag] = !shift.tags[tag];
          chipEl.classList.toggle("isOn", !!shift.tags[tag]);
          chipEl.setAttribute("aria-pressed", shift.tags[tag] ? "true" : "false");
          scheduleSave();
        });
      });
    });
  }

  function chip(label, tag, on) {
    return `<button class="deChip ${on ? "isOn" : ""}" type="button" data-tag="${tag}" aria-pressed="${on ? "true" : "false"}">${escapeHtml(label)}</button>`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function open(dateKey) {
    currentKey = dateKey || currentKey || new Date().toISOString().slice(0, 10);
    state = loadState(currentKey);
    render();
    scheduleSave(); // ✅ salva subito l’allineamento domenicale ON/OFF
  }

  document.addEventListener("nettotrack:dayEditorOpened", (e) => {
    const dk = e?.detail?.dateKey;
    open(dk);
  });

  window.NettoTrackDayEditor = { open };
})();