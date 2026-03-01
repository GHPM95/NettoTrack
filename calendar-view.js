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

    mount.querySelector("#cviewPrev").addEventListener("click", (e) => {
      e.stopPropagation();
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() - 7);
      renderWeek();
    });

    mount.querySelector("#cviewNext").addEventListener("click", (e) => {
      e.stopPropagation();
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
      renderWeek();
    });

    mount.querySelector("#cviewClose").addEventListener("click", (e) => {
      e.stopPropagation();
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

  // ---------- TIME HELPERS ----------
  function pad2(n){ return String(n).padStart(2,"0"); }

  function minToTime(min){
    if (typeof min !== "number" || !Number.isFinite(min)) return null;
    const hh = Math.floor(min / 60);
    const mm = Math.round(min % 60);
    if (hh < 0 || hh > 48) return null;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  function normalizeTime(v){
    if (v == null) return null;

    // numero => minuti
    if (typeof v === "number") return minToTime(v);

    // stringa tipo "7:0" / "07:00"
    if (typeof v === "string"){
      const s = v.trim();
      if (!s) return null;

      // HH:MM
      const m = s.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
      if (m){
        const hh = parseInt(m[1],10);
        const mm = parseInt(m[2],10);
        if (Number.isFinite(hh) && Number.isFinite(mm)) return `${pad2(hh)}:${pad2(mm)}`;
      }

      // "420" (minuti) come stringa
      if (/^\d+$/.test(s)){
        const n = parseInt(s,10);
        return minToTime(n);
      }

      return s; // fallback
    }

    return null;
  }

  function timeToMin(t){
    const nt = normalizeTime(t);
    if(!nt || typeof nt !== "string") return 9999;
    const parts = nt.split(":");
    if (parts.length !== 2) return 9999;
    const hh = parseInt(parts[0],10);
    const mm = parseInt(parts[1],10);
    if(Number.isNaN(hh) || Number.isNaN(mm)) return 9999;
    return hh * 60 + mm;
  }

  // Legge from/to anche se nel tuo storage si chiamano in altri modi
  function getFromTo(s){
    const from =
      s?.from ?? s?.start ?? s?.in ?? s?.startTime ?? s?.fromTime ?? s?.timeFrom ?? s?.da;
    const to =
      s?.to   ?? s?.end   ?? s?.out ?? s?.endTime   ?? s?.toTime   ?? s?.timeTo   ?? s?.a;

    const nf = normalizeTime(from);
    const nt = normalizeTime(to);

    return { from: nf, to: nt };
  }

  // ---------- META (tags/flags) ----------
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

  // ---------- UX open/close ----------
  function syncAnyOpenFlag(mount){
    const root = mount?.querySelector("#cviewRoot");
    const anyOpen = !!mount?.querySelector(".cviewRow.isOpen");
    root?.classList.toggle("isAnyOpen", anyOpen);
  }

  function closeAllRowsExcept(mount, keepRow){
    const grid = mount.querySelector("#cviewGrid");
    const open = grid.querySelectorAll(".cviewRow.isOpen");
    open.forEach(r => { if (r !== keepRow) r.classList.remove("isOpen"); });
    syncAnyOpenFlag(mount);
  }

  // ---------- RENDER ----------
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

      const key = dateKey(day.getFullYear(), day.getMonth(), day.getDate());
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

      head.appendChild(left);
      head.appendChild(badges);
      row.appendChild(head);

      // ===== Details =====
      const shifts = Array.isArray(data?.shifts) ? data.shifts : [];

      // prendi solo turni “con qualcosa”, non per forza from/to perfetti
      const meaningful = shifts
        .map(s => {
          const { from, to } = getFromTo(s);
          return { s, from, to };
        })
        .filter(x => !!(x.from || x.to));

      if (meaningful.length) {
        const details = document.createElement("div");
        details.className = "cviewDetails";

        const ul = document.createElement("ul");
        ul.className = "cviewShiftList";

        const sorted = [...meaningful].sort((a,b) => timeToMin(a.from) - timeToMin(b.from));

        sorted.forEach(({ s, from, to }) => {
          const li = document.createElement("li");
          li.className = "cviewShiftItem";

          const meta = shiftMeta(s);

          const dot = document.createElement("span");
          dot.className = `cviewShiftDot ${meta.dotClass}`;

          const txt = document.createElement("div");
          txt.className = "cviewShiftTxt";

          const lbl = document.createElement("span");
          lbl.className = "cviewShiftLbl";
          lbl.textContent = `${meta.label}: `;

          const t = document.createElement("span");
          t.textContent = `${from || "--:--"} - ${to || "--:--"}`;

          txt.appendChild(lbl);
          txt.appendChild(t);

          li.appendChild(dot);
          li.appendChild(txt);
          ul.appendChild(li);
        });

        details.appendChild(ul);
        row.appendChild(details);

        row.addEventListener("click", () => {
          const willOpen = !row.classList.contains("isOpen");
          closeAllRowsExcept(mount, row);
          row.classList.toggle("isOpen", willOpen);
          syncAnyOpenFlag(mount);
        });
      }

      grid.appendChild(row);
    }

    syncAnyOpenFlag(mount);
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