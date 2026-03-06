window.NTCal = (() => {
  // CONFIGURAZIONE CONTABILE (Default)
  const CONFIG = {
    baseHourly: 10.00,
    nightStart: 1320, // 22:00 in minuti
    nightEnd: 360,    // 06:00 in minuti
    taxRate: 0.23,    // 23% tasse stimate
    multipliers: {
      overtime: 1.25,
      holiday: 1.50,
      night: 1.15
    }
  };

  // Trasforma "HH:MM" in minuti totali dall'inizio del giorno
  const parseHHMM = (s) => {
    if (!s) return null;
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };

  // L'algoritmo che seziona il turno per trovare le ore notturne
  const getNightMinutes = (start, end) => {
    let nightMin = 0;
    const isOvernight = end < start;
    const totalMin = isOvernight ? (end + 1440) - start : end - start;

    for (let i = 0; i < totalMin; i++) {
      let currentMinute = (start + i) % 1440;
      if (currentMinute >= CONFIG.nightStart || currentMinute < CONFIG.nightEnd) {
        nightMin++;
      }
    }
    return nightMin;
  };

  const calculateFinance = (dayData) => {
    let totalGross = 0;
    let stats = { baseH: 0, nightH: 0, extraH: 0 };

    if (!dayData || !dayData.shifts) return { gross: 0, net: 0, ...stats };

    dayData.shifts.forEach(shift => {
      const start = parseHHMM(shift.from);
      const end = parseHHMM(shift.to);
      if (start === null || end === null) return;

      let totalMin = end < start ? (end + 1440) - start : end - start;
      const pause = Number(shift.pauseMin || 0);
      totalMin = Math.max(0, totalMin - (shift.pausePaid ? 0 : pause));

      const nightMin = getNightMinutes(start, end);
      const dayMin = Math.max(0, totalMin - nightMin);

      // Gestione Maggiorazioni (Straordinario/Festivo)
      let m = 1.0;
      if (shift.tags?.overtime) m = CONFIG.multipliers.overtime;
      if (shift.tags?.holiday || shift.tags?.sunday) m = CONFIG.multipliers.holiday;

      // Calcolo economico del singolo turno
      const shiftGross = ((dayMin / 60) * CONFIG.baseHourly * m) + 
                         ((nightMin / 60) * CONFIG.baseHourly * m * CONFIG.multipliers.night);
      
      totalGross += shiftGross;
      stats.baseH += (dayMin / 60);
      stats.nightH += (nightMin / 60);
      if (m > 1) stats.extraH += (totalMin / 60);
    });

    return {
      gross: totalGross,
      net: totalGross * (1 - CONFIG.taxRate),
      ...stats
    };
  };

  return {
    calculateFinance,
    saveDay: (key, data) => localStorage.setItem(`nt_${key}`, JSON.stringify(data)),
    loadDay: (key) => JSON.parse(localStorage.getItem(`nt_${key}`)) || { shifts: [] }
  };
})();
