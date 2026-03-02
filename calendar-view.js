/* calendar-view.js — Weekly Agenda (accordion dettagli turni) */
(() => {
  const { dateKey, startOfWeek, loadDay, dayTotals } = window.NTCal;

  const DAYS = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];

  let mounted = false;
  let weekStart = startOfWeek(new Date());

  function getMount(){ return document.getElementById("calViewMount"); }
  function isActuallyMounted(mount){ return !!(mount && mount.querySelector("#cviewRoot")); }

  function fmtDM(d){
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

  // --- leggi orari anche se schema cambia
  function getFrom(s){
    return (s?.from ?? s?.start ?? s?.time?.from ?? s?.timeFrom ?? s?.da ?? s?.inizio ?? "");
  }
  function getTo(s){
    return (s?.to ?? s?.end ?? s?.time?.to ?? s?.timeTo ?? s?.a ?? s?.fine ?? "");
  }

  // ✅ “significativo” come insert (non solo from/to)
  function isMeaningfulShift(s){
    if(!s || typeof s !== "object") return false;

    const from = getFrom(s);
    const to   = getTo(s);

    const hasTimes = !!(from || to);

    const pauseMin = Number(s?.pauseMin ?? s?.pause ?? 0);
    const hasPause = (Number.isFinite(pauseMin) && pauseMin > 0) || !!s?.pausePaid;

    const st = s?.shiftType;
    const hasFascia = !!(st && st !== "none");

    const tags = s?.tags || {};
    const flags = s?.flags || {};
    const hasExtra = !!(
      tags.overtime || tags.holiday || tags.sunday ||
      flags.straordinario || flags.festivo || flags.domenicale
    );

    const hasAdv = (s?.advA && s.advA !== "-") || (s?.advB && s.advB !== "-");
    const hasNote = !!(s?.note && String(s.note).trim().length);

    return hasTimes || hasPause || hasFascia || hasExtra || hasAdv || hasNote;
  }

  // ✅ label + dot class (regola: domenicale vince su festivo)
  function shiftMeta(s){
    const t = s?.tags || {};
    const f = s?.flags || {};

    const stra = !!(t.overtime || f.straordinario);
    const fest = !!(t.holiday  || f.festivo);
    const dom  = !!(t.sunday   || f.domenicale);

    if (dom)  return { label: "Domenicale", dotClass: "domenicale" };
    if (fest) return { label: "Festivo", dotClass: "festivo" };
    if (stra) return { label: "Straordinario", dotClass: "extra" };
    return { label: "Orario base", dotClass: "base" };
  }

  // --- UX: abilita scroll solo quando una riga è aperta (usa il tuo CSS .isAnyOpen)
  function syncAnyOpenFlag(mount){
    const root = mount?.querySelector("#cviewRoot");
    const anyOpen = !!mount?.querySelector(".cviewRow.isOpen");
    root?.classList.toggle("isAnyOpen", anyOpen);
  }

  function closeAllRowsExcept(mount, keepRow){
    const grid = mount.querySelector("#cviewGrid");
    grid.querySelectorAll(".cviewRow.isOpen").forEach(r => {
      if (r !== keepRow) r.classList.remove("isOpen");
    });
    syncAnyOpenFlag(mount);
  }

  function mountIfNeeded(){
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

  function renderWeek(){
    const mount = getMount();
    if (!mount) return;

    const title = mount.querySelector("#cviewTitle");
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    if (title) title.textContent = `${fmtDM(weekStart)} – ${fmtDM(end)}`;

    const grid = mount.querySelector("#cviewGrid");
    if (!grid) return;
    grid.innerHTML = "";

    for (let i=0; i<7; i++){
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);

      const key = dateKey(day.getFullYear(), day.getMonth(), day.getDate());
      const data = loadDay(key);

      const totals = data ? dayTotals(data) : { baseHours:0, extraHours:0, hasBase:false, hasExtra:false };

      const row = document.createElement("div");
      row.className = "cviewRow" + (!data ? " isEmpty" : "");
      row.setAttribute("data-no-swipe",""); // il tuo ui.js rispetta [data-no-swipe]

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

      if (totals.hasBase){
        const b = document.createElement("div");
        b.className = "cviewBubble base";
        b.textContent = String(totals.baseHours);
        badges.appendChild(b);
      }
      if (totals.hasExtra){
        const b = document.createElement("div");
        b.className = "cviewBubble extra";
        b.textContent = String(totals.extraHours);
        badges.appendChild(b);
      }

      head.appendChild(left);
      head.appendChild(badges);
      row.appendChild(head);

      // ===== DETAILS (accordion) =====
      const shifts = Array.isArray(data?.shifts) ? data.shifts : [];
      const meaningful = shifts.filter(isMeaningfulShift);

      // Creiamo details se: ci sono turni significativi
      if (meaningful.length){
        const details = document.createElement("div");
        details.className = "cviewDetails";

        const ul = document.createElement("ul");
        ul.className = "cviewShiftList";

        const sorted = [...meaningful].sort((a,b) => timeToMin(getFrom(a)) - timeToMin(getFrom(b)));

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

          const from = getFrom(s) || "--:--";
          const to   = getTo(s)   || "--:--";

          const t = document.createElement("span");
          t.textContent = `${from} - ${to}`;

          txt.appendChild(lbl);
          txt.appendChild(t);

          li.appendChild(dot);
          li.appendChild(txt);
          ul.appendChild(li);
        });

        // safety: se per qualche motivo ul è vuota, non lascia “vuoto”
        if (!ul.children.length){
          const li = document.createElement("li");
          li.className = "cviewShiftItem";
          li.innerHTML = `<div class="cviewShiftTxt">Nessun dettaglio turno trovato.</div>`;
          ul.appendChild(li);
        }

        details.appendChild(ul);
        row.appendChild(details);

        // tap: apri/chiudi (una aperta alla volta)
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