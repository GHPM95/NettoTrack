(() => {
  const {
    loadDay, saveDay, removeDay,
    loadDraft, saveDraft, removeDraft,
    isSunday
  } = window.NTCal;

  let currentKey = null;
  let mounted = false;

  function isActuallyMounted(mount){
    return !!(mount && mount.querySelector('.dedRoot'));
  }

  function mountIfNeeded() {
    const mount = document.getElementById('dayEditorMount');
    if (!mount) return;

    // ✅ FIX: se la card è stata chiusa (slide rimossa) il mount nuovo è vuoto → rimonta
    if (mounted && isActuallyMounted(mount)) return;

    mount.innerHTML = `
      <div class="dedRoot">
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
      document.dispatchEvent(new Event("nettotrack:dataChanged"));
      renderEditor(currentKey);
    });

    mounted = true;
  }

  function hasMeaningfulData(model) {
    if (!model) return false;
    if ((model.note || "").trim()) return true;

    const shifts = Array.isArray(model.shifts) ? model.shifts : [];
    return shifts.some(s =>
      (s.from || "").trim() ||
      (s.to || "").trim() ||
      (String(s.pauseMin || "").trim()) ||
      (s.note || "").trim() ||
      s.shiftType ||
      (s.flags && (s.flags.straordinario || s.flags.festivo || s.flags.domenicale))
    );
  }

  function updateFooterState(saved, model) {
    const mount = document.getElementById("dayEditorMount");
    if (!mount) return;

    const saveBtn = mount.querySelector("#dedSave");
    const delBtn = mount.querySelector("#dedDelete");

    const meaningful = hasMeaningfulData(model);
    const changed = JSON.stringify(model) !== JSON.stringify(saved || null);

    if (saved) delBtn.classList.remove("isDisabled");
    else delBtn.classList.add("isDisabled");

    if (meaningful && changed) saveBtn.classList.remove("isDisabled");
    else saveBtn.classList.add("isDisabled");
  }

  function autosaveDraft(model) {
    if (!currentKey) return;

    saveDraft(currentKey, model);
    const saved = loadDay(currentKey);
    updateFooterState(saved, model);

    document.dispatchEvent(new Event("nettotrack:dataChanged"));
  }

  function normalizeTime(str) {
    const s = String(str || "").trim();
    if (!s) return "";

    const digits = s.replace(/[^\d]/g, "");
    if (digits.length === 1) return `0${digits}:00`;
    if (digits.length === 2) return `${digits}:00`;
    if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`;
    if (digits.length >= 4) return `${digits.slice(0,2)}:${digits.slice(2,4)}`;

    const m = /^(\d{1,2}):(\d{1,2})$/.exec(s);
    if (m) {
      const hh = String(m[1]).padStart(2, "0");
      const mm = String(m[2]).padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return "";
  }

  function renderEditor(key) {
    currentKey = key;
    mountIfNeeded();

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

      const [yy, mm, dd] = key.split("-").map(Number);
      const sunday = isSunday(yy, mm-1, dd);
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

  function doSave() {
    if (!currentKey) return;

    const draft = loadDraft(currentKey);
    if (!draft || !draft.shifts) return;

    const meaningful =
      (draft.note || "").trim() ||
      (draft.shifts || []).some(s => (s.from||"").trim() || (s.to||"").trim());

    if (!meaningful) return;

    saveDay(currentKey, draft);
    removeDraft(currentKey);

    renderEditor(currentKey);
    document.dispatchEvent(new Event("nettotrack:dataChanged"));
  }

  document.addEventListener("nettotrack:dayEditorOpened", (e) => {
    const key = e.detail?.dateKey;
    if (!key) return;
    renderEditor(key);
  });
})();