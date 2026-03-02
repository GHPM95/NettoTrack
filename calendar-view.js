(() => {
  const { dateKey, startOfWeek, loadDay, loadDraft, dayTotals } = window.NTCal;

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

  function toMinMaybe(t){
    if (!t || typeof t !== "string") return 9999;
    const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
    if (!m) return 9999;
    const hh = Number(m[1]), mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 9999;
    return hh * 60 + mm;
  }

  // ---- NORMALIZZA SHIFT (compat: from/to | start/end | time.from/time.to) + tags/flags
  function normShift(s){
    if (!s || typeof s !== "object") return null;

    const from = s.from ?? s.start ?? s?.time?.from ?? null;
    const to   = s.to   ?? s.end   ?? s?.time?.to   ?? null;

    return {
      raw: s,
      from: (typeof from === "string" ? from : null),
      to:   (typeof to === "string" ? to   : null),
      tags: s.tags || {},
      flags: s.flags || {},
      shiftType: s.shiftType,
      pauseMin: s.pauseMin,
      pausePaid: s.pausePaid,
      advA: s.advA,
      advB: s.advB,
      note: s.note
    };
  }

  // ---- prende turni da più possibili chiavi (compat)
  function extractShifts(dayObj){
    const a =
      (Array.isArray(dayObj?.shifts) ? dayObj.shifts : null) ||
      (Array.isArray(dayObj?.turni)  ? dayObj.turni  : null) ||
      (Array.isArray(dayObj?.items)  ? dayObj.items  : null) ||
      [];
    return a.map(normShift).filter(Boolean);
  }

  // “significativo” come il tuo insert: NON solo from/to
  function isMeaningfulShift(s){
    if (!s) return false;

    const hasTimes = !!(s.from || s.to);

    const pauseMin = Number(s.pauseMin || 0);
    const hasPause = pauseMin > 0 || !!s.pausePaid;

    const hasFascia = !!(s.shiftType && s.shiftType !== "none");

    const t = s.tags || {};
    const f = s.flags || {};
    const hasExtra = !!(
      t.overtime || t.holiday || t.sunday ||
      f.straordinario || f.festivo || f.domenicale
    );

    const hasAdv = (s.advA && s.advA !== "-") || (s.advB && s.advB !== "-");
    const hasNote = !!(s.note && String(s.note).trim().length);

    return hasTimes || hasPause || hasFascia || hasExtra || hasAdv || hasNote;
  }

  function shiftMeta(s){
    const t = s?.tags || {};
    const f = s?.flags || {};

    const stra = !!(t.overtime || f.straordinario);
    const fest = !!(t.holiday  || f.festivo);
    const dom  = !!(t.sunday   || f.domenicale);

    // Regola: se c’è domenicale (anche insieme a festivo) => Domenicale
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

      // ✅ view: prova saved, se non c’è prova draft (così non “sparisce” mai)
      const saved = loadDay(key);
      const draft = (typeof loadDraft === "function") ? loadDraft(key) : null;
      const data = saved || draft;

      const totals = data ? dayTotals(data) : { baseHours:0, extraHours:0, hasBase:false, hasExtra:false };

      const row = document.createElement("div");
      row.className = "cviewRow" + (!data ? " isEmpty" : "");
      row.setAttribute("data-no-swipe", ""); // ✅ il tuo ui.js lo rispetta

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

      if (totals.hasBase){
        const b = document.createElement("div");
        b.className = "cviewBubble base";
        b.textContent = String(totals.baseHours);
        b.setAttribute("data-no-swipe", "");
        badges.appendChild(b);
      }
      if (totals.hasExtra){
        const b = document.createElement("div");
        b.className = "cviewBubble extra";
        b.textContent = String(totals.extraHours);
        b.setAttribute("data-no-swipe", "");
        badges.appendChild(b);
      }

      head.appendChild(left);
      head.appendChild(badges);
      row.appendChild(head);

      // ===== DETAILS (solo se ci sono turni significativi) =====
      const shifts = extractShifts(data);
      const meaningful = shifts.filter(isMeaningfulShift);

      if (meaningful.length){
        const details = document.createElement("div");
        details.className = "cviewDetails";
        details.setAttribute("data-no-swipe", "");

        const ul = document.createElement("ul");
        ul.className = "cviewShiftList";

        const sorted = [...meaningful].sort((a,b) => toMinMaybe(a.from) - toMinMaybe(b.from));

        for (const s of sorted){
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

          const from = s.from || "--:--";
          const to   = s.to   || "--:--";

          const t = document.createElement("span");
          t.textContent = `${from} - ${to}`;

          txt.appendChild(lbl);
          txt.appendChild(t);

          li.appendChild(dot);
          li.appendChild(txt);
          ul.appendChild(li);
        }

        details.appendChild(ul);
        row.appendChild(details);

        // tap: apri/chiudi (una sola aperta)
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