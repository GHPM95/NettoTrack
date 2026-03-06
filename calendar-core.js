window.NTCal = (() => {
  // Parametri Default (Verranno sovrascritti dalle impostazioni dell'utente)
  const CONFIG = {
    baseHourly: 10.00,
    nightStart: 1320, // 22:00 in minuti
    nightEnd: 360,   // 06:00 in minuti
    taxRate: 0.23,    // 23% tasse stimate
    multipliers: {
      overtime: 1.25, // +25%
      holiday: 1.50,  // +50%
      night: 1.15     // +15%
    }
  };

  const parseHHMM = (s) => {
    const [h, m] = String(s).split(':').map(Number);
    return h * 60 + m;
  };

  // Funzione Magica: Calcola quanti minuti di un intervallo cadono in fascia notturna
  const calculateNightMinutes = (start, end) => {
    let nightMin = 0;
    let current = start;
    const totalDuration = end < start ? (end + 1440) - start : end - start;

    for (let i = 0; i < totalDuration; i++) {
      let minuteOfDay = (current + i) % 1440;
      // Controllo se il minuto cade tra le 22:00 e le 06:00
      if (minuteOfDay >= CONFIG.nightStart || minuteOfDay < CONFIG.nightEnd) {
        nightMin++;
      }
    }
    return nightMin;
  };

  const calculateFinance = (dayData) => {
    let gross = 0;
    let details = { baseH: 0, extraH: 0, nightH: 0 };

    dayData.shifts.forEach(shift => {
      const start = parseHHMM(shift.from);
      const end = parseHHMM(shift.to);
      if (isNaN(start) || isNaN(end)) return;

      let totalMin = end < start ? (end + 1440) - start : end - start;
      totalMin -= (shift.pausePaid ? 0 : Number(shift.pauseMin || 0));
      
      const nightMin = calculateNightMinutes(start, end);
      const dayMin = totalMin - nightMin;

      // Calcolo Moltiplicatori (Straordinario o Festivo)
      let m = 1.0;
      if (shift.tags?.overtime) m = CONFIG.multipliers.overtime;
      if (shift.tags?.holiday || shift.tags?.sunday) m = CONFIG.multipliers.holiday;

      // Somma Lorda: (Ore Diurne * Paga * M) + (Ore Notturne * Paga * M * Magg.Notte)
      const shiftGross = ((dayMin / 60) * CONFIG.baseHourly * m) + 
                         ((nightMin / 60) * CONFIG.baseHourly * m * CONFIG.multipliers.night);
      
      gross += shiftGross;
      details.baseH += (dayMin / 60);
      details.nightH += (nightMin / 60);
      if (m > 1) details.extraH += (totalMin / 60);
    });

    const net = gross * (1 - CONFIG.taxRate);
    return { gross, net, ...details };
  };

  return {
    // Esponiamo le funzioni per gli altri file
    saveDay: (key, data) => localStorage.setItem(`nt_${key}`, JSON.stringify(data)),
    loadDay: (key) => JSON.parse(localStorage.getItem(`nt_${key}`)) || { shifts: [] },
    calculateFinance,
    formatEuro: (val) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val)
  };
})();
