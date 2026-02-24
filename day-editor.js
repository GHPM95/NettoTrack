/* day-editor.js
   Card "Turni" separata dal calendario (NON tocca calendar-insert.js)
   Si apre con: window.NettoTrackUI.openDayEditor(dateKey)
   oppure evento: "nettotrack:dayEditorOpened" { detail: { dateKey } }
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
    // atteso: YYYY-MM-DD
    if (!dateKey || typeof dateKey !== "string" || !dateKey.includes("-")) return dateKey || "";
    const [y, m, d] = dateKey.split("-");
    if (!y || !m || !d) return dateKey;
    return `${d}/${m}/${y}`;
  }

  function defaultState(dateKey) {
    return {
      dateKey,
      note: "",
      shifts: [
        {
          from: "08:00",
          to: "17:00",
          pauseMin: 0,
          pausePaid: false,
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

  function loadState(dateKey) {
    // 1) se esiste un core condiviso, prova a leggere da lì
    const core = window.NettoTrackCalendarCore;
    try {
      if (core && typeof core.getDayData === "function") {
        const data = core.getDayData(dateKey);
        if (data && typeof data === "object") {
          // normalizza nel nostro formato senza rompere nulla
          return {
            dateKey,
            note: String(data.note || ""),
            shifts: Array.isArray(data.shifts) && data.shifts.length ? data.shifts.map(normalizeShift) : defaultState(dateKey).shifts
          };
        }
      }
    } catch (_) {}

    // 2) fallback localStorage (solo per Turni)
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + dateKey);
      if (!raw) return defaultState(dateKey);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return defaultState(dateKey);
      return {
        dateKey,
        note: String(parsed.note || ""),
        shifts: Array.isArray(parsed.shifts) && parsed.shifts.length ? parsed.shifts.map(normalizeShift) : defaultState(dateKey).shifts
      };
    } catch (_) {
      return defaultState(dateKey);
    }
  }

  function normalizeShift(s) {
    const base = {
      from: "08:00",
      to: "17:00",
      pauseMin: 0,
      pausePaid: false,
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
    if (!s || typeof s !== "object") return base;
    return {
      from: typeof s.from === "string" ? s.from : base.from,
      to: typeof s.to === "string" ? s.to : base.to,
      pauseMin: Number.isFinite(Number(s.pauseMin)) ? clamp(Number(s.pauseMin), 0, 999) : base.pauseMin,
      pausePaid: !!s.pausePaid,
      tags: {
        morning: !!(s.tags && s.tags.morning),
        afternoon: !!(s.tags && s.tags.afternoon),
        night: !!(s.tags && s.tags.night),
        overtime: !!(s.tags && s.tags.overtime),
        holiday: !!(s.tags && s.tags.holiday),
        sunday: !!(s.tags && s.tags.sunday)
      },
      note: typeof s.note === "string" ? s.note : base.note
    };
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 220);
  }

  function saveNow() {
    if (!currentKey || !state) return;

    // 1) prova a scrivere nel core condiviso (se esiste)
    const core = window.NettoTrackCalendarCore;
    try {
      if (core && typeof core.setDayData === "function") {
        core.setDayData(currentKey, {
          note: state.note,
          shifts: state.shifts
        });
      }
    } catch (_) {}

    // 2) salva anche in localStorage (non rompe nulla, serve come fallback)
    try {
      localStorage.setItem(STORAGE_PREFIX + currentKey, JSON.stringify({
        note: state.note,
        shifts: state.shifts
      }));
    } catch (_) {}
  }

  function ensureMount() {
    const id = `${SLIDE_ID}Mount`;
    mount = document.getElementById(id) || $(`#${id}`);
    if (!mount) {
      // se non esiste ancora, la slide potrebbe essere stata appena creata:
      // riprova a cercare dentro il cardsTrack
      mount = document.querySelector(`#${id}`);
    }
    return !!mount;
  }

  function render() {
    if (!ensureMount()) return;
    if (!state) return;

    mount.innerHTML = `
      <div class="deRoot">
        <div class="deHeader">
          <div class="deTitle">Turni · ${formatDateKeyToIT(state.dateKey)}</div>
          <button class="deClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="deBlock">
          <div class="deLabel">Nota (opzionale)</div>
          <textarea class="deTextarea" id="deNote" placeholder="Scrivi una nota..."></textarea>
        </div>

        <div class="deShifts" id="deShifts"></div>

        <div class="deActions">
          <button class="deAddShift" id="deAddShift" type="button">+ Aggiungi turno</button>
        </div>
      </div>
    `;

    // header close
    $(".deClose", mount)?.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
    });

    // note
    const noteEl = $("#deNote", mount);
    if (noteEl) {
      noteEl.value = state.note || "";
      noteEl.addEventListener("input", () => {
        state.note = noteEl.value;
        scheduleSave();
      });
    }

    // shifts
    renderShifts();

    // add shift
    $("#deAddShift", mount)?.addEventListener("click", () => {
      state.shifts.push(defaultState(state.dateKey).shifts[0]);
      renderShifts();
      scheduleSave();
    });
  }

  function renderShifts() {
    const host = $("#deShifts", mount);
    if (!host) return;

    host.innerHTML = state.shifts.map((s, idx) => {
      const n = idx + 1;
      return `
        <div class="deShiftCard" data-idx="${idx}">
          <div class="deShiftTop">
            <div class="deShiftTitle">Turno ${n}</div>
            <button class="deRemoveShift" type="button" aria-label="Rimuovi turno">−</button>
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

          <div class="deChips">
            ${chip("Mattino", "morning", s.tags.morning)}
            ${chip("Pomeriggio", "afternoon", s.tags.afternoon)}
            ${chip("Notte", "night", s.tags.night)}
            ${chip("Straordinario", "overtime", s.tags.overtime)}
            ${chip("Festivo", "holiday", s.tags.holiday)}
            ${chip("Domenicale", "sunday", s.tags.sunday)}
          </div>

          <div class="deBlock deShiftNoteBlock">
            <div class="deLabel">Nota turno (opzionale)</div>
            <textarea class="deTextarea deTextareaSmall" data-k="note" placeholder="Nota...">${escapeHtml(s.note || "")}</textarea>
          </div>
        </div>
      `;
    }).join("");

    // bind events per card
    Array.from(host.querySelectorAll(".deShiftCard")).forEach((card) => {
      const idx = Number(card.getAttribute("data-idx"));
      const shift = state.shifts[idx];

      // remove
      card.querySelector(".deRemoveShift")?.addEventListener("click", () => {
        if (state.shifts.length <= 1) {
          // non lasciare la card vuota: resetta il turno
          state.shifts[0] = defaultState(state.dateKey).shifts[0];
        } else {
          state.shifts.splice(idx, 1);
        }
        renderShifts();
        scheduleSave();
      });

      // inputs/selects
      Array.from(card.querySelectorAll("[data-k]")).forEach((el) => {
        const k = el.getAttribute("data-k");
        if (!k) return;

        if (el.tagName === "INPUT") {
          el.addEventListener("input", () => {
            if (k === "pauseMin") {
              shift.pauseMin = clamp(Number(el.value || 0), 0, 999);
            } else {
              shift[k] = el.value;
            }
            scheduleSave();
          });
        } else if (el.tagName === "SELECT") {
          el.addEventListener("change", () => {
            shift.pausePaid = el.value === "true";
            scheduleSave();
          });
        } else if (el.tagName === "TEXTAREA") {
          el.addEventListener("input", () => {
            shift.note = el.value;
            scheduleSave();
          });
        }
      });

      // chips
      Array.from(card.querySelectorAll(".deChip")).forEach((chipEl) => {
        chipEl.addEventListener("click", () => {
          const tag = chipEl.getAttribute("data-tag");
          if (!tag) return;
          shift.tags[tag] = !shift.tags[tag];
          chipEl.classList.toggle("isOn", !!shift.tags[tag]);
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
  }

  // Hook: quando la UI apre la card
  document.addEventListener("nettotrack:dayEditorOpened", (e) => {
    const dk = e?.detail?.dateKey;
    open(dk);
  });

  // Se la slide viene creata dopo, al primo open ci pensa l’evento sopra.
  // In più: se qualcuno chiama direttamente
  window.NettoTrackDayEditor = { open };
})();