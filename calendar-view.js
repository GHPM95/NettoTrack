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

  function fmtDM(d) {
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  function timeToMin(t){
    if(!t || typeof t !== "string") return 9999;
    const [hh, mm] = t.split(":").map(n => parseInt(n,10));
    if(Number.isNaN(hh) || Number.isNaN(mm)) return 9999;
    return hh * 60 + mm;
  }

  function shiftMeta(shift){
    const t = shift?.tags || {};
    const f = shift?.flags || {};

    const stra = !!(t.overtime || f.straordinario);
    const fest = !!(t.holiday  || f.festivo);
    const dom  = !!(t.sunday   || f.domenicale);

    if (dom)  return { label: "Domenicale", dotClass: "domenicale" };
    if (fest) return { label: "Festivo", dotClass: "festivo" };
    if (stra) return { label: "Straordinario", dotClass: "extra" };
    return { label: "Orario base", dotClass: "base" };
  }

  function closeAllRowsExcept(mount, keepRow){
    const grid = mount.querySelector("#cviewGrid");
    grid.querySelectorAll(".cviewRow.isOpen").forEach(r => {
      if (r !== keepRow) r.classList.remove("isOpen");
    });
  }

  function mountIfNeeded() {
    const mount = getMount();
    if (!mount) return;
    if (mounted && isActuallyMounted(mount)) return;

    mount.innerHTML = `
      <div class="cviewRoot" id="cviewRoot">
        <div class="cviewHeader">
          <div class="cviewLeft">
            <button class="ntBtn" id="cviewPrev" type="button">‹</button>
            <button class="ntBtn" id="cviewNext" type="button">›</button>
          </div>
          <div class="cviewTitle" id="cviewTitle"></div>
          <button class="ntBtn" id="cviewClose" type="button">×</button>
        </div>
        <div class="cviewGrid" id="cviewGrid"></div>
      </div>
    `;

    mount.querySelector("#cviewPrev").addEventListener("click", (e) => {
      e.stopPropagation();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart = new Date(weekStart);
      renderWeek();
    });

    mount.querySelector("#cviewNext").addEventListener("click", (e) => {
      e.stopPropagation();
      weekStart.setDate(weekStart.getDate() + 7);
      weekStart = new Date(weekStart);
      renderWeek();
    });

    mount.querySelector("#cviewClose").addEventListener("click", (e) => {
      e.stopPropagation();
      document.dispatchEvent(new Event("nettotrack:closeCalendarView"));
    });

    mounted = true;
    renderWeek();
  }

  function renderWeek() {
    const mount = getMount();
    if (!mount) return;

    const grid = mount.querySelector("#cviewGrid");
    const title = mount.querySelector("#cviewTitle");

    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    title.textContent = `${fmtDM(weekStart)} – ${fmtDM(end)}`;

    grid.innerHTML = "";

    for (let i = 0; i < 7; i++) {

      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);

      const key = dateKey(day.getFullYear(), day.getMonth(), day.getDate());
      const data = loadDay(key);
      const shifts = Array.isArray(data?.shifts) ? data.shifts : [];

      const totals = data ? dayTotals(data) :
        { baseHours:0, extraHours:0, hasBase:false, hasExtra:false };

      const row = document.createElement("div");
      row.className = "cviewRow" + (!data ? " isEmpty" : "");
      row.setAttribute("data-no-swipe", "");

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
        b.textContent = totals.baseHours;
        badges.appendChild(b);
      }

      if (totals.hasExtra) {
        const b = document.createElement("div");
        b.className = "cviewBubble extra";
        b.textContent = totals.extraHours;
        badges.appendChild(b);
      }

      head.appendChild(left);
      head.appendChild(badges);
      row.appendChild(head);

      // ===== DETAILS =====
      if (shifts.length) {

        const details = document.createElement("div");
        details.className = "cviewDetails";

        const ul = document.createElement("ul");
        ul.className = "cviewShiftList";

        const sorted = [...shifts].sort((a,b) =>
          timeToMin(a?.from ?? a?.start ?? a?.time?.from) -
          timeToMin(b?.from ?? b?.start ?? b?.time?.from)
        );

        sorted.forEach(s => {

          const li = document.createElement("li");
          li.className = "cviewShiftItem";

          const meta = shiftMeta(s);

          const dot = document.createElement("span");
          dot.className = `cviewShiftDot ${meta.dotClass}`;

          const txt = document.createElement("div");
          txt.className = "cviewShiftTxt";

          const lbl = document.createElement("span");
          lbl.className = "cviewShiftLbl";
          lbl.textContent = meta.label + ": ";

          const from = s?.from ?? s?.start ?? s?.time?.from ?? "--:--";
          const to   = s?.to   ?? s?.end   ?? s?.time?.to   ?? "--:--";

          const timeSpan = document.createElement("span");
          timeSpan.textContent = `${from} - ${to}`;

          txt.appendChild(lbl);
          txt.appendChild(timeSpan);

          li.appendChild(dot);
          li.appendChild(txt);
          ul.appendChild(li);
        });

        details.appendChild(ul);
        row.appendChild(details);

        row.addEventListener("click", (e) => {
          e.stopPropagation();
          const willOpen = !row.classList.contains("isOpen");
          closeAllRowsExcept(mount, row);
          row.classList.toggle("isOpen", willOpen);
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