(() => {
  const { dateKey, startOfWeek, loadDay, dayTotals } = window.NTCal;

  const DAYS = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];

  let mounted = false;
  let weekStart = startOfWeek(new Date());
  let openKey = null; // tiene aperto anche dopo render

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

  // prende orari anche se in campi diversi (fallback)
  function getFromTo(s){
    const from = (s?.from ?? s?.start ?? s?.time?.from ?? s?.timeFrom ?? s?.inizio ?? "").toString();
    const to   = (s?.to   ?? s?.end   ?? s?.time?.to   ?? s?.timeTo   ?? s?.fine   ?? "").toString();
    return { from, to };
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

  function syncAnyOpenFlag(mount){
    const root = mount?.querySelector("#cviewRoot");
    const anyOpen = !!mount?.querySelector(".cviewRow.isOpen");
    root?.classList.toggle("isAnyOpen", anyOpen);
  }

  function setDetailsOpen(detailsEl, on){
    if (!detailsEl) return;

    // base stile “JS-driven”
    detailsEl.style.display = "block";
    detailsEl.style.overflow = "hidden";
    detailsEl.style.transition = "max-height .22s ease, opacity .18s ease, margin-top .18s ease, padding-top .18s ease";

    if (!on) {
      detailsEl.style.maxHeight = "0px";
      detailsEl.style.opacity = "0";
      detailsEl.style.marginTop = "0px";
      detailsEl.style.paddingTop = "0px";
      detailsEl.style.borderTopWidth = "0px";
      return;
    }

    // open
    detailsEl.style.opacity = "1";
    detailsEl.style.marginTop = "10px";
    detailsEl.style.paddingTop = "10px";
    detailsEl.style.borderTopWidth = "1px";

    // misura altezza reale dopo che è in DOM
    requestAnimationFrame(() => {
      const h = detailsEl.scrollHeight;
      detailsEl.style.maxHeight = `${Math.max(1, h)}px`;
    });
  }

  function closeAllRowsExcept(mount, keepRow){
    const grid = mount.querySelector("#cviewGrid");
    grid.querySelectorAll(".cviewRow.isOpen").forEach(r => {
      if (r !== keepRow) {
        r.classList.remove("isOpen");
        setDetailsOpen(r.querySelector(".cviewDetails"), false);
      }
    });
    syncAnyOpenFlag(mount);
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
      openKey = null;
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() - 7);
      renderWeek();
    });

    mount.querySelector("#cviewNext").addEventListener("click", (e) => {
      e.stopPropagation();
      openKey = null;
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
      renderWeek();
    });

    mount.querySelector("#cviewClose").addEventListener("click", (e) => {
      e.stopPropagation();
      openKey = null;
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
      row.setAttribute("data-no-swipe", "");

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

      // ===== DETAILS: SEMPRE se esiste shifts =====
      const shifts = Array.isArray(data?.shifts) ? data.shifts : [];
      let details = null;

      if (shifts.length) {
        details = document.createElement("div");
        details.className = "cviewDetails";
        details.setAttribute("data-no-swipe", "");

        // chiuso di base (JS-driven)
        details.style.maxHeight = "0px";
        details.style.opacity = "0";
        details.style.overflow = "hidden";
        details.style.borderTopStyle = "solid";
        details.style.borderTopColor = "rgba(255,255,255,.10)";
        details.style.borderTopWidth = "0px";
        details.style.marginTop = "0px";
        details.style.paddingTop = "0px";

        const ul = document.createElement("ul");
        ul.className = "cviewShiftList";

        // ordina usando fallback from/start/time.from
        const sorted = [...shifts].sort((a,b) =>
          timeToMin(getFromTo(a).from) - timeToMin(getFromTo(b).from)
        );

        let anyLine = false;

        sorted.forEach((s) => {
          const { from, to } = getFromTo(s);
          const meta = shiftMeta(s);

          // se è tutto vuoto, comunque stampo riga “placeholder”
          const showFrom = from && from.trim() ? from : "--:--";
          const showTo   = to && to.trim() ? to   : "--:--";

          const li = document.createElement("li");
          li.className = "cviewShiftItem";

          const dot = document.createElement("span");
          dot.className = `cviewShiftDot ${meta.dotClass}`;

          const txt = document.createElement("div");
          txt.className = "cviewShiftTxt";

          const lbl = document.createElement("span");
          lbl.className = "cviewShiftLbl";
          lbl.textContent = `${meta.label}: `;

          const t = document.createElement("span");
          t.textContent = `${showFrom} - ${showTo}`;

          txt.appendChild(lbl);
          txt.appendChild(t);

          li.appendChild(dot);
          li.appendChild(txt);
          ul.appendChild(li);
          anyLine = true;
        });

        // sicurezza: se per qualche motivo non ha creato righe, ne metto una
        if (!anyLine) {
          const li = document.createElement("li");
          li.className = "cviewShiftItem";
          li.innerHTML = `<div class="cviewShiftTxt"><span class="cviewShiftLbl">Turni:</span> nessun dettaglio disponibile</div>`;
          ul.appendChild(li);
        }

        details.appendChild(ul);
        row.appendChild(details);
      }

      row.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!details) return;

        const willOpen = !row.classList.contains("isOpen");
        closeAllRowsExcept(mount, row);
        row.classList.toggle("isOpen", willOpen);
        setDetailsOpen(details, willOpen);

        openKey = willOpen ? key : null;
        syncAnyOpenFlag(mount);

        if (willOpen) {
          setTimeout(() => row.scrollIntoView({ block: "nearest", behavior: "smooth" }), 30);
        }
      });

      // restore aperto dopo render
      if (details && openKey === key) {
        row.classList.add("isOpen");
        requestAnimationFrame(() => setDetailsOpen(details, true));
      }

      grid.appendChild(row);
    }

    syncAnyOpenFlag(mount);
  }

  document.addEventListener("nettotrack:calendarViewOpened", () => {
    mountIfNeeded();
    weekStart = startOfWeek(new Date());
    openKey = null;
    renderWeek();
  });

  document.addEventListener("nettotrack:dataChanged", () => {
    if (mounted) renderWeek();
  });
})();