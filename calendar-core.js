(() => {
  /* =====================================================
     UTIL
  ===================================================== */
  const pad2 = (n) => String(n).padStart(2, "0");

  function dateKey(y, mZeroBased, d) {
    return `${y}-${pad2(mZeroBased + 1)}-${pad2(d)}`; // YYYY-MM-DD
  }

  function todayParts() {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
  }

  function isSunday(y, mZeroBased, d) {
    return new Date(y, mZeroBased, d).getDay() === 0;
  }

  /* =====================================================
     STORAGE KEYS (compat)
     - nuovo:  nettotrack:turni:YYYY-MM-DD
     - vecchio: YYYY-MM-DD
  ===================================================== */
  const PREFIX_TURNI = "nettotrack:turni:";

  function keyPrefixed(dateKeyStr) {
    return PREFIX_TURNI + dateKeyStr;
  }

  function keyLegacy(dateKeyStr) {
    return dateKeyStr; // compat con vecchi moduli
  }

  /* =====================================================
     NORMALIZE (compat flags <-> tags)
     - day-editor usa tags: overtime/holiday/sunday
     - calendar-insert vecchio controlla flags: straordinario/festivo/domenicale
  ===================================================== */
  function normalizeShiftForCompat(shift) {
    if (!shift || typeof shift !== "object") return shift;

    const out = { ...shift };

    // ensure tags
    const t = (out.tags && typeof out.tags === "object") ? { ...out.tags } : {};
    out.tags = t;

    // ensure flags (legacy)
    const f = (out.flags && typeof out.flags === "object") ? { ...out.flags } : {};

    // map tags -> flags (se tags esiste)
    // (day-editor) overtime/holiday/sunday
    if (typeof t.overtime === "boolean") f.straordinario = t.overtime;
    if (typeof t.holiday === "boolean") f.festivo = t.holiday;
    if (typeof t.sunday === "boolean") f.domenicale = t.sunday;

    // map flags -> tags (se flags esiste ma tags no/undefined)
    if (typeof f.straordinario === "boolean" && typeof t.overtime !== "boolean") t.overtime = f.straordinario;
    if (typeof f.festivo === "boolean" && typeof t.holiday !== "boolean") t.holiday = f.festivo;
    if (typeof f.domenicale === "boolean" && typeof t.sunday !== "boolean") t.sunday = f.domenicale;

    out.flags = f;
    out.tags = t;

    return out;
  }

  function normalizeDayForCompat(dayObj) {
    if (!dayObj || typeof dayObj !== "object") return dayObj;

    const out = { ...dayObj };
    if (Array.isArray(out.shifts)) {
      out.shifts = out.shifts.map(normalizeShiftForCompat);
    }
    return out;
  }

  /* =====================================================
     STORAGE — PER GIORNO
     loadDay: prova prefisso -> legacy
     saveDay: salva prefisso + legacy (così i dot funzionano sempre)
  ===================================================== */
  function loadDay(dateKeyStr) {
    try {
      const raw1 = localStorage.getItem(keyPrefixed(dateKeyStr));
      if (raw1) return normalizeDayForCompat(JSON.parse(raw1));
    } catch (_) {}

    try {
      const raw2 = localStorage.getItem(keyLegacy(dateKeyStr));
      if (raw2) return normalizeDayForCompat(JSON.parse(raw2));
    } catch (_) {}

    return null;
  }

  function saveDay(dateKeyStr, obj) {
    const payload = normalizeDayForCompat(obj);

    // salva nuovo (canonico)
    try {
      localStorage.setItem(keyPrefixed(dateKeyStr), JSON.stringify(payload));
    } catch (_) {}

    // salva anche legacy per compat (calendar-insert / vecchie parti)
    try {
      localStorage.setItem(keyLegacy(dateKeyStr), JSON.stringify(payload));
    } catch (_) {}
  }

  function removeDay(dateKeyStr) {
    try { localStorage.removeItem(keyPrefixed(dateKeyStr)); } catch (_) {}
    try { localStorage.removeItem(keyLegacy(dateKeyStr)); } catch (_) {}
  }

  /* =====================================================
     DRAFT (MODIFICHE NON SALVATE)
     - compat su entrambe le chiavi
  ===================================================== */
  function draftKeyPrefixed(dateKeyStr) {
    return `_draft_${keyPrefixed(dateKeyStr)}`;
  }
  function draftKeyLegacy(dateKeyStr) {
    return `_draft_${keyLegacy(dateKeyStr)}`;
  }

  function loadDraft(dateKeyStr) {
    try {
      const raw1 = localStorage.getItem(draftKeyPrefixed(dateKeyStr));
      if (raw1) return normalizeDayForCompat(JSON.parse(raw1));
    } catch (_) {}

    try {
      const raw2 = localStorage.getItem(draftKeyLegacy(dateKeyStr));
      if (raw2) return normalizeDayForCompat(JSON.parse(raw2));
    } catch (_) {}

    return null;
  }

  function saveDraft(dateKeyStr, obj) {
    const payload = normalizeDayForCompat(obj);
    try { localStorage.setItem(draftKeyPrefixed(dateKeyStr), JSON.stringify(payload)); } catch (_) {}
    try { localStorage.setItem(draftKeyLegacy(dateKeyStr), JSON.stringify(payload)); } catch (_) {}
  }

  function removeDraft(dateKeyStr) {
    try { localStorage.removeItem(draftKeyPrefixed(dateKeyStr)); } catch (_) {}
    try { localStorage.removeItem(draftKeyLegacy(dateKeyStr)); } catch (_) {}
  }

  /* =====================================================
     TIME / ORE
  ===================================================== */
  function parseHHMM(str) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(str || "").trim());
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  function minutesToHours(min) {
    return Math.round((min / 60) * 10) / 10; // 1 decimale
  }

  function shiftMinutes(shift) {
    if (!shift) return 0;
    const a = parseHHMM(shift.from);
    const b = parseHHMM(shift.to);
    if (a == null || b == null) return 0;

    let diff = b - a;
    if (diff < 0) diff += 24 * 60; // overnight

    const pause = Number(shift.pauseMin || 0) || 0;
    const pausePaid = !!shift.pausePaid;

    return Math.max(0, diff - (pausePaid ? 0 : pause));
  }

  function dayTotals(dayObj) {
    const d = normalizeDayForCompat(dayObj);
    const shifts = Array.isArray(d?.shifts) ? d.shifts : [];

    let baseMin = 0;
    let extraMin = 0;

    for (const s of shifts) {
      const min = shiftMinutes(s);

      // extra se (tags) o (flags) — entrambi supportati
      const isExtra =
        !!(s?.tags?.overtime || s?.tags?.holiday || s?.tags?.sunday) ||
        !!(s?.flags?.straordinario || s?.flags?.festivo || s?.flags?.domenicale);

      if (isExtra) extraMin += min;
      else baseMin += min;
    }

    return {
      baseHours: minutesToHours(baseMin),
      extraHours: minutesToHours(extraMin),
      hasBase: baseMin > 0,
      hasExtra: extraMin > 0
    };
  }

  /* =====================================================
     SETTIMANA
  ===================================================== */
  function startOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0=Sun … 6=Sat
    const diff = (day === 0 ? -6 : 1 - day); // Monday-based
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* =====================================================
     API GLOBALE
     - NTCal: usato da calendar-insert.js
     - NettoTrackCalendarCore: usato da day-editor.js (getDayData/setDayData)
  ===================================================== */
  window.NTCal = {
    pad2,
    dateKey,
    todayParts,
    isSunday,

    // storage
    loadDay,
    saveDay,
    removeDay,

    // draft
    loadDraft,
    saveDraft,
    removeDraft,

    // totals
    dayTotals,
    startOfWeek
  };

  // alias “core” che il day-editor prova a usare
  window.NettoTrackCalendarCore = {
    getDayData: (dk) => loadDay(dk),
    setDayData: (dk, data) => saveDay(dk, data),
    removeDayData: (dk) => removeDay(dk),

    getDraft: (dk) => loadDraft(dk),
    setDraft: (dk, data) => saveDraft(dk, data),
    removeDraft: (dk) => removeDraft(dk)
  };
})();