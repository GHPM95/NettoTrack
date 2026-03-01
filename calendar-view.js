(() => {
  const { dateKey, startOfWeek, loadDay, dayTotals } = window.NTCal;

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
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  function timeToMin(t){
    if(!t || typeof t !== "string") return 9999;
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return 9999;
    const hh = parseInt(m[1],10);
    const mm = parseInt(m[2],10);
    if(Number.isNaN(hh) || Number.isNaN(mm)) return 9999;
    return hh * 60 + mm;
  }

  function shiftMeta(flags){
    const f = flags || {};
    const stra = !!f.straordinario;
    const fest = !!f.festivo;
    const dom  = !!f.domenicale;

    // Regola: se festivo + domenicale => scrivi (domenicale)
    if (dom) return { label: "Domenicale", dotClass: "domenicale" };
    if (fest) return { label: "Festivo", dotClass: "festivo" };
    if (stra) return { label: "Straordinario", dotClass: "extra" };
    return { label: "Orario base", dotClass: "base" };
  }

  function closeAllRowsExcept(grid, keepRow){
    grid.querySelectorAll(".cviewRow.isOpen").forEach(r => {
      if (r !== keepRow) r.classList.remove("isOpen");
    });
  }

  function bindOpen(row, head, grid){
    const toggle = () => {
      const willOpen = !row.classList.contains("isOpen");
      closeAllRowsExcept(grid, row);
      row.classList.toggle("isOpen", willOpen);
    };

    // iOS-friendly: pointerdown prima, click come fallback
    head.addEventListener("pointerdown", (e) => { e.preventDefault(); toggle(); }, { passive:false });
    head.addEventListener("click", (e) => { e.preventDefault(); toggle(); });

    // anche tastiera (se mai userai)
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
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
      row.setAttribute("role","button");
      row.setAttribute("tabindex","0");

      const head = document.createElement("div");
      head.className = "cviewRowHead";

      const left = document.createElement("div");
      left.className = "cviewLeftTxt";

      const dn = document.createElement("div");
      dn.className = "cviewDayName";
      dn.textContent = DAYS[i];

      const dd = document.createElement("div");
      dd.className = "cviewDayDate";
      dd.textContent = fmtDM(day);

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

      // ✅ IMPORTANT: badges non devono “mangiarsi” il tap
      badges.addEventListener("pointerdown", (e) => e.stopPropagation(), { passive:true });
      badges.addEventListener("click", (e) => e.stopPropagation());

      head.appendChild(left);
      head.appendChild(badges);
      row.appendChild(head);

      // ===== Details (accordion) =====
      const shiftsArr = (data && Array.isArray(data.shifts)) ? data.shifts : [];
      const hasShifts = shiftsArr.length > 0;

      if (hasShifts) {
        const details = document.createElement("div");
        details.className = "cviewDetails";

        const ul = document.createElement("ul");
        ul.className = "cviewShiftList";

        const sorted = [...shiftsArr].sort((a,b) => timeToMin(a?.from) - timeToMin(b?.from));

        sorted.forEach(s => {
          const li = document.createElement("li");
          li.className = "cviewShiftItem";

          const meta = shiftMeta(s?.flags);

          const dot = document.createElement("span");
          dot.className = `cviewShiftDot ${meta.dotClass}`;

          const txt = document.createElement("div");
          txt.className = "cviewShiftTxt";

          const lbl = document.createElement("span");
          lbl.className = "cviewShiftLbl";
          lbl.textContent = `(${meta.label})`;

          const from = s?.from || "--:--";
          const to   = s?.to   || "--:--";

          const t = document.createElement("span");
          t.textContent = `: ${from} - ${to}`;

          txt.appendChild(lbl);
          txt.appendChild(t);

          li.appendChild(dot);
          li.appendChild(txt);
          ul.appendChild(li);
        });

        details.appendChild(ul);
        row.appendChild(details);

        // ✅ bind tap SOLO sulla head (zona affidabile) ma con una sola riga aperta
        bindOpen(row, head, grid);
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