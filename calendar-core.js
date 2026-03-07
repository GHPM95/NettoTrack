Calendar-core.js

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
     STORAGE — PER GIORNO
  ===================================================== */
  const DAY_PREFIX = "nettotrack:turni:";

  function keyWithPrefix(dateKeyStr) {
    const k = String(dateKeyStr || "");
    if (!k) return "";
    return k.startsWith(DAY_PREFIX) ? k : (DAY_PREFIX + k);
  }

  /* =====================================================
     NORMALIZE (CRITICO)
     - garantisce shifts[]
     - garantisce from/to anche se salvati come start/end, time.from/time.to, ecc.
     - allinea tags/flags (nuovo/vecchio)
  ===================================================== */
  function pickTimeFromShift(s) {
    if (!s || typeof s !== "object") return { from: "", to: "" };

    const from =
      s.from ?? s.start ?? s.time?.from ?? s.timeFrom ?? s.da ?? s.inizio ?? "";
    const to =
      s.to ?? s.end ?? s.time?.to ?? s.timeTo ?? s.a ?? s.fine ?? "";

    return {
      from: typeof from === "string" ? from : String(from || ""),
      to: typeof to === "string" ? to : String(to || "")
    };
  }

  function normalizeShift(s) {
    if (!s || typeof s !== "object") return null;

    const { from, to } = pickTimeFromShift(s);

    // tags/flags: compatibilità incrociata
    const tags = (s.tags && typeof s.tags === "object") ? { ...s.tags } : {};
    const flags = (s.flags && typeof s.flags === "object") ? { ...s.flags } : {};

    // flags -> tags
    if (flags.straordinario) tags.overtime = true;
    if (flags.festivo)       tags.holiday = true;
    if (flags.domenicale)    tags.sunday  = true;

    // tags -> flags
    if (tags.overtime) flags.straordinario = true;
    if (tags.holiday)  flags.festivo      = true;
    if (tags.sunday)   flags.domenicale   = true;

    const pauseMin = Number(s.pauseMin ?? s.pause ?? 0) || 0;

    return {
      ...s,
      from,
      to,
      pauseMin,
      pausePaid: !!s.pausePaid,
      shiftType: s.shiftType ?? s.fascia ?? s.type ?? "none",
      tags,
      flags
    };
  }

  function normalizeDayModel(obj) {
    if (!obj || typeof obj !== "object") return null;

    // supporto eventuale vecchio nome "turni"
    const rawShifts = Array.isArray(obj.shifts) ? obj.shifts
                    : Array.isArray(obj.turni)  ? obj.turni
                    : [];

    const shifts = rawShifts.map(normalizeShift).filter(Boolean);

    return { ...obj, shifts };
  }

  function loadDay(dateKeyStr) {
    const k1 = keyWithPrefix(dateKeyStr);
    const k2 = String(dateKeyStr || "");

    // 1) chiave prefix
    try {
      const raw = localStorage.getItem(k1);
      if (raw) return normalizeDayModel(JSON.parse(raw));
    } catch {}

    // 2) chiave nuda (compat)
    try {
      const raw = localStorage.getItem(k2);
      if (raw) return normalizeDayModel(JSON.parse(raw));
    } catch {}

    return null;
  }

  function saveDay(dateKeyStr, obj) {
    const k1 = keyWithPrefix(dateKeyStr);
    const k2 = String(dateKeyStr || "");

    const model = normalizeDayModel(obj) || obj;
    let raw = "";
    try { raw = JSON.stringify(model); } catch {}
    if (!raw) return;

    try { localStorage.setItem(k1, raw); } catch {}
    try { localStorage.setItem(k2, raw); } catch {}
  }

  function removeDay(dateKeyStr) {
    const k1 = keyWithPrefix(dateKeyStr);
    const k2 = String(dateKeyStr || "");
    try { localStorage.removeItem(k1); } catch {}
    try { localStorage.removeItem(k2); } catch {}
  }

  /* =====================================================
     DRAFT
  ===================================================== */
  function draftKey(dateKeyStr) {
    return `_draft_${String(dateKeyStr || "")}`;
  }

  function loadDraft(dateKeyStr) {
    try {
      const raw = localStorage.getItem(draftKey(dateKeyStr));
      if (!raw) return null;
      return normalizeDayModel(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  function saveDraft(dateKeyStr, obj) {
    try {
      const model = normalizeDayModel(obj) || obj;
      localStorage.setItem(draftKey(dateKeyStr), JSON.stringify(model));
    } catch {}
  }

  function removeDraft(dateKeyStr) {
    try { localStorage.removeItem(draftKey(dateKeyStr)); } catch {}
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

  function isExtraShift(s) {
    const t = s?.tags || {};
    const f = s?.flags || {};
    return !!(t.overtime || t.holiday || t.sunday || f.straordinario || f.festivo || f.domenicale);
  }

  function shiftMinutes(shift) {
    const s = normalizeShift(shift);
    if (!s) return 0;

    const a = parseHHMM(s.from);
    const b = parseHHMM(s.to);
    if (a == null || b == null) return 0;

    let diff = b - a;
    if (diff < 0) diff += 24 * 60;

    const pause = Number(s.pauseMin || 0) || 0;
    const pausePaid = !!s.pausePaid;

    return Math.max(0, diff - (pausePaid ? 0 : pause));
  }

  function dayTotals(dayObj) {
    const day = normalizeDayModel(dayObj) || dayObj;
    const shifts = Array.isArray(day?.shifts) ? day.shifts : [];

    let baseMin = 0;
    let extraMin = 0;

    for (const s of shifts) {
      const min = shiftMinutes(s);
      if (isExtraShift(s)) extraMin += min;
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
     EXPORT
  ===================================================== */
  window.NTCal = {
    pad2,
    dateKey,
    todayParts,
    isSunday,

    loadDay,
    saveDay,
    removeDay,

    loadDraft,
    saveDraft,
    removeDraft,

    dayTotals,
    startOfWeek
  };
})();