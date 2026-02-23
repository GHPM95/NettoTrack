(() => {
  const { dateKey, todayParts, isSunday, loadDay, saveDay, removeDay, loadDraft, saveDraft, removeDraft, pad2 } = window.NTCal;

  const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const WDN = ["L","M","M","G","V","S","D"];

  let mounted = false;
  let y = todayParts().y;
  let m = todayParts().m;

  function mountIfNeeded() {
    if (mounted) return;
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    mount.innerHTML = `
      <div class="cinsRoot" id="cinsRoot">
        <div class="cinsHeader">
          <div class="cinsLeft">
            <button class="ntBtn" id="cinsPrev" type="button" aria-label="Mese precedente">‹</button>
            <button class="ntBtn" id="cinsNext" type="button" aria-label="Mese successivo">›</button>
          </div>

          <button class="cinsTitleBtn" id="cinsTitle" type="button" aria-label="Scegli mese e anno"></button>

          <button class="ntBtn" id="cinsClose" type="button" aria-label="Chiudi">×</button>
        </div>

        <div class="cinsBody">
          <div class="cinsWeekdays" id="cinsWeekdays"></div>
          <div class="cinsGrid" id="cinsGrid"></div>
        </div>

        <!-- picker overlay -->
        <div class="cinsPickerLayer" id="cinsPickerLayer" aria-hidden="true">
          <div class="cinsPickerCard" id="cinsPickerCard">
            <div class="cinsPickerTop">
              <div class="cinsPickerTitle">Seleziona mese e anno</div>
              <button class="ntBtn" id="cinsPickerClose" type="button" aria-label="Chiudi selezione">×</button>
            </div>

            <div class="cinsYearRow">
              <button class="ntBtn" id="cinsYearMinus" type="button" aria-label="Anno precedente">‹</button>
              <div class="cinsYearVal" id="cinsYearVal"></div>
              <button class="ntBtn" id="cinsYearPlus" type="button" aria-label="Anno successivo">›</button>
            </div>

            <div class="cinsMonthGrid" id="cinsMonthGrid"></div>

            <div class="cinsSwipeHint">Swipe down per chiudere</div>
          </div>
        </div>
      </div>
    `;

    // weekdays
    const wd = mount.querySelector("#cinsWeekdays");
    wd.innerHTML = WDN.map(x => `<div>${x}</div>`).join("");

    // events
    mount.querySelector("#cinsPrev").addEventListener("click", () => { stepMonth(-1); });
    mount.querySelector("#cinsNext").addEventListener("click", () => { stepMonth(+1); });
    mount.querySelector("#cinsClose").addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:closeCalendarInsert"));
    });

    mount.querySelector("#cinsTitle").addEventListener("click", () => openPicker(true));
    mount.querySelector("#cinsPickerClose").addEventListener("click", () => openPicker(false));

    mount.querySelector("#cinsYearMinus").addEventListener("click", () => { y -= 1; renderPicker(); });
    mount.querySelector("#cinsYearPlus").addEventListener("click", () => { y += 1; renderPicker(); });

    // month buttons in picker
    const monthGrid = mount.querySelector("#cinsMonthGrid");
    monthGrid.innerHTML = MONTHS.map((name, idx) => (
      `<button class="cinsPickBtn" data-m="${idx}" type="button">${name.slice(0,3)}</button>`
    )).join("");
    monthGrid.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        m = Number(b.dataset.m);
        openPicker(false);
        renderMonth();
      });
    });

    // ✅ swipe down to close picker (funziona davvero: layer + card)
    setupPickerSwipe();

    mounted = true;
    renderMonth();
  }

  function setupPickerSwipe() {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    const layer = mount.querySelector("#cinsPickerLayer");
    const card  = mount.querySelector("#cinsPickerCard");

    let down = false;
    let y0 = 0;

    const start = (clientY) => { down = true; y0 = clientY; };
    const move = (clientY) => {
      if (!down) return;
      const dy = clientY - y0;
      if (dy > 60) { down = false; openPicker(false); }
    };
    const end = () => { down = false; };

    // Pointer events
    const onPD = (e) => { start(e.clientY); (e.currentTarget).setPointerCapture?.(e.pointerId); };
    const onPM = (e) => { move(e.clientY); };
    const onPU = () => { end(); };

    [layer, card].forEach(el => {
      el.addEventListener("pointerdown", onPD, { passive:true });
      el.addEventListener("pointermove", onPM, { passive:true });
      el.addEventListener("pointerup", onPU, { passive:true });
      el.addEventListener("pointercancel", onPU, { passive:true });

      // Touch fallback (iOS safe)
      el.addEventListener("touchstart", (e) => { start(e.touches[0].clientY); }, { passive:true });
      el.addEventListener("touchmove",  (e) => { move(e.touches[0].clientY); }, { passive:true });
      el.addEventListener("touchend",   end, { passive:true });
      el.addEventListener("touchcancel",end, { passive:true });
    });

    // click fuori dalla card -> chiudi
    layer.addEventListener("click", (e) => {
      if (e.target === layer) openPicker(false);
    });
  }

  function stepMonth(delta) {
    m += delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    renderMonth();
  }

  function openPicker(on) {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    const root = mount.querySelector("#cinsRoot");
    const layer = mount.querySelector("#cinsPickerLayer");

    layer.classList.toggle("isOn", !!on);
    layer.setAttribute("aria-hidden", on ? "false" : "true");

    // ✅ quando picker aperto: nascondi header+calendar sotto (niente “pasticcio”)
    root.classList.toggle("isPicking", !!on);

    if (on) renderPicker();
  }

  function renderPicker() {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;
    mount.querySelector("#cinsYearVal").textContent = String(y);
  }

  function renderMonth() {
    const mount = document.getElementById("calInsertMount");
    if (!mount) return;

    mount.querySelector("#cinsTitle").textContent = `${MONTHS[m]} ${y}`;

    const grid = mount.querySelector("#cinsGrid");
    grid.innerHTML = "";

    const first = new Date(y, m, 1);
    const firstDay = first.getDay(); // 0 Sun..6 Sat
    const offset = (firstDay === 0 ? 6 : firstDay - 1); // Monday-based

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const { y:ty, m:tm, d:td } = todayParts();

    // 6x7 = 42 cells
    for (let i = 0; i < 42; i++) {
      const dayNum = i - offset + 1;
      const isValid = dayNum >= 1 && dayNum <= daysInMonth;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cinsDay" + (isValid ? "" : " isOff");

      if (isValid) {
        const key = dateKey(y, m, dayNum);
        const saved = loadDay(key);
        const draft = loadDraft(key);

        const isToday = (y === ty && m === tm && dayNum === td);
        if (isToday) btn.classList.add("isToday");

        const circle = document.createElement("div");
        circle.className = "cinsCircle";
        circle.textContent = String(dayNum);
        btn.appendChild(circle);

        const hasSaved = !!saved;
        const hasDraft = !!draft && !hasSaved;

        let hasBase = false;
        let hasExtra = false;

        if (saved?.shifts?.length) {
          for (const s of saved.shifts) {
            const isExtra = !!(s?.flags?.straordinario || s?.flags?.festivo || s?.flags?.domenicale);
            if (isExtra) hasExtra = true;
            else hasBase = true;
          }
        } else if (draft?.shifts?.length) {
          for (const s of draft.shifts) {
            const isExtra = !!(s?.flags?.straordinario || s?.flags?.festivo || s?.flags?.domenicale);
            if (isExtra) hasExtra = true;
            else hasBase = true;
          }
        }

        if (hasBase || hasExtra) {
          const dots = document.createElement("div");
          dots.className = "cinsDots";

          if (hasBase) {
            const d = document.createElement("div");
            d.className = "cinsDot base" + (hasDraft ? " draft" : "");
            dots.appendChild(d);
          }
          if (hasExtra) {
            const d = document.createElement("div");
            d.className = "cinsDot extra" + (hasDraft ? " draft" : "");
            dots.appendChild(d);
          }

          btn.appendChild(dots);
        }

        btn.addEventListener("click", () => {
          window.NettoTrackUI?.openDayEditor(key);
        });
      }

      grid.appendChild(btn);
    }
  }

  // --- Day Editor (turni) - NON TOCCATO
  let currentKey = null;
  let editorMounted = false;

  function mountEditorIfNeeded() {
    const mount = document.getElementById("dayEditorMount");
    if (!mount) return;

    if (!editorMounted) {
      mount.innerHTML = `
        <div class="dedRoot" id="dedRoot">
          <div class="dedHeader">
            <div class="dedTitle" id="dedTitle">Turni</div>
            <button class="ntBtn" id="dedClose" type="button" aria-label="Chiudi">×</button>
          </div>

          <div class="dedBody" id="dedBody"></div>

          <div class="dedFooter">
            <button class="dedBtnWide isDisabled" id="dedDelete" type="button">Elimina dati</button>
            <button class="dedBtnWide isDisabled" id="dedSave" type="button">Salva</button>
          </div>

          <div class="dedHint" id="dedHint"></div>
        </div>
      `;

      mount.querySelector("#dedClose").addEventListener("click", () => {
        if (!currentKey) {
          document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
          return;
        }

        const saved = loadDay(currentKey);
        const draft = loadDraft(currentKey);
        const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved || null);

        if (dirty) {
          const ok = confirm("Vuoi salvare prima di chiudere?");
          if (ok) {
            doSave();
            document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
          } else {
            removeDraft(currentKey);
            if (!saved) removeDay(currentKey);
            document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
          }
        } else {
          document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
        }
      });

      mount.querySelector("#dedSave").addEventListener("click", doSave);
      mount.querySelector("#dedDelete").addEventListener("click", () => {
        if (!currentKey) return;
        const ok = confirm("Eliminare i dati di questo giorno?");
        if (!ok) return;
        removeDraft(currentKey);
        removeDay(currentKey);
        renderMonth();
        renderEditor(currentKey);
      });

      editorMounted = true;
    }
  }

  function normalizeTime(str) {
    const s = String(str || "").trim();
    if (!s) return "";
    const digits = s.replace(/[^\d]/g, "");
    if (digits.length === 1) return `0${digits}:00`;
    if (digits.length === 2) return `${digits}:00`;
    if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`;
    if (digits.length >= 4) return `${digits.slice(0,2)}:${digits.slice(2,4)}`;

    const mm = /^(\d{1,2}):(\d{1,2})$/.exec(s);
    if (mm) return `${pad2(mm[1])}:${pad2(mm[2])}`;

    return "";
  }

  function renderEditor(key) {
    currentKey = key;
    mountEditorIfNeeded();

    const mount = document.getElementById("dayEditorMount");
    if (!mount) return;

    const saved = loadDay(key);
    const draft = loadDraft(key);
    const model = draft || saved || {
      dateKey: key,
      shifts: [
        { from:"", to:"", pauseMin:"", pausePaid:false, shiftType:"", flags:{ straordinario:false, festivo:false, domenicale:false }, note:"" }
      ],
      note: ""
    };

    const parts = key.split("-");
    mount.querySelector("#dedTitle").textContent = `Turni · ${parts[2]}/${parts[1]}/${parts[0]}`;

    const body = mount.querySelector("#dedBody");
    body.innerHTML = "";

    const noteLabel = document.createElement("label");
    noteLabel.className = "dedLabel";
    noteLabel.textContent = "Nota (opzionale)";
    body.appendChild(noteLabel);

    const note = document.createElement("textarea");
    note.className = "dedTextArea";
    note.value = model.note || "";
    note.placeholder = "Scrivi una nota…";
    note.addEventListener("input", () => {
      model.note = note.value;
      autosaveDraft(model);
    });
    body.appendChild(note);

    model.shifts = Array.isArray(model.shifts) ? model.shifts : [];

    model.shifts.forEach((shift, idx) => {
      const box = document.createElement("div");
      box.className = "dedShiftBox";

      box.innerHTML = `
        <div class="dedShiftTop">
          <div class="dedShiftName">Turno ${idx + 1}</div>
          <button class="dedSmallBtn" type="button" aria-label="Rimuovi turno">−</button>
        </div>

        <div class="dedRow2" style="margin-top:10px;">
          <div>
            <label class="dedLabel">Da (HH:MM)</label>
            <input class="dedInput" inputmode="numeric" autocomplete="off" placeholder="08:00" />
          </div>
          <div>
            <label class="dedLabel">A (HH:MM)</label>
            <input class="dedInput" inputmode="numeric" autocomplete="off" placeholder="17:00" />
          </div>
        </div>

        <div class="dedRow2" style="margin-top:10px;">
          <div>
            <label class="dedLabel">Pausa (min)</label>
            <input class="dedInput" inputmode="numeric" autocomplete="off" placeholder="0" />
          </div>
          <div>
            <label class="dedLabel">Pausa pagata</label>
            <button class="dedBtnWide" type="button" style="height:46px;">${shift.pausePaid ? "Sì" : "No"}</button>
          </div>
        </div>

        <div class="dedPillsRow">
          <label class="dedPill ${shift.shiftType==="mattino" ? "isOn":""}" data-type="mattino"><input type="checkbox">Mattino</label>
          <label class="dedPill ${shift.shiftType==="pomeriggio" ? "isOn":""}" data-type="pomeriggio"><input type="checkbox">Pomeriggio</label>
          <label class="dedPill ${shift.shiftType==="notte" ? "isOn":""}" data-type="notte"><input type="checkbox">Notte</label>
        </div>

        <div class="dedPillsRow">
          <label class="dedPill ${shift.flags?.straordinario ? "isOn":""}" data-flag="straordinario"><input type="checkbox">Straordinario</label>
          <label class="dedPill ${shift.flags?.festivo ? "isOn":""}" data-flag="festivo"><input type="checkbox">Festivo</label>
          <label class="dedPill ${shift.flags?.domenicale ? "isOn":""}" data-flag="domenicale"><input type="checkbox">Domenicale</label>
        </div>

        <label class="dedLabel">Nota turno (opzionale)</label>
        <input class="dedInput" autocomplete="off" placeholder="Nota…" />
      `;

      const rmBtn = box.querySelector(".dedSmallBtn");
      rmBtn.addEventListener("click", () => {
        if (model.shifts.length <= 1) return;
        model.shifts.splice(idx, 1);
        autosaveDraft(model);
        renderEditor(key);
      });

      const fromI = box.querySelectorAll("input.dedInput")[0];
      const toI   = box.querySelectorAll("input.dedInput")[1];
      const pauseI= box.querySelectorAll("input.dedInput")[2];
      const pausePaidBtn = box.querySelectorAll("button.dedBtnWide")[0];
      const noteI = box.querySelectorAll("input.dedInput")[3];

      fromI.value = shift.from || "";
      toI.value = shift.to || "";
      pauseI.value = shift.pauseMin || "";
      noteI.value = shift.note || "";

      fromI.addEventListener("blur", () => {
        shift.from = normalizeTime(fromI.value);
        fromI.value = shift.from;
        autosaveDraft(model);
      });
      toI.addEventListener("blur", () => {
        shift.to = normalizeTime(toI.value);
        toI.value = shift.to;
        autosaveDraft(model);
      });
      pauseI.addEventListener("input", () => {
        pauseI.value = pauseI.value.replace(/[^\d]/g, "").slice(0,3);
        shift.pauseMin = pauseI.value;
        autosaveDraft(model);
      });
      pausePaidBtn.addEventListener("click", () => {
        shift.pausePaid = !shift.pausePaid;
        pausePaidBtn.textContent = shift.pausePaid ? "Sì" : "No";
        autosaveDraft(model);
      });
      noteI.addEventListener("input", () => {
        shift.note = noteI.value;
        autosaveDraft(model);
      });

      box.querySelectorAll(".dedPillsRow")[0].querySelectorAll(".dedPill").forEach(p => {
        p.addEventListener("click", () => {
          const t = p.dataset.type;
          shift.shiftType = (shift.shiftType === t) ? "" : t;
          autosaveDraft(model);
          renderEditor(key);
        });
      });

      box.querySelectorAll(".dedPillsRow")[1].querySelectorAll(".dedPill").forEach(p => {
        p.addEventListener("click", () => {
          const f = p.dataset.flag;
          shift.flags = shift.flags || { straordinario:false, festivo:false, domenicale:false };
          shift.flags[f] = !shift.flags[f];
          autosaveDraft(model);
          renderEditor(key);
        });
      });

      const [yy, mm2, dd] = key.split("-").map(Number);
      const sunday = isSunday(yy, mm2-1, dd);
      const domPill = box.querySelector(`.dedPill[data-flag="domenicale"]`);
      if (!sunday) {
        domPill.classList.add("isDisabled");
        shift.flags = shift.flags || { straordinario:false, festivo:false, domenicale:false };
        shift.flags.domenicale = false;
      } else {
        shift.flags = shift.flags || { straordinario:false, festivo:false, domenicale:false };
        if (shift.flags.domenicale !== true && !saved && !draft) shift.flags.domenicale = true;
      }

      body.appendChild(box);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "dedBtnWide";
    addBtn.type = "button";
    addBtn.textContent = "+ Aggiungi turno";
    addBtn.style.marginTop = "10px";
    addBtn.addEventListener("click", () => {
      model.shifts.push({ from:"", to:"", pauseMin:"", pausePaid:false, shiftType:"", flags:{ straordinario:false, festivo:false, domenicale:false }, note:"" });
      autosaveDraft(model);
      renderEditor(key);
    });
    body.appendChild(addBtn);

    updateFooterState(saved, model);
    mount.querySelector("#dedHint").textContent = "";
  }

  function hasMeaningfulData(model) {
    if (!model) return false;
    if ((model.note || "").trim()) return true;
    const shifts = Array.isArray(model.shifts) ? model.shifts : [];
    return shifts.some(s => (s.from || "").trim() || (s.to || "").trim() || (String(s.pauseMin||"").trim()) || (s.note || "").trim()
      || s.shiftType
      || (s.flags && (s.flags.straordinario || s.flags.festivo || s.flags.domenicale))
    );
  }

  function autosaveDraft(model) {
    if (!currentKey) return;
    saveDraft(currentKey, model);

    const saved = loadDay(currentKey);
    updateFooterState(saved, model);

    renderMonth();
    document.dispatchEvent(new Event("nettotrack:dataChanged"));
  }

  function updateFooterState(saved, model) {
    const mount = document.getElementById("dayEditorMount");
    if (!mount) return;
    const saveBtn = mount.querySelector("#dedSave");
    const delBtn = mount.querySelector("#dedDelete");

    const meaningful = hasMeaningfulData(model);
    if (saved) delBtn.classList.remove("isDisabled");
    else delBtn.classList.add("isDisabled");

    const changed = JSON.stringify(model) !== JSON.stringify(saved || null);
    if (meaningful && changed) saveBtn.classList.remove("isDisabled");
    else saveBtn.classList.add("isDisabled");
  }

  function doSave() {
    if (!currentKey) return;

    const draft = loadDraft(currentKey);
    if (!draft) return;
    if (!draft || !draft.shifts) return;

    const meaningful = (draft.note || "").trim() || (draft.shifts || []).some(s => (s.from||"").trim() || (s.to||"").trim());
    if (!meaningful) return;

    saveDay(currentKey, draft);
    removeDraft(currentKey);

    renderMonth();
    renderEditor(currentKey);

    document.dispatchEvent(new Event("nettotrack:dataChanged"));
  }

  // --- events
  document.addEventListener("nettotrack:calendarInsertOpened", () => {
    mountIfNeeded();
    const t = todayParts();
    y = t.y; m = t.m;
    renderMonth();
    openPicker(false); // ✅ sicurezza: se riapri la card, picker parte chiuso
  });

  document.addEventListener("nettotrack:dayEditorOpened", (e) => {
    mountEditorIfNeeded();
    const key = e.detail?.dateKey;
    if (!key) return;
    renderEditor(key);
  });

  document.addEventListener("nettotrack:dataChanged", () => {
    if (mounted) renderMonth();
  });
})();