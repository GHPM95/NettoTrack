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
    if (!dateKey || typeof dateKey !== "string" || !dateKey.includes("-")) return dateKey || "";
    const [y, m, d] = dateKey.split("-");
    if (!y || !m || !d) return dateKey;
    return `${d}/${m}/${y}`;
  }

  function isSundayKey(dateKey) {
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
      // "none" NON disabilita nulla: è solo “senza etichetta fascia”
      shiftType: "none",

      tags: {
        morning: false,
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

    let shiftType = typeof s.shiftType === "string" ? s.shiftType : "none";
    if (!["none","morning","afternoon","night"].includes(shiftType)) shiftType = "none";

    // allinea tags fascia (mutuo) SOLO se selezionata fascia reale
    if (shiftType === "morning" || shiftType === "afternoon" || shiftType === "night") {
      tags.morning = shiftType === "morning";
      tags.afternoon = shiftType === "afternoon";
      tags.night = shiftType === "night";
    } else {
      tags.morning = false;
      tags.afternoon = false;
      tags.night = false;
    }

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
          const shifts = Array.isArray(data.shifts) && data.shifts.length
            ? data.shifts.map(normalizeShift)
            : defaultState(dateKey).shifts;
          return { dateKey, shifts };
        }
      }
    } catch (_) {}

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

  function applyShiftType(shift, type) {
    shift.shiftType = type;

    shift.tags = shift.tags || {};
    if (type === "morning" || type === "afternoon" || type === "night") {
      shift.tags.morning = type === "morning";
      shift.tags.afternoon = type === "afternoon";
      shift.tags.night = type === "night";
    } else {
      shift.tags.morning = false;
      shift.tags.afternoon = false;
      shift.tags.night = false;
    }
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
      localStorage.setItem(STORAGE_PREFIX + currentKey, JSON.stringify({ shifts: state.shifts }));
    } catch (_) {}
  }

  /* -------------------------
     UI helpers
  ------------------------- */
  function ensureMount() {
    const id = `${SLIDE_ID}Mount`;
    mount = document.getElementById(id) || $(`#${id}`) || document.querySelector(`#${id}`);
    return !!mount;
  }

  function chip(label, tag, on) {
    return `<button class="deChip ${on ? "isOn" : ""}" type="button" data-tag="${tag}" aria-pressed="${on ? "true" : "false"}">${escapeHtml(label)}</button>`;
  }

  function updateEmptyStyles(scope) {
    // Opacizza: fascia se "none", nota se vuota (placeholder già ok)
    const sel = scope.querySelector('[data-k="shiftType"]');
    if (sel) sel.classList.toggle("deIsEmpty", (sel.value || "none") === "none");

    // Opacizza: Pausa pagata se "No" (default) → trattiamolo come valore “non evidenziato”
    const pp = scope.querySelector('[data-k="pausePaid"]');
    if (pp) pp.classList.toggle("deIsEmpty", (pp.value || "false") === "false");

    // Opacizza: pauseMin se 0 (default)
    const pm = scope.querySelector('[data-k="pauseMin"]');
    if (pm) pm.classList.toggle("deIsEmpty", String(pm.value || "0") === "0");
  }

  function canAddShift() {
    // Attivo solo se l’ultimo turno ha Da e A valorizzati
    const last = state?.shifts?.[state.shifts.length - 1];
    if (!last) return false;
    const fromOk = typeof last.from === "string" && last.from.trim().length >= 4;
    const toOk = typeof last.to === "string" && last.to.trim().length >= 4;
    return fromOk && toOk;
  }

  function syncAddShiftButton() {
    const btn = $("#deAddShift", mount);
    if (!btn) return;
    btn.disabled = !canAddShift();
  }

  /* -------------------------
     Render
  ------------------------- */
  function render() {
    if (!ensureMount() || !state) return;

    mount.innerHTML = `
      <div class="deRoot">
        <div class="deHeader">
          <div class="deHeaderSpacer" aria-hidden="true"></div>
          <div class="deTitle">Turni · ${formatDateKeyToIT(state.dateKey)}</div>
          <button class="deClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="deShifts" id="deShifts"></div>

        <div class="deActions">
          <button class="deAddShift" id="deAddShift" type="button" disabled>+ Aggiungi turno</button>
        </div>
      </div>
    `;

    $(".deClose", mount)?.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
    });

    $("#deAddShift", mount)?.addEventListener("click", () => {
      if (!canAddShift()) return;
      state.shifts.push(makeDefaultShift());
      renderShifts();
      scheduleSave();
    });

    renderShifts();
    syncAddShiftButton();
  }

  function renderShifts() {
    const host = $("#deShifts", mount);
    if (!host) return;

    const isSun = enforceSundayRule();
    const onlyOne = state.shifts.length <= 1;

    host.innerHTML = state.shifts.map((s, idx) => {
      const n = idx + 1;
      const st = s.shiftType || "none";

      return `
        <div class="deShiftCard" data-idx="${idx}">
          <div class="deShiftTop">
            <button class="deRemoveShift" type="button" aria-label="Rimuovi turno" ${onlyOne ? "disabled" : ""}>−</button>
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

          <div class="deGrid">
            <label class="deField">
              <span class="deFieldLbl">Da<span class="deReq">*</span></span>
              <input class="deInput" type="time" data-k="from" value="${escapeHtml(s.from)}">
            </label>

            <label class="deField">
              <span class="deFieldLbl">A<span class="deReq">*</span></span>
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

          <div class="deDivider"></div>

          <div class="deChips deChipsExtra">
            ${chip("Straordinario", "overtime", !!(s.tags && s.tags.overtime))}
            ${chip("Festivo", "holiday", !!(s.tags && s.tags.holiday))}
          </div>

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

      // apply empty styles initially
      updateEmptyStyles(card);

      // remove shift
      card.querySelector(".deRemoveShift")?.addEventListener("click", () => {
        if (state.shifts.length <= 1) return;
        state.shifts.splice(idx, 1);
        renderShifts();
        scheduleSave();
        syncAddShiftButton();
      });

      // inputs/selects/textarea
      Array.from(card.querySelectorAll("[data-k]")).forEach((el) => {
        const k = el.getAttribute("data-k");
        if (!k) return;

        if (el.tagName === "INPUT") {
          el.addEventListener("input", () => {
            if (k === "pauseMin") shift.pauseMin = clamp(Number(el.value || 0), 0, 999);
            else shift[k] = el.value;

            updateEmptyStyles(card);
            scheduleSave();
            syncAddShiftButton();
          });
        }

        if (el.tagName === "SELECT") {
          el.addEventListener("change", () => {
            if (k === "pausePaid") {
              shift.pausePaid = el.value === "true";
              updateEmptyStyles(card);
              scheduleSave();
              return;
            }

            if (k === "shiftType") {
              applyShiftType(shift, el.value || "none");
              updateEmptyStyles(card);
              scheduleSave();
              return;
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
          if (tag === "sunday") return;

          shift.tags = shift.tags || {};
          shift.tags[tag] = !shift.tags[tag];
          chipEl.classList.toggle("isOn", !!shift.tags[tag]);
          chipEl.setAttribute("aria-pressed", shift.tags[tag] ? "true" : "false");

          scheduleSave();
        });
      });
    });

    syncAddShiftButton();
  }

  /* -------------------------
     Open
  ------------------------- */
  function open(dateKey) {
    currentKey = dateKey || currentKey || new Date().toISOString().slice(0, 10);
    state = loadState(currentKey);

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