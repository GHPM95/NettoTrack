(() => {
  const {
    dateKey, todayParts, isSunday,
    loadDay, loadDraft
  } = window.NTCal;

  const MONTHS = [
    "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
  ];
  const WDN = ["L","M","M","G","V","S","D"];

  let mounted = false;
  let y = todayParts().y;
  let m = todayParts().m;

  function mountIfNeeded() {
    if (mounted) return;
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    mount.innerHTML = `
      <div class="cinsRoot">
        <div class="cinsHeader">
          <div class="cinsLeft">
            <button class="ntBtn" id="cinsPrev">‹</button>
            <button class="ntBtn" id="cinsNext">›</button>
          </div>
          <button class="cinsTitleBtn" id="cinsTitle"></button>
          <button class="ntBtn" id="cinsClose">×</button>
        </div>

        <div class="cinsBody">
          <div class="cinsWeekdays" id="cinsWeekdays"></div>
          <div class="cinsGrid" id="cinsGrid"></div>
        </div>
      </div>
    `;

    mount.querySelector("#cinsWeekdays").innerHTML =
      WDN.map(d => `<div>${d}</div>`).join("");

    mount.querySelector("#cinsPrev").onclick = () => stepMonth(-1);
    mount.querySelector("#cinsNext").onclick = () => stepMonth(+1);
    mount.querySelector("#cinsClose").onclick = () =>
      document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));

    mounted = true;
    renderMonth();
  }

  function stepMonth(d) {
    m += d;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    renderMonth();
  }

  function renderMonth() {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    mount.querySelector("#cinsTitle").textContent =
      `${MONTHS[m]} ${y}`;

    const grid = mount.querySelector("#cinsGrid");
    grid.innerHTML = "";

    const first = new Date(y, m, 1);
    const offset = (first.getDay() || 7) - 1;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const t = todayParts();

    for (let i = 0; i < 42; i++) {
      const dayNum = i - offset + 1;
      const valid = dayNum >= 1 && dayNum <= daysInMonth;

      const btn = document.createElement("button");
      btn.className = "cinsDay" + (valid ? "" : " isOff");

      if (valid) {
        const key = dateKey(y, m, dayNum);
        const saved = loadDay(key);
        const draft = loadDraft(key);

        const num = document.createElement("div");
        num.className = "cinsDayNum";
        num.textContent = dayNum;
        btn.appendChild(num);

        if (y === t.y && m === t.m && dayNum === t.d) {
          btn.classList.add("isToday");
        }

        let hasBase = false, hasExtra = false;
        const src = saved || draft;
        if (src?.shifts) {
          src.shifts.forEach(s => {
            const extra =
              s?.flags?.straordinario ||
              s?.flags?.festivo ||
              s?.flags?.domenicale;
            extra ? hasExtra = true : hasBase = true;
          });
        }

        if (hasBase || hasExtra) {
          const dots = document.createElement("div");
          dots.className = "cinsDots";

          if (hasBase) dots.innerHTML += `<div class="cinsDot base"></div>`;
          if (hasExtra) dots.innerHTML += `<div class="cinsDot extra"></div>`;

          btn.appendChild(dots);
        }

        btn.onclick = () =>
          window.NettoTrackUI?.openDayEditor(key);
      }

      grid.appendChild(btn);
    }
  }

  document.addEventListener("nettotrack:calendarInsertOpened", () => {
    const t = todayParts();
    y = t.y;
    m = t.m;
    mountIfNeeded();
    renderMonth();
  });

})();
