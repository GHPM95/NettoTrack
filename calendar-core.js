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
     ⚠️ IMPORTANTISSIMO:
     Day Editor salva con prefix "nettotrack:turni:".
     Qui facciamo compatibilità: leggiamo/scriviamo sia prefix che key “nuda”.
  ===================================================== */
  const DAY_PREFIX = "nettotrack:turni:";

  function keyWithPrefix(dateKeyStr) {
    const k = String(dateKeyStr || "");
    if (!k) return "";
    return k.startsWith(DAY_PREFIX) ? k : (DAY_PREFIX + k);
  }

  function loadDay(dateKeyStr) {
    const k1 = keyWithPrefix(dateKeyStr);
    const k2 = String(dateKeyStr || "");

    // 1) prova la chiave “nuova” (prefix)
    try {
      const raw = localStorage.getItem(k1);
      if (raw) return JSON.parse(raw);
    } catch {}

    // 2) fallback: chiave vecchia “nuda”
    try {
      const raw = localStorage.getItem(k2);
      if (raw) return JSON.parse(raw);
    } catch {}

    return null;
  }

  function saveDay(dateKeyStr, obj) {
    const k1 = keyWithPrefix(dateKeyStr);
    const k2 = String(dateKeyStr || "");
    const raw = (() => { try { return JSON.stringify(obj); } catch { return ""; } })();
    if (!raw) return;

    // scrivo su prefix (standard)
    try { localStorage.setItem(k1, raw); } catch {}

    // compatibilità: scrivo anche su chiave nuda (se ti dava fastidio, dimmelo e lo togliamo)
    try { localStorage.setItem(k2, raw); } catch {}
  }

  function removeDay(dateKeyStr) {
    const k1 = keyWithPrefix(dateKeyStr);
    const k2 = String(dateKeyStr || "");
    try { localStorage.removeItem(k1); } catch {}
    try { localStorage.removeItem(k2); } catch {}
  }

  /* =====================================================
     DRAFT (MODIFICHE NON SALVATE)
     (lo teniamo compatibile con il tuo codice attuale)
  ===================================================== */
  function draftKey(dateKeyStr) {
    // mantengo lo schema che avevi già
    return `_draft_${String(dateKeyStr || "")}`;
  }

  function loadDraft(dateKeyStr) {
    try {
      const raw = localStorage.getItem(draftKey(dateKeyStr));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveDraft(dateKeyStr, obj) {
    try {
      localStorage.setItem(draftKey(dateKeyStr), JSON.stringify(obj));
    } catch {}
  }

  function removeDraft(dateKeyStr) {
    try {
      localStorage.removeItem(draftKey(dateKeyStr));
    } catch {}
  }

  /* =====================================================
     TIME / ORE
     (aggiornato: riconosce sia "tags" (nuovo) che "flags" (vecchio))
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

  function isExtraShift(s) {
    // nuovo schema (Day Editor): tags
    const t = s?.tags;
    if (t && (t.overtime || t.holiday || t.sunday)) return true;

    // vecchio schema: flags
    const f = s?.flags;
    if (f && (f.straordinario || f.festivo || f.domenicale)) return true;

    return false;
  }

  function dayTotals(dayObj) {
    const shifts = Array.isArray(dayObj?.shifts) ? dayObj.shifts : [];
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
     EXPORT GLOBALE
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