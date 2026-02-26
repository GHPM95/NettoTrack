/* day-editor.js
   Card "Turni" (slide: dayEditor) — separata dal calendario
   Apre tramite: evento "nettotrack:dayEditorOpened" { detail: { dateKey } }

   Extra:
   - Salva dati (disattivo se non cambia nulla)
   - Impostazioni avanzate (accordion user-controlled)
   - Restore su refresh (best effort, non rompe nulla se UI non supporta)
*/
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const SLIDE_ID = "dayEditor";
  const STORAGE_PREFIX = "nettotrack:turni:";
  const SESSION_LAST = "nt:lastOpen";
  const SESSION_LAST_DATE = "nt:lastDateKey";

  let currentKey = null;
  let mount = null;
  let state = null;

  // snapshot per confrontare “cambiato/non cambiato”
  let lastSavedSnapshot = "";
  let dirty = false;

  // accordion advanced (user controlled)
  let advancedOpen = false;

  // debounce storage
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

  function stableStringify(obj) {
    const seen = new WeakSet();
    const sortObj = (x) => {
      if (x && typeof x === "object") {
        if (seen.has(x)) return x;
        seen.add(x);
        if (Array.isArray(x)) return x.map(sortObj);

        const out = {};
        Object.keys(x).sort().forEach((k) => (out[k] = sortObj(x[k])));
        return out;
      }
      return x;
    };
    try { return JSON.stringify(sortObj(obj)); } catch { return JSON.stringify(obj); }
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
      from: "",
      to: "",
      pauseMin: 0,
      pausePaid: false,
      shiftType: "none",
      tags: {
        morning: false,
        afternoon: false,
        night: false,
        overtime: false,
        holiday: false,
        sunday: false
      },
      advA: "-",
      advB: "-",
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

    tags.morning = shiftType === "morning";
    tags.afternoon = shiftType === "afternoon";
    tags.night = shiftType === "night";
    if (shiftType === "none") {
      tags.morning = false; tags.afternoon = false; tags.night = false;
    }

    const advA = typeof s.advA === "string" ? s.advA : "-";
    const advB = typeof s.advB === "string" ? s.advB : "-";

    return {
      from: typeof s.from === "string" ? s.from : base.from,
      to: typeof s.to === "string" ? s.to : base.to,
      pauseMin: Number.isFinite(Number(s.pauseMin)) ? clamp(Number(s.pauseMin), 0, 999) : base.pauseMin,
      pausePaid: !!s.pausePaid,
      shiftType,
      tags,
      advA: advA || "-",
      advB: advB || "-",
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
    shift.tags.morning = type === "morning";
    shift.tags.afternoon = type === "afternoon";
    shift.tags.night = type === "night";
    if (type === "none") {
      shift.tags.morning = false;
      shift.tags.afternoon = false;
      shift.tags.night = false;
    }
  }

  function anyMeaningfulDataExists() {
    if (!state || !Array.isArray(state.shifts)) return false;

    return state.shifts.some((s) => {
      const hasTimes = !!(s.from || s.to);
      const hasPause = Number(s.pauseMin || 0) > 0 || !!s.pausePaid;
      const hasFascia = (s.shiftType && s.shiftType !== "none");
      const hasExtra = !!(s.tags && (s.tags.overtime || s.tags.holiday));
      const hasAdv = (s.advA && s.advA !== "-") || (s.advB && s.advB !== "-");
      const hasNote = !!(s.note && String(s.note).trim().length);
      return hasTimes || hasPause || hasFascia || hasExtra || hasAdv || hasNote;
    });
  }

  function hasAtLeastOneCompleteShift() {
    if (!state || !Array.isArray(state.shifts)) return false;
    return state.shifts.some((s) => !!(s.from && s.to));
  }

  // ✅ NUOVO: Salva si attiva solo se TUTTI i turni sono completi (Da & A)
  function areAllShiftsComplete() {
    if (!state || !Array.isArray(state.shifts) || state.shifts.length === 0) return false;
    return state.shifts.every((s) => !!(s.from && s.to));
  }

  function markDirty() {
    dirty = true;
    updateActionsEnabled();
  }

  function updateDirtyFromSnapshot() {
    const snap = stableStringify(state?.shifts || []);
    dirty = snap !== lastSavedSnapshot;
    updateActionsEnabled();
  }

  /* -------------------------
     Save
  ------------------------- */
  function scheduleBackgroundSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveToStorage(false);
    }, 220);
  }

  function saveToStorage(isUserSave) {
    if (!currentKey || !state) return;

    const payload = { shifts: state.shifts };

    const core = window.NettoTrackCalendarCore;
    try {
      if (core && typeof core.setDayData === "function") {
        core.setDayData(currentKey, payload);
      }
    } catch (_) {}

    try {
      localStorage.setItem(STORAGE_PREFIX + currentKey, JSON.stringify(payload));
    } catch (_) {}

    if (isUserSave) {
      lastSavedSnapshot = stableStringify(state.shifts);
      dirty = false;
      advancedOpen = false; // richiudo solo su Salva
      renderShifts();
    } else {
      updateDirtyFromSnapshot();
    }
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
          <div class="deHeaderSpacer" aria-hidden="true"></div>
          <div class="deTitle">Turni · ${formatDateKeyToIT(state.dateKey)}</div>
          <button class="deClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="deShifts" id="deShifts"></div>

        <div class="deActions">
          <button class="deAddShift" id="deAddShift" type="button">+ Aggiungi turno</button>
          <button class="deSave" id="deSave" type="button">Salva dati</button>
        </div>
      </div>
    `;

    $(".deClose", mount)?.addEventListener("click", () => {
      advancedOpen = false;
      document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
    });

    $("#deAddShift", mount)?.addEventListener("click", () => {
      const btn = $("#deAddShift", mount);
      if (btn && btn.disabled) return;

      state.shifts.push(makeDefaultShift());
      markDirty();
      renderShifts();
      scheduleBackgroundSave();
    });

    $("#deSave", mount)?.addEventListener("click", () => {
      const btn = $("#deSave", mount);
      if (btn && btn.disabled) return;
      saveToStorage(true);
    });

    renderShifts();
    updateActionsEnabled();
  }

  function updateActionsEnabled() {
    const addBtn = $("#deAddShift", mount);
    const saveBtn = $("#deSave", mount);

    const anyData = anyMeaningfulDataExists();
    const hasComplete = hasAtLeastOneCompleteShift();
    const allComplete = areAllShiftsComplete();

    // + Aggiungi turno: attivo solo se almeno un turno ha Da e A
    if (addBtn) {
      const canAdd = hasComplete;
      addBtn.disabled = !canAdd;
      addBtn.classList.toggle("isDisabled", !canAdd);
    }

    // ✅ Salva: attivo SOLO se:
    // - tutti i turni sono completi (Da & A)   ← questa è la tua richiesta
    // - e ci sono cambiamenti (dirty)
    if (saveBtn) {
      const canSave = allComplete && dirty;
      saveBtn.disabled = !canSave;
      saveBtn.classList.toggle("isDisabled", !canSave);
    }

    // se non c'è nessun dato, forzo entrambi spenti (sicurezza)
    if (!anyData) {
      if (saveBtn) { saveBtn.disabled = true; saveBtn.classList.add("isDisabled"); }
      if (addBtn)  { addBtn.disabled = true; addBtn.classList.add("isDisabled"); }
    }
  }

  function renderShifts() {
    const host = $("#deShifts", mount);
    if (!host) return;

    const isSun = enforceSundayRule();

    host.innerHTML = state.shifts.map((s, idx) => {
      const n = idx + 1;
      const st = s.shiftType || "none";

      const advA = s.advA || "-";
      const advB = s.advB || "-";

      return `
        <div class="deShiftCard" data-idx="${idx}">
          <div class="deShiftTop">
            <button class="deResetShift" type="button" aria-label="Reset turno" ${state.shifts.length <= 1 ? "disabled" : ""}>−</button>
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

          <div class="deDivider"></div>

          <button class="deAdvToggle" type="button" aria-expanded="${advancedOpen ? "true" : "false"}">
            Impostazioni avanzate
            <span class="deAdvChevron" aria-hidden="true">▾</span>
          </button>

          <div class="deAdvPanel ${advancedOpen ? "isOn" : ""}">
            <div class="deGrid" style="margin-top:10px;">
              <label class="deField" style="grid-column:1 / -1;">
                <span class="deFieldLbl">Assenza / permessi</span>
                <select class="deSelect" data-k="advA">
                  <option value="-" ${advA === "-" ? "selected" : ""}>-</option>
                  <option value="Ferie" ${advA === "Ferie" ? "selected" : ""}>Ferie</option>
                  <option value="Malattia" ${advA === "Malattia" ? "selected" : ""}>Malattia</option>
                  <option value="Infortunio sul lavoro" ${advA === "Infortunio sul lavoro" ? "selected" : ""}>Infortunio sul lavoro</option>
                  <option value="Permessi retribuiti" ${advA === "Permessi retribuiti" ? "selected" : ""}>Permessi retribuiti</option>
                  <option value="Permessi non retribuiti" ${advA === "Permessi non retribuiti" ? "selected" : ""}>Permessi non retribuiti</option>
                </select>
              </label>

              <label class="deField" style="grid-column:1 / -1;">
                <span class="deFieldLbl">Congedi / aspettative</span>
                <select class="deSelect" data-k="advB">
                  <option value="-" ${advB === "-" ? "selected" : ""}>-</option>
                  <option value="Congedo matrimoniale" ${advB === "Congedo matrimoniale" ? "selected" : ""}>Congedo matrimoniale</option>
                  <option value="Congedo familiare" ${advB === "Congedo familiare" ? "selected" : ""}>Congedo familiare</option>
                  <option value="Congedo di maternità" ${advB === "Congedo di maternità" ? "selected" : ""}>Congedo di maternità</option>
                  <option value="Congedo di paternità" ${advB === "Congedo di paternità" ? "selected" : ""}>Congedo di paternità</option>
                  <option value="Congedo speciale 104" ${advB === "Congedo speciale 104" ? "selected" : ""}>Congedo speciale 104</option>
                  <option value="Congedo per gravi motivi" ${advB === "Congedo per gravi motivi" ? "selected" : ""}>Congedo per gravi motivi</option>
                  <option value="Aspettativa" ${advB === "Aspettativa" ? "selected" : ""}>Aspettativa</option>
                </select>
              </label>
            </div>
          </div>

          <div class="deBlock deShiftNoteBlock">
            <div class="deLabel">Nota turno (opzionale)</div>
            <textarea class="deTextarea deTextareaSmall" data-k="note" placeholder="Nota...">${escapeHtml(s.note || "")}</textarea>
          </div>
        </div>
      `;
    }).join("");

    Array.from(host.querySelectorAll(".deShiftCard")).forEach((card) => {
      const idx = Number(card.getAttribute("data-idx"));
      const shift = state.shifts[idx];

      card.querySelector(".deResetShift")?.addEventListener("click", () => {
        if (!state || !Array.isArray(state.shifts)) return;

        if (state.shifts.length > 1) {
          state.shifts.splice(idx, 1);
        } else {
          const isSun = isSundayKey(currentKey);
          const fresh = makeDefaultShift();
          fresh.tags.sunday = isSun;
          state.shifts[0] = fresh;
        }

        markDirty();
        renderShifts();
        saveToStorage(false);
      });

      card.querySelector(".deAdvToggle")?.addEventListener("click", () => {
        advancedOpen = !advancedOpen;
        renderShifts();
      });

      Array.from(card.querySelectorAll("[data-k]")).forEach((el) => {
        const k = el.getAttribute("data-k");
        if (!k) return;

        if (el.tagName === "INPUT") {
          el.addEventListener("input", () => {
            if (k === "pauseMin") shift.pauseMin = clamp(Number(el.value || 0), 0, 999);
            else shift[k] = el.value;

            markDirty();
            scheduleBackgroundSave();
          });
        }

        if (el.tagName === "SELECT") {
          el.addEventListener("change", () => {
            const v = el.value;

            if (k === "pausePaid") {
              shift.pausePaid = v === "true";
              markDirty();
              scheduleBackgroundSave();
              return;
            }

            if (k === "shiftType") {
              applyShiftType(shift, v || "none");
              markDirty();
              renderShifts();
              scheduleBackgroundSave();
              return;
            }

            if (k === "advA") {
              shift.advA = v || "-";
              if (shift.advA !== "-") shift.advB = "-";
              markDirty();
              renderShifts();
              scheduleBackgroundSave();
              return;
            }

            if (k === "advB") {
              shift.advB = v || "-";
              if (shift.advB !== "-") shift.advA = "-";
              markDirty();
              renderShifts();
              scheduleBackgroundSave();
              return;
            }
          });
        }

        if (el.tagName === "TEXTAREA") {
          el.addEventListener("input", () => {
            shift.note = el.value;
            markDirty();
            scheduleBackgroundSave();
          });
        }
      });

      Array.from(card.querySelectorAll(".deChip")).forEach((chipEl) => {
        const tag = chipEl.getAttribute("data-tag");
        if (!tag) return;

        chipEl.addEventListener("click", () => {
          if (tag === "sunday") return;

          shift.tags = shift.tags || {};
          shift.tags[tag] = !shift.tags[tag];
          chipEl.classList.toggle("isOn", !!shift.tags[tag]);
          chipEl.setAttribute("aria-pressed", shift.tags[tag] ? "true" : "false");

          markDirty();
          scheduleBackgroundSave();
        });
      });
    });

    updateDirtyFromSnapshot();
  }

  /* -------------------------
     Open
  ------------------------- */
  function open(dateKey) {
    currentKey = dateKey || currentKey || new Date().toISOString().slice(0, 10);
    state = loadState(currentKey);
    enforceSundayRule();

    lastSavedSnapshot = stableStringify(state.shifts);
    dirty = false;

    try {
      sessionStorage.setItem(SESSION_LAST, SLIDE_ID);
      sessionStorage.setItem(SESSION_LAST_DATE, currentKey);
    } catch (_) {}

    render();
    updateActionsEnabled();
  }

  document.addEventListener("nettotrack:dayEditorOpened", (e) => {
    const dk = e?.detail?.dateKey;
    open(dk);
  });

  window.NettoTrackDayEditor = { open };

  document.addEventListener("DOMContentLoaded", () => {
    try {
      const last = sessionStorage.getItem(SESSION_LAST);
      const dk = sessionStorage.getItem(SESSION_LAST_DATE);
      if (last === SLIDE_ID && dk) {
        setTimeout(() => {
          if (window.NettoTrackUI && typeof window.NettoTrackUI.openDayEditor === "function") {
            window.NettoTrackUI.openDayEditor(dk);
            return;
          }
          document.dispatchEvent(new CustomEvent("nettotrack:dayEditorOpened", { detail: { dateKey: dk } }));
        }, 60);
      }
    } catch (_) {}
  });
})();