(() => {
  const pad2 = (n) => String(n).padStart(2, "0");

  function dateKey(y, mZeroBased, d) {
    return `${y}-${pad2(mZeroBased + 1)}-${pad2(d)}`; // YYYY-MM-DD
  }

  function todayParts() {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
  }

  function isSunday(y, m, d) {
    return new Date(y, m, d).getDay() === 0;
  }

  // --- storage: la chiave principale È il dateKey
  function loadDay(dateKeyStr) {
    try {
      const raw = localStorage.getItem(dateKeyStr);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function saveDay(dateKeyStr, obj) {
    localStorage.setItem(dateKeyStr, JSON.stringify(obj));
  }

  function removeDay(dateKeyStr) {
    localStorage.removeItem(dateKeyStr);
  }

  // draft separato
  function draftKey(dateKeyStr) { return `_draft_${dateKeyStr}`; }

  function loadDraft(dateKeyStr) {
    try {
      const raw = localStorage.getItem(draftKey(dateKeyStr));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function saveDraft(dateKeyStr, obj) {
    localStorage.setItem(draftKey(dateKeyStr), JSON.stringify(obj));
  }

  function removeDraft(dateKeyStr) {
    localStorage.removeItem(draftKey(dateKeyStr));
  }

  // --- calcolo ore per view
  function parseHHMM(s) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
    if (!m) return null;
    const hh = Number(m[1]), mm = Number(m[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  function minutesToHours(min) {
    return Math.round((min / 60) * 10) / 10; // 1 decimale
  }

  function shiftMinutes(shift) {
    const a = parseHHMM(shift?.from);
    const b = parseHHMM(shift?.to);
    if (a == null || b == null) return 0;

    let diff = b - a;
    if (diff < 0) diff += 24 * 60; // overnight

    const pause = Number(shift?.pauseMin || 0) || 0;
    const pausePaid = !!shift?.pausePaid;
    const pauseDeduct = pausePaid ? 0 : pause;

    return Math.max(0, diff - pauseDeduct);
  }

  function dayTotals(dayObj) {
    const shifts = Array.isArray(dayObj?.shifts) ? dayObj.shifts : [];
    let baseMin = 0;
    let extraMin = 0;

    for (const s of shifts) {
      const min = shiftMinutes(s);
      const isExtra = !!(s?.flags?.straordinario || s?.flags?.festivo || s?.flags?.domenicale);
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

  // start of week (Mon)
  function startOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0 Sun ... 6 Sat
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  }

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
