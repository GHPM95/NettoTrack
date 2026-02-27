/* calendar-core.js
   Core condiviso NettoTrack (dateKey, storage turni, draft, helpers)
   - Allinea le chiavi storage con day-editor.js:
     nettotrack:turni:YYYY-MM-DD
   - Fornisce NTCal.loadDay/loadDraft usati da calendar-insert.js
   - Fornisce NettoTrackCalendarCore.getDayData/setDayData usati da day-editor.js
   - Emana evento "nettotrack:dataChanged" quando cambia qualcosa
*/
(() => {
  const DAY_PREFIX   = "nettotrack:turni:";        // ✅ CHIAVE SALVATAGGIO DEFINITIVA
  const DRAFT_PREFIX = "nettotrack:turni:draft:";  // bozza (se ti serve)

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function pad2(n) {
    n = String(n ?? "");
    return n.length === 1 ? "0" + n : n;
  }

  // y=2026, m=0..11, d=1..31 -> "YYYY-MM-DD"
  function dateKey(y, m, d) {
    return `${String(y)}-${pad2(m + 1)}-${pad2(d)}`;
  }

  function todayParts() {
    const dt = new Date();
    return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
  }

  function isSunday(y, m, d) {
    try {
      const dt = new Date(y, m, d);
      return dt.getDay() === 0;
    } catch {
      return false;
    }
  }

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  function emitDataChanged() {
    try {
      document.dispatchEvent(new Event("nettotrack:dataChanged"));
    } catch (_) {}
  }

  // ---- Model helpers (compatibilità: tags o flags) ----
  function hasMeaningfulDayData(model) {
    if (!model || !Array.isArray(model.shifts) || model.shifts.length === 0) return false;

    return model.shifts.some((s) => {
      const hasTimes = !!(s?.from || s?.to);
      const hasPause = Number(s?.pauseMin || 0) > 0 || !!s?.pausePaid;
      const hasFascia = !!(s?.shiftType && s.shiftType !== "none");

      const tags = s?.tags || {};
      const flags = s?.flags || {}; // vecchia compatibilità
      const hasExtra =
        !!(tags.overtime || tags.holiday || tags.sunday) ||
        !!(flags.straordinario || flags.festivo || flags.domenicale);

      const hasAdv = (s?.advA && s.advA !== "-") || (s?.advB && s.advB !== "-");
      const hasNote = !!(s?.note && String(s.note).trim().length);

      return hasTimes || hasPause || hasFascia || hasExtra || hasAdv || hasNote;
    });
  }

  // ---- Storage: Day ----
  function storageKeyDay(key) {
    return DAY_PREFIX + key;
  }

  // Backward compat: se per sbaglio esiste un vecchio salvataggio senza prefisso, lo migro
  function migrateLegacyIfNeeded(key) {
    try {
      const pref = storageKeyDay(key);
      if (localStorage.getItem(pref)) return;

      const legacy = localStorage.getItem(key);
      if (!legacy) return;

      localStorage.setItem(pref, legacy);
      // opzionale: pulisco legacy
      // localStorage.removeItem(key);
    } catch (_) {}
  }

  function loadDay(key) {
    migrateLegacyIfNeeded(key);
    try {
      const raw = localStorage.getItem(storageKeyDay(key));
      if (!raw) return null;
      const obj = safeParse(raw);
      return (obj && typeof obj === "object") ? obj : null;
    } catch (_) {
      return null;
    }
  }

  function saveDay(key, data) {
    try {
      localStorage.setItem(storageKeyDay(key), JSON.stringify(data ?? {}));
    } catch (_) {}
    emitDataChanged();
  }

  function removeDay(key) {
    try {
      localStorage.removeItem(storageKeyDay(key));
    } catch (_) {}
    emitDataChanged();
  }

  // ---- Storage: Draft ----
  function storageKeyDraft(key) {
    return DRAFT_PREFIX + key;
  }

  function loadDraft(key) {
    try {
      const raw = localStorage.getItem(storageKeyDraft(key));
      if (!raw) return null;
      const obj = safeParse(raw);
      return (obj && typeof obj === "object") ? obj : null;
    } catch (_) {
      return null;
    }
  }

  function saveDraft(key, data) {
    try {
      localStorage.setItem(storageKeyDraft(key), JSON.stringify(data ?? {}));
    } catch (_) {}
    emitDataChanged();
  }

  function removeDraft(key) {
    try {
      localStorage.removeItem(storageKeyDraft(key));
    } catch (_) {}
    emitDataChanged();
  }

  // ---- API per day-editor (compatibilità con il tuo codice) ----
  const NettoTrackCalendarCore = {
    getDayData: (key) => loadDay(key),
    setDayData: (key, data) => saveDay(key, data),
    removeDayData: (key) => removeDay(key),

    getDraftData: (key) => loadDraft(key),
    setDraftData: (key, data) => saveDraft(key, data),
    removeDraftData: (key) => removeDraft(key),

    hasMeaningfulDayData
  };

  // ---- API per calendar-insert (il tuo file fa destructuring da window.NTCal) ----
  const NTCal = {
    dateKey,
    todayParts,
    isSunday,

    loadDay,
    saveDay,
    removeDay,

    loadDraft,
    saveDraft,
    removeDraft,

    hasMeaningfulDayData
  };

  window.NettoTrackCalendarCore = NettoTrackCalendarCore;
  window.NTCal = NTCal;
})();