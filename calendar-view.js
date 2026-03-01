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

  // ✅ “significativo” come insert: NON solo from/to
  function isMeaningfulShift(s){
    if(!s) return false;

    const hasTimes = !!(s.from || s.to);

    const pauseMin = Number(s.pauseMin || 0);
    const hasPause = pauseMin > 0 || !!s.pausePaid;

    const hasFascia = !!(s.shiftType && s.shiftType !== "none");

    const tags = s.tags || {};
    const flags = s.flags || {};
    const hasExtra = !!(
      tags.overtime || tags.holiday || tags.sunday ||
      flags.straordinario || flags.festivo || flags.domenicale
    );

    const hasAdv = (s.advA && s.advA !== "-") || (s.advB && s.advB !== "-");
    const hasNote = !!(s.note && String(s.note).trim().length);

    return hasTimes || hasPause || hasFascia || hasExtra || hasAdv || hasNote;
  }

  // ✅ Legge sia tags (nuovo) che flags (vecchio)
  function shiftMeta(shift){
    const t = shift?.tags || {};
    const f = shift?.flags || {};

    const stra = !!(t.overtime || f.straordinario);
    const fest = !!(t.holiday  || f.festivo);
    const dom  = !!(t.sunday   || f.domenicale);

    // Regola richiesta: se c’è domenicale (anche insieme a festivo) => Domenicale
    if (dom)  return { label: "Domenicale", dotClass: "domenicale" };
    if (fest) return { label: "Festivo", dotClass: "festivo" };
    if (stra) return { label: "Straordinario", dotClass: "extra" };
    return { label: "Orario base", dotClass: "base" };
  }

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

  function mountIfNeeded() {
    const mount = getMount();
    if (!mount) return;

    // se la slide è stata chiusa/riaperta, il mount torna vuoto: rimonta
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

      // ✅ BLOCCA SWIPE UI (il tuo ui.js lo rispetta)
      row.setAttribute("data-no-swipe", "");
      row.addEventListener("pointerdown", (e) => e.stopPropagation(), { passive:true });

      const head = document.createElement("div");
      head.className = "cviewRowHead";
      head.setAttribute("data-no-swipe", "");

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

      // ===== Details (accordion) =====
      const shifts = Array.isArray(data?.shifts) ? data.shifts : [];
      const meaningful = shifts.filter(isMeaningfulShift);

      if (meaningful.length) {
        const details = document.createElement("div");
        details.className = "cviewDetails";
        details.setAttribute("data-no-swipe", "");
        details.addEventListener("pointerdown", (e) => e.stopPropagation(), { passive:true });

        const ul = document.createElement("ul");
        ul.className = "cviewShiftList";

        const sorted = [...meaningful].sort((a,b) => timeToMin(a?.from) - timeToMin(b?.from));

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
          lbl.textContent = `${meta.label}: `;

          const from = s?.from || "--:--";
          const to   = s?.to   || "--:--";

          const t = document.createElement("span");
          t.textContent = `${from} - ${to}`;

          txt.appendChild(lbl);
          txt.appendChild(t);

          li.appendChild(dot);
          li.appendChild(txt);
          ul.appendChild(li);
        });

        details.appendChild(ul);
        row.appendChild(details);

        // click: apri/chiudi + una riga aperta alla volta
        row.addEventListener("click", (e) => {
          e.stopPropagation();

          const willOpen = !row.classList.contains("isOpen");
          closeAllRowsExcept(mount, row);
          row.classList.toggle("isOpen", willOpen);
          syncAnyOpenFlag(mount);

          if (willOpen) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
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