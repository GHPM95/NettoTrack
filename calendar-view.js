(() => {
  const { dateKey, startOfWeek, loadDay, loadDraft, dayTotals } = window.NTCal;

  const DAYS = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];

  let mounted = false;
  let weekStart = startOfWeek(new Date());

  function getMount() {
    return document.getElementById("calViewMount");
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

  function mountIfNeeded() {
    const mount = getMount();
    if (!mount) return;
    if (mounted && mount.querySelector("#cviewRoot")) return;

    mount.innerHTML = `
      <div class="cviewRoot" id="cviewRoot">
        <div class="cviewHeader">
          <div class="cviewLeft">
            <button class="ntBtn" id="cviewPrev">‹</button>
            <button class="ntBtn" id="cviewNext">›</button>
          </div>
          <div class="cviewTitle" id="cviewTitle"></div>
          <button class="ntBtn" id="cviewClose">×</button>
        </div>
        <div class="cviewGrid" id="cviewGrid"></div>
      </div>
    `;

    mount.querySelector("#cviewPrev").onclick = () => {
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart = new Date(weekStart);
      renderWeek();
    };

    mount.querySelector("#cviewNext").onclick = () => {
      weekStart.setDate(weekStart.getDate() + 7);
      weekStart = new Date(weekStart);
      renderWeek();
    };

    mount.querySelector("#cviewClose").onclick = () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarView"));
    };

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

      // 🔥 prova saved, altrimenti draft
      let data = loadDay(key);
      if (!data) data = loadDraft?.(key);

      console.log("VIEW DEBUG:", key, data);

      const shifts = Array.isArray(data?.shifts) ? data.shifts : [];

      const totals = data ? dayTotals(data) :
        { baseHours:0, extraHours:0, hasBase:false, hasExtra:false };

      const row = document.createElement("div");
      row.className = "cviewRow";

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

          const from = s?.from ?? s?.start ?? s?.time?.from ?? "--:--";
          const to   = s?.to   ?? s?.end   ?? s?.time?.to   ?? "--:--";

          txt.innerHTML = `<span class="cviewShiftLbl">${meta.label}:</span> ${from} - ${to}`;

          li.appendChild(dot);
          li.appendChild(txt);
          ul.appendChild(li);
        });

        details.appendChild(ul);
        row.appendChild(details);

        row.onclick = () => {
          row.classList.toggle("isOpen");
        };
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