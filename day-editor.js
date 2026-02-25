/* day-editor.js
   Card "Turni" (slide: dayEditor) — separata dal calendario
   Apre tramite evento: "nettotrack:dayEditorOpened" { detail: { dateKey } }
   oppure: window.NettoTrackDayEditor.open(dateKey)
*/
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const SLIDE_ID = "dayEditor";
  const STORAGE_PREFIX = "nettotrack:turni:";

  let currentKey = null;
  let mount = null;
  let state = null;
  let saveTimer = null;

  /* ---------------- Utils ---------------- */
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
    // prova helper condiviso, poi fallback Date
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

  /* ---------------- Model ---------------- */
  function makeDefaultShift() {
    return {
      from: "08:00",
      to: "17:00",
      pauseMin: 0,
      pausePaid: false,
      // "none" | "morning" | "afternoon" | "night"
      shiftType: "morning",
      tags: {
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
      overtime: !!(s.tags && s.tags.overtime),
      holiday: !!(s.tags && s.tags.holiday),
      sunday: !!(s.tags && s.tags.sunday)
    };

    let shiftType = typeof s.shiftType === "string" ? s.shiftType : "";
    if (!shiftType) shiftType = "none";
    if (!["none", "morning", "afternoon", "night"].includes(shiftType)) shiftType = "none";

    const out = {
      from: typeof s.from === "string" ? s.from : base.from,
      to: typeof s.to === "string" ? s.to : base.to,
      pauseMin: Number.isFinite(Number(s.pauseMin)) ? clamp(Number(s.pauseMin), 0, 999) : base.pauseMin,
      pausePaid: !!s.pausePaid,
      shiftType,
      tags,
      note: typeof s.note === "string" ? s.note : base.note
    };

    // se "none" => normalizza campi a vuoto
    if (out.shiftType === "none") {
      out.from = "";
      out.to = "";
      out.pauseMin = 0;
      out.pausePaid = false;
    }

    return out;
  }

  function loadState(dateKey) {
    // 1) core condiviso (se esiste)
    const core = window.NettoTrackCalendarCore;
    try {
      if (core && typeof core.getDayData === "function") {
        const data = core.getDayData(dateKey);
        if (data && typeof data === "object") {
          const shifts =
            Array.isArray(data.shifts) && data.shifts.length
              ? data.shifts.map(normalizeShift)
              : defaultState(dateKey).shifts;
          return { dateKey, shifts };
        }
      }
    } catch (_) {}

    // 2) localStorage fallback
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + dateKey);
      if (!raw) return defaultState(dateKey);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return defaultState(dateKey);

      const shifts =
        Array.isArray(parsed.shifts) && parsed.shifts.length
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
      s.tags.sunday = !!isSun;
    }
    return isSun;
  }

  function applyNoShift(shift) {
    shift.shiftType = "none";
    shift.from = "";
    shift.to = "";
    shift.pauseMin = 0;
    shift.pausePaid = false;
  }

  function applyShiftType(shift, type) {
    shift.shiftType = type;

    // se erano vuoti (perché venivi da "none") rimetti default sensati
    if (!shift.from) shift.from = "08:00";
    if (!shift.to) shift.to = "17:00";
  }

  /* ---------------- Save ---------------- */
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 220);
  }

  function saveNow() {
    if (!currentKey || !state) return;

    // 1) core condiviso
    const core = window.NettoTrackCalendarCore;
    try {
      if (core && typeof core.setDayData === "function") {
        core.setDayData(currentKey, { shifts: state.shifts });
      }
    } catch (_) {}

    // 2) localStorage fallback
    try {
      localStorage.setItem(STORAGE_PREFIX + currentKey, JSON.stringify({ shifts: state.shifts }));
    } catch (_) {}
  }

  /* ---------------- Mount & Render ---------------- */
  function ensureMount() {
    const id = `${SLIDE_ID}Mount`;
    mount = document.getElementById(id) || $(`#${id}`) || document.querySelector(`#${id}`);
    return !!mount;
  }

  function render() {
    if (!ensureMount() || !state) return;

    mount.innerHTML = `
      <div class="deRoot" role="region" aria-label="Turni">
        <div class="deHeader">
          <div class="deTitle">Turni · ${escapeHtml(formatDateKeyToIT(state.dateKey))}</div>
          <button class="deBtn deClose" type="button" aria-label="Chiudi">×</button>
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
      enforceSundayRule();
      renderShifts();
      scheduleSave();
    });

    renderShifts();
  }

  function renderShifts() {
    const host = $("#deShifts", mount);
    if (!host) return;

    const isSun = enforceSundayRule();

    host.innerHTML = state.shifts
      .map((s, idx) => {
        const n = idx + 1;
        const st = s.shiftType || "none";
        const disabled = st === "none";

        return `
          <div class="deShiftCard" data-idx="${idx}">
            <div class="deShiftTop">
              <div class="deShiftTopLeft">
                <div class="deShiftTitle">Turno ${n}</div>
              </div>

              <div class="deShiftTopRight">
                <div class="deBadge ${isSun ? "isOn" : ""}" aria-label="Domenicale">
                  Domenicale
                </div>
              </div>
            </div>

            <div class="deDivider"></div>

            <div class="deField">
              <div class="deLbl">Fascia</div>
              <select class="deSelect" data-k="shiftType" aria-label="Fascia">
                <option value="none" ${st === "none" ? "selected" : ""}>Senza turno</option>
                <option value="morning" ${st === "morning" ? "selected" : ""}>Mattino</option>
                <option value="afternoon" ${st === "afternoon" ? "selected" : ""}>Pomeriggio</option>
                <option value="night" ${st === "night" ? "selected" : ""}>Notte</option>
              </select>
            </div>

            <div class="deDivider"></div>

            <div class="deGrid2">
              <label class="deField">
                <span class="deLbl">Da (HH:MM)</span>
                <input class="deInput" type="time" data-k="from" value="${escapeHtml(s.from)}" ${disabled ? "disabled" : ""}>
              </label>

              <label class="deField">
                <span class="deLbl">A (HH:MM)</span>
                <input class="deInput" type="time" data-k="to" value="${escapeHtml(s.to)}" ${disabled ? "disabled" : ""}>
              </label>
            </div>

            <div class="deGrid2">
              <label class="deField">
                <span class="deLbl">Pausa (min)</span>
                <input class="deInput" type="number" inputmode="numeric" min="0" max="999" data-k="pauseMin"
                       value="${Number(s.pauseMin) || 0}" ${disabled ? "disabled" : ""}>
              </label>

              <label class="deField">
                <span class="deLbl">Pausa pagata</span>
                <select class="deSelect" data-k="pausePaid" ${disabled ? "disabled" : ""}>
                  <option value="false" ${s.pausePaid ? "" : "selected"}>No</option>
                  <option value="true" ${s.pausePaid ? "selected" : ""}>Sì</option>
                </select>
              </label>
            </div>

            <div class="deDivider"></div>

            <div class="deChipRow">
              <button class="deChip ${s.tags?.overtime ? "isOn" : ""}" type="button" data-tag="overtime" aria-pressed="${s.tags?.overtime ? "true" : "false"}">
                Straordinario
              </button>
              <button class="deChip ${s.tags?.holiday ? "isOn" : ""}" type="button" data-tag="holiday" aria-pressed="${s.tags?.holiday ? "true" : "false"}">
                Festivo
              </button>
            </div>

            <div class="deNoteBlock">
              <div class="deLbl">Nota turno (opzionale)</div>
              <textarea class="deTextarea" data-k="note" placeholder="Nota..." ${disabled ? "disabled" : ""}>${escapeHtml(s.note || "")}</textarea>
            </div>

            <div class="deShiftFooter">
              ${
                state.shifts.length > 1
                  ? `<button class="deBtn deRemoveShift" type="button" aria-label="Rimuovi turno">−</button>`
                  : ``
              }
            </div>
          </div>
        `;
      })
      .join("");

    // bind events
    Array.from(host.querySelectorAll(".deShiftCard")).forEach((card) => {
      const idx = Number(card.getAttribute("data-idx"));
      const shift = state.shifts[idx];

      // remove (solo se >1)
      card.querySelector(".deRemoveShift")?.addEventListener("click", () => {
        state.shifts.splice(idx, 1);
        enforceSundayRule();
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
              if (v === "none") applyNoShift(shift);
              else applyShiftType(shift, v);

              enforceSundayRule(); // domenicale sempre auto
              renderShifts();      // per abilitare/disabilitare campi
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

      // chips: overtime / holiday (sunday NON cliccabile)
      Array.from(card.querySelectorAll(".deChip")).forEach((chipEl) => {
        const tag = chipEl.getAttribute("data-tag");
        if (!tag) return;

        chipEl.addEventListener("click", () => {
          shift.tags = shift.tags || {};
          shift.tags[tag] = !shift.tags[tag];
          chipEl.classList.toggle("isOn", !!shift.tags[tag]);
          chipEl.setAttribute("aria-pressed", shift.tags[tag] ? "true" : "false");
          scheduleSave();
        });
      });
    });
  }

  /* ---------------- Open ---------------- */
  function open(dateKey) {
    currentKey = dateKey || currentKey || new Date().toISOString().slice(0, 10);
    state = loadState(currentKey);
    enforceSundayRule();
    render();
    scheduleSave();
  }

  document.addEventListener("nettotrack:dayEditorOpened", (e) => {
    open(e?.detail?.dateKey);
  });

  window.NettoTrackDayEditor = { open };
})();