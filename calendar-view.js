(() => {
  const { dateKey, startOfWeek, loadDay, dayTotals, todayParts } = window.NTCal;

  const DAYS = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];

  let mounted = false;
  let weekStart = startOfWeek(new Date());

  function getMount() {
    return document.getElementById("calViewMount");
  }

  function isActuallyMounted(mount) {
    return !!(mount && mount.querySelector("#cviewRoot"));
  }

  function mountIfNeeded() {
    const mount = getMount();
    if (!mount) return;

    // ✅ FIX: se la card è stata chiusa e rimossa, il mount nuovo è vuoto → rimonta
    if (mounted && isActuallyMounted(mount)) return;

    mount.innerHTML = `
      <div class="cviewRoot" id="cviewRoot">
        <div class="cviewHeader">
          <div class="cviewLeft">
            <button class="ntBtn" id="cviewPrev" type="button" aria-label="Settimana precedente">‹</button>
            <button class="ntBtn" id="cviewNext" type="button" aria-label="Settimana successiva">›</button>
          </div>

          <div class="cviewTitle" id="cviewTitle"></div>

          <button class="ntBtn" id="cviewClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="cviewGrid" id="cviewGrid"></div>
      </div>
    `;

    mount.querySelector("#cviewPrev").addEventListener("click", () => {
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() - 7);
      renderWeek();
    });

    mount.querySelector("#cviewNext").addEventListener("click", () => {
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
      renderWeek();
    });

    mount.querySelector("#cviewClose").addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarView"));
    });

    mounted = true;
    renderWeek();
  }

  function fmtDM(d) {
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    return `${dd}/${mm}`;
  }

  function renderWeek() {
    const mount = getMount();
    if (!mount) return;

    const title = mount.querySelector("#cviewTitle");
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    if (title) title.textContent = `${fmtDM(weekStart)} – ${fmtDM(end)}`;

    const grid = mount.querySelector("#cviewGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const { y:ty, m:tm, d:td } = todayParts();

    for (let i=0; i<7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);

      const y = day.getFullYear();
      const m = day.getMonth();
      const d = day.getDate();
      const key = dateKey(y, m, d);

      const data = loadDay(key);
      const totals = data ? dayTotals(data) : { baseHours:0, extraHours:0, hasBase:false, hasExtra:false };

      const row = document.createElement("div");
      row.className = "cviewRow" + (!data ? " isEmpty" : "");

      const head = document.createElement("div");
      head.className = "cviewRowHead";

      const left = document.createElement("div");
      left.className = "cviewLeftTxt";

      const dn = document.createElement("div");
      dn.className = "cviewDayName";
      dn.textContent = DAYS[i];

      const dd = document.createElement("div");
      dd.className = "cviewDayDate";
      dd.textContent = `${fmtDM(day)}${(y===ty && m===tm && d===td) ? " · Oggi" : ""}`;

      left.appendChild(dn);
      left.appendChild(dd);

      const badges = document.createElement("div");
      badges.className = "cviewBadges";

      if (totals.hasBase) {
        const b = document.createElement("div");
        b.className = "cviewBubble base";
        b.textContent = String(totals.baseHours);
        badges.appendChild(b);
      }
      if (totals.hasExtra) {
        const b = document.createElement("div");
        b.className = "cviewBubble extra";
        b.textContent = String(totals.extraHours);
        badges.appendChild(b);
      }

      head.appendChild(left);
      head.appendChild(badges);

      const details = document.createElement("div");
      details.className = "cviewDetails";

      if (data?.shifts?.length) {
        const parts = data.shifts.map(s => {
          const flags = [];
          if (s?.flags?.straordinario) flags.push("STR");
          if (s?.flags?.festivo) flags.push("FEST");
          if (s?.flags?.domenicale) flags.push("DOM");
          const f = flags.length ? ` (${flags.join(",")})` : "";
          return `${s.from || "--:--"}–${s.to || "--:--"}${f}`;
        });
        details.textContent = parts.join(" · ");
      }

      row.appendChild(head);
      row.appendChild(details);

      if (data) {
        row.addEventListener("click", () => {
          row.classList.toggle("isOpen");
        });
      }

      grid.appendChild(row);
    }
  }

  document.addEventListener("nettotrack:calendarViewOpened", () => {
    mountIfNeeded();
    weekStart = startOfWeek(new Date());
    renderWeek();
  });

  document.addEventListener("nettotrack:dataChanged", () => {
    if (mounted) renderWeek();
  });
})();