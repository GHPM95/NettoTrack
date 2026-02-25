/* day-editor.js
   Card "Turni" (slide: dayEditor) — separata dal calendario
   Apre tramite: evento "nettotrack:dayEditorOpened" { detail: { dateKey } }
*/
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const SLIDE_ID = "dayEditor";
  const STORAGE_PREFIX = "nettotrack:turni:";

  let currentKey = null;
  let mount = null;
  let state = null;
  let saveTimer = null;

  /* -------------------------
     Utils
  ------------------------- */
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDateKeyToIT(dateKey) {
    // YYYY-MM-DD -> DD/MM/YYYY
    if (!dateKey || typeof dateKey !== "string" || !dateKey.includes("-")) return dateKey || "";
    const [y, m, d] = dateKey.split("-");
    if (!y || !m || !d) return dateKey;
    return `${d}/${m}/${y}`;
  }

  function isSundayKey(dateKey) {
    // Prefer NTCal if available
    try {
      if (window.NTCal && typeof window.NTCal.isSunday === "function") {
        const [yy, mm, dd] = String(dateKey).split("-").map(Number);
        return window.NTCal.isSunday(yy, mm - 1, dd);
      }
    } catch (_) {}

    try {
      const [yy, mm, dd] = String(dateKey).split("-").map(Number);
      const dt = new Date(yy, mm - 1, dd);
      return dt.getDay() === 0;
    } catch (_) {}

    return false;
  }

  /* -------------------------
     Model
  ------------------------- */
  function makeDefaultShift() {
    return {
      from: "08:00",
      to: "17:00",
      pauseMin: 0,
      pausePaid: false,

      // "none" | "morning" | "afternoon" | "night"
      shiftType: "morning",

      tags: {
        morning: true,
        afternoon: false,
        night: false,
        overtime: false,
        holiday: false,
        sunday: false
      },

      note: ""
    };
  }

  function defaultState(dateKey) {
    return { dateKey, shifts: [makeDefaultShift()] };
  }

  function normalizeShift(s) {
    const base = makeDefaultShift();
    if (!s || typeof s !== "object") return { ...base };

    const tags = {
      morning: !!(s.tags && s.tags.morning),
      afternoon: !!(s.tags && s.tags.afternoon),
      night: !!(s.tags && s.tags.night),
      overtime: !!(s.tags && s.tags.overtime),
      holiday: !!(s.tags && s.tags.holiday),
      sunday: !!(s.tags && s.tags.sunday)
    };

    let shiftType = typeof s.shiftType === "string" ? s.shiftType : "";
    if (!shiftType) {
      // fallback per vecchi dati
      if (tags.morning) shiftType = "morning";
      if (tags.afternoon) shiftType = "afternoon";
      if (tags.night) shiftType = "night";
    }
    if (!shiftType) shiftType = "none";

    // allinea tags fascia (mutuo)
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
    // Optional shared core
    const core = window.NettoTrackCalendarCore;
    try {
      if (core && typeof core.getDayData === "function") {
        const data = core.getDayData(dateKey);
        if (data && typeof data === "object") {
          const shifts = Array.isArray(data.shifts) && data.shifts.length
            ? data.shifts.map(normalizeShift)
            : defaultState(dateKey).shifts;
          return { dateKey, shifts };
        }
      }
    } catch (_) {}

    // Local fallback
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + dateKey);
      if (!raw) return defaultState(dateKey);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return defaultState(dateKey);

      const shifts = Array.isArray(parsed.shifts) && parsed.shifts.length
        ? parsed.shifts.map(normalizeShift)
        : defaultState(dateKey).shifts;

      return { dateKey, shifts };
    } catch (_) {
      return defaultState(dateKey);
    }
  }

  function enforceSundayRule() {
    const isSun = isSundayKey(currentKey);
    for (const s of state.shifts) {
      s.tags = s.tags || {};
      s.tags.sunday = isSun ? true : false;
    }
    return isSun;
  }

  function applyNoShift(shift) {
    // "Senza turno": azzera ore e pausa e disabilita (via render)
    shift.shiftType = "none";
    shift.from = "";
    shift.to = "";
    shift.pauseMin = 0;
    shift.pausePaid = false;

    shift.tags = shift.tags || {};
    shift.tags.morning = false;
    shift.tags.afternoon = false;
    shift.tags.night = false;
  }

  function applyShiftType(shift, type) {
    shift.shiftType = type;

    shift.tags = shift.tags || {};
    shift.tags.morning = type === "morning";
    shift.tags.afternoon = type === "afternoon";
    shift.tags.night = type === "night";
  }

  /* -------------------------
     Save
  ------------------------- */
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
      localStorage.setItem(
        STORAGE_PREFIX + currentKey,
        JSON.stringify({ shifts: state.shifts })
      );
    } catch (_) {}
  }

  /* -------------------------
     Mount & Render
  ------------------------- */
  function ensureMount() {
    const id = `${SLIDE_ID}Mount`;
    mount = document.getElementById(id) || $(`#${id}`) || document.querySelector(`#${id}`);
    return !!mount;
  }

  function chip(label, tag, on) {
    return `<button class="deChip ${on ? "isOn" : ""}" type="button" data-tag="${tag}" aria-pressed="${on ? "true" : "false"}">${escapeHtml(label)}</button>`;
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

    $("#deAddShift", mount)?.addEventListener("click", () => {
      state.shifts.push(makeDefaultShift());
      renderShifts();
      scheduleSave();
    });

    renderShifts();
  }

  function renderShifts() {
    const host = $("#deShifts", mount);
    if (!host) return;

    const isSun = enforceSundayRule();

    host.innerHTML = state.shifts.map((s, idx) => {
      const n = idx + 1;
      const st = s.shiftType || "none";
      const disabled = st === "none";

      return `
        <div class="deShiftCard" data-idx="${idx}">
          <div class="deShiftTop">
            <button class="deRemoveShift" type="button" aria-label="Rimuovi turno">−</button>
            <div class="deShiftTitle">Turno ${n}</div>

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
                <option value="none" ${st === "none" ? "selected" : ""}>Senza turno</option>
                <option value="morning" ${st === "morning" ? "selected" : ""}>Mattino</option>
                <option value="afternoon" ${st === "afternoon" ? "selected" : ""}>Pomeriggio</option>
                <option value="night" ${st === "night" ? "selected" : ""}>Notte</option>
              </select>
            </label>
          </div>

          <!-- Orari + Pausa -->
          <div class="deGrid">
            <label class="deField">
              <span class="deFieldLbl">Da (HH:MM)</span>
              <input class="deInput" type="time" data-k="from" value="${escapeHtml(s.from)}" ${disabled ? "disabled" : ""}>
            </label>

            <label class="deField">
              <span class="deFieldLbl">A (HH:MM)</span>
              <input class="deInput" type="time" data-k="to" value="${escapeHtml(s.to)}" ${disabled ? "disabled" : ""}>
            </label>

            <label class="deField">
              <span class="deFieldLbl">Pausa (min)</span>
              <input class="deInput" type="number" inputmode="numeric" min="0" max="999" data-k="pauseMin" value="${Number(s.pauseMin) || 0}" ${disabled ? "disabled" : ""}>
            </label>

            <label class="deField">
              <span class="deFieldLbl">Pausa pagata</span>
              <select class="deSelect" data-k="pausePaid" ${disabled ? "disabled" : ""}>
                <option value="false" ${s.pausePaid ? "" : "selected"}>No</option>
                <option value="true" ${s.pausePaid ? "selected" : ""}>Sì</option>
              </select>
            </label>
          </div>

          <!-- Linea + Extra -->
          <div class="deDivider"></div>

          <div class="deChips deChipsExtra">
            ${chip("Straordinario", "overtime", !!(s.tags && s.tags.overtime))}
            ${chip("Festivo", "holiday", !!(s.tags && s.tags.holiday))}
          </div>

          <!-- Nota turno -->
          <div class="deBlock deShiftNoteBlock">
            <div class="deLabel">Nota turno (opzionale)</div>
            <textarea class="deTextarea deTextareaSmall" data-k="note" placeholder="Nota...">${escapeHtml(s.note || "")}</textarea>
          </div>
        </div>
      `;
    }).join("");

    // Bind events
    Array.from(host.querySelectorAll(".deShiftCard")).forEach((card) => {
      const idx = Number(card.getAttribute("data-idx"));
      const shift = state.shifts[idx];

      // remove shift
      card.querySelector(".deRemoveShift")?.addEventListener("click", () => {
        if (state.shifts.length <= 1) {
          state.shifts[0] = makeDefaultShift();
        } else {
          state.shifts.splice(idx, 1);
        }
        renderShifts();
        scheduleSave();
      });

      // inputs/selects/textarea
      Array.from(card.querySelectorAll("[data-k]")).forEach((el) => {
        const k = el.getAttribute("data-k");
        if (!k) return;

        if (el.tagName === "INPUT") {
          el.addEventListener("input", () => {
            if (k === "pauseMin") shift.pauseMin = clamp(Number(el.value || 0), 0, 999);
            else shift[k] = el.value;
            scheduleSave();
          });
        }

        if (el.tagName === "SELECT") {
          el.addEventListener("change", () => {
            if (k === "pausePaid") {
              shift.pausePaid = el.value === "true";
              scheduleSave();
              return;
            }

            if (k === "shiftType") {
              const v = el.value || "none";
              if (v === "none") {
                applyNoShift(shift);
              } else {
                applyShiftType(shift, v);
              }
              renderShifts(); // per disabilitare/abilitare campi quando cambia fascia
              scheduleSave();
            }
          });
        }

        if (el.tagName === "TEXTAREA") {
          el.addEventListener("input", () => {
            shift.note = el.value;
            scheduleSave();
          });
        }
      });

      // chips (solo overtime/holiday)
      Array.from(card.querySelectorAll(".deChip")).forEach((chipEl) => {
        const tag = chipEl.getAttribute("data-tag");
        if (!tag) return;

        chipEl.addEventListener("click", () => {
          if (tag === "sunday") return; // gestito automaticamente

          shift.tags = shift.tags || {};
          shift.tags[tag] = !shift.tags[tag];
          chipEl.classList.toggle("isOn", !!shift.tags[tag]);
          chipEl.setAttribute("aria-pressed", shift.tags[tag] ? "true" : "false");

          scheduleSave();
        });
      });
    });
  }

  /* -------------------------
     Open
  ------------------------- */
  function open(dateKey) {
    currentKey = dateKey || currentKey || new Date().toISOString().slice(0, 10);
    state = loadState(currentKey);

    // allineamento regola domenicale subito
    enforceSundayRule();

    render();
    scheduleSave();
  }

  document.addEventListener("nettotrack:dayEditorOpened", (e) => {
    const dk = e?.detail?.dateKey;
    open(dk);
  });

  window.NettoTrackDayEditor = { open };
})();