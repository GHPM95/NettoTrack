(() => {
  const {
    loadDay, saveDay, removeDay,
    loadDraft, saveDraft, removeDraft,
    isSunday
  } = window.NTCal;

  let currentKey = null;
  let mounted = false;

  function mountIfNeeded() {
    if (mounted) return;

    const mount = document.getElementById("dayEditorMount");
    if (!mount) return;

    mount.innerHTML = `
      <div class="dedRoot">
        <div class="dedHeader">
          <div class="dedTitle" id="dedTitle">Turni</div>
          <button class="ntBtn" id="dedClose">×</button>
        </div>

        <div class="dedBody" id="dedBody"></div>

        <div class="dedFooter">
          <button class="dedBtnWide isDisabled" id="dedDelete">Elimina dati</button>
          <button class="dedBtnWide isDisabled" id="dedSave">Salva</button>
        </div>

        <div class="dedHint" id="dedHint"></div>
      </div>
    `;

    mount.querySelector("#dedClose").onclick = tryClose;
    mount.querySelector("#dedSave").onclick = save;
    mount.querySelector("#dedDelete").onclick = del;

    mounted = true;
  }

  function tryClose() {
    if (!currentKey) {
      document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
      return;
    }

    const saved = loadDay(currentKey);
    const draft = loadDraft(currentKey);

    const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

    if (dirty && confirm("Vuoi salvare prima di chiudere?")) {
      save();
    } else {
      removeDraft(currentKey);
    }

    document.dispatchEvent(new Event("nettotrack:closeDayEditor"));
  }

  function del() {
    if (!currentKey) return;
    if (!confirm("Eliminare i dati di questo giorno?")) return;

    removeDraft(currentKey);
    removeDay(currentKey);
    render(currentKey);
  }

  function save() {
    const draft = loadDraft(currentKey);
    if (!draft) return;

    saveDay(currentKey, draft);
    removeDraft(currentKey);
    render(currentKey);
  }

  function render(key) {
    currentKey = key;
    mountIfNeeded();

    const mount = document.getElementById("dayEditorMount");
    if (!mount) return;

    const saved = loadDay(key);
    const draft = loadDraft(key);
    const model = draft || saved || {
      shifts: [
        {
          from:"",
          to:"",
          pauseMin:"",
          pausePaid:false,
          flags:{ straordinario:false, festivo:false, domenicale:false },
          note:""
        }
      ],
      note:""
    };

    const body = mount.querySelector("#dedBody");
    body.innerHTML = "";

    model.shifts.forEach((shift, idx) => {
      const box = document.createElement("div");
      box.className = "dedShiftBox";
      box.innerHTML = `
        <div class="dedShiftTop">
          <div class="dedShiftName">Turno ${idx+1}</div>
          <button class="dedSmallBtn">−</button>
        </div>
      `;

      const rm = box.querySelector("button");
      rm.onclick = () => {
        if (model.shifts.length > 1) {
          model.shifts.splice(idx,1);
          saveDraft(key, model);
          render(key);
        }
      };

      body.appendChild(box);
    });

    updateFooter(saved, model);
  }

  function updateFooter(saved, model) {
    const mount = document.getElementById("dayEditorMount");
    if (!mount) return;

    const saveBtn = mount.querySelector("#dedSave");
    const delBtn = mount.querySelector("#dedDelete");

    const changed = JSON.stringify(model) !== JSON.stringify(saved);

    changed ? saveBtn.classList.remove("isDisabled")
            : saveBtn.classList.add("isDisabled");

    saved ? delBtn.classList.remove("isDisabled")
          : delBtn.classList.add("isDisabled");
  }

  document.addEventListener("nettotrack:dayEditorOpened", e => {
    if (!e.detail?.dateKey) return;
    render(e.detail.dateKey);
  });

})();
