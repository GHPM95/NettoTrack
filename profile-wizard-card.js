window.NTProfileWizardCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";
  const CARD_ID = "profileWizard";
  const TOTAL_STEPS = 4;

  const safe = (v) => String(v ?? "").trim();

  function readCtx() {
    try {
      return JSON.parse(sessionStorage.getItem(CTX_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function writeCtx(data) {
    try {
      sessionStorage.setItem(CTX_KEY, JSON.stringify(data || {}));
    } catch {}
  }

  function clearCtx() {
    try {
      sessionStorage.removeItem(CTX_KEY);
    } catch {}
  }

  function persist(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function avatarClass(gender) {
    return window.NTProfileCard?.avatarClass?.(gender) || "ntAvatar--gradient";
  }

  function getDraft() {
    return {
      firstName: safe(document.getElementById("ntProfileFirstName")?.value),
      lastName: safe(document.getElementById("ntProfileLastName")?.value),
      gender: safe(document.getElementById("ntProfileGender")?.value),
      birthDate: safe(document.getElementById("ntProfileBirthDate")?.value)
    };
  }

  function getInitialDraft() {
    return readCtx().profile || {};
  }

  function getStep(root) {
    const value = Number(root?.dataset?.wizardStep ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  function setStep(root, step) {
    if (!root) return;
    root.dataset.wizardStep = String(step);
  }

  function getHeaderTitle(step) {
    if (step === 0) return "Dati anagrafici";
    const ctx = readCtx();
    return ctx.mode === "edit" ? "Modifica profilo" : "Inserisci profilo";
  }

  function formatBirth(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    let out = "";
    if (digits.length > 0) out += digits.slice(0, 2);
    if (digits.length >= 3) out += "/" + digits.slice(2, 4);
    if (digits.length >= 5) out += "/" + digits.slice(4, 8);
    return out;
  }

  function validBirth(value) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value || "")) return false;

    const [dd, mm, yyyy] = value.split("/").map(Number);
    const now = new Date();

    if (yyyy > now.getFullYear()) return false;
    if (mm < 1 || mm > 12) return false;

    const dt = new Date(yyyy, mm - 1, dd);
    return (
      dt.getFullYear() === yyyy &&
      dt.getMonth() === mm - 1 &&
      dt.getDate() === dd &&
      dt <= now
    );
  }

  function allRequiredFilled(draft) {
    return !!(
      safe(draft.firstName) &&
      safe(draft.lastName) &&
      safe(draft.gender) &&
      safe(draft.birthDate)
    );
  }

  function syncDraft() {
    const d = getDraft();
    writeCtx({
      ...readCtx(),
      profile: d
    });
    updateAvatar();
    window.NTProfileCard?.refreshLive?.(d);
  }

  function updateAvatar() {
    const box = document.getElementById("ntProfileWizardAvatar");
    const gender = document.getElementById("ntProfileGender")?.value;
    if (!box) return;

    box.className = "ntProfileAvatarBox " + avatarClass(gender);
  }

  function renderProgress(step) {
    const current = step + 1;
    const pct = (current / TOTAL_STEPS) * 100;

    return `
      <div class="ntProfileWizardSubHeader">
        <div class="ntProfileWizardProgress">
          <div class="ntProfileWizardProgressBar">
            <div class="ntProfileWizardProgressFill" style="width:${pct}%"></div>
          </div>
          <div class="ntProfileWizardProgressText">${current}/${TOTAL_STEPS}</div>
        </div>
      </div>
    `;
  }

  function renderStepOne(d) {
    return `
      <div class="ntProfileWizardStep" data-step="0">
        <div class="ntProfileWizardHero">
          <div id="ntProfileWizardAvatar" class="ntProfileAvatarBox ${avatarClass(d.gender)}">
            <div class="ntProfileAvatarCalendarIcon">○</div>
          </div>

          <div class="ntProfileWizardFields">
            <label class="ntProfileWizardField">
              <span class="ntProfileWizardLabel">Nome</span>
              <input id="ntProfileFirstName" class="ntInput" value="${safe(d.firstName)}" />
            </label>

            <label class="ntProfileWizardField">
              <span class="ntProfileWizardLabel">Cognome</span>
              <input id="ntProfileLastName" class="ntInput" value="${safe(d.lastName)}" />
            </label>

            <label class="ntProfileWizardField">
              <span class="ntProfileWizardLabel">Sesso</span>
              <select id="ntProfileGender" class="ntSelect jsNtSelect">
                <option value=""></option>
                <option value="Uomo" ${d.gender === "Uomo" ? "selected" : ""}>Uomo</option>
                <option value="Donna" ${d.gender === "Donna" ? "selected" : ""}>Donna</option>
                <option value="Preferisco non specificare" ${d.gender === "Preferisco non specificare" ? "selected" : ""}>Preferisco non specificare</option>
              </select>
            </label>

            <label class="ntProfileWizardField">
              <span class="ntProfileWizardLabel">Data di nascita</span>
              <input
                id="ntProfileBirthDate"
                class="ntInput"
                inputmode="numeric"
                maxlength="10"
                placeholder="GG/MM/AAAA"
                value="${safe(d.birthDate)}"
              />
            </label>
          </div>
        </div>
      </div>
    `;
  }

  function renderPlaceholder(step) {
    return `
      <div class="ntProfileWizardStep" data-step="${step}" hidden>
        <div class="ntProfileWizardPlaceholder">
          <div class="ntProfileWizardPlaceholderTitle">Pagina ${step + 1} in preparazione</div>
        </div>
      </div>
    `;
  }

  function renderError(message) {
    return `
      <div class="ntProfileWizardErrorScreen">
        <div class="ntProfileWizardErrorBox">
          <div class="ntProfileWizardErrorTitle">Errore</div>
          <div class="ntProfileWizardErrorText">${message}</div>
          <button type="button" class="ntCardFooterBtn ntCardFooterBtn--primary" id="wizardErrorBack">
            Torna indietro
          </button>
        </div>
      </div>
    `;
  }

  function renderBody(d) {
    return `
      <div id="profileWizardForm" class="ntWizard">
        <div id="profileWizardContent" class="ntWizardContent">
          ${renderStepOne(d)}
          ${renderPlaceholder(1)}
          ${renderPlaceholder(2)}
          ${renderPlaceholder(3)}
        </div>
      </div>
    `;
  }

  function render() {
    const d = getInitialDraft();
    const step = 0;

    return window.NTCardTemplate.createCard({
      id: CARD_ID,
      title: getHeaderTitle(step),
      subHeader: renderProgress(step),
      footer: true,
      footerLeftDisabled: true,
      footerRightDisabled: false,
      footerRightLabel: "avanti",
      body: renderBody(d)
    });
  }

  function setFooterVisible(root, visible) {
    const footer = root?.querySelector(".ntCardFooter");
    if (footer) {
      footer.style.display = visible ? "" : "none";
    }
  }

  function closeWizardAutosave() {
    syncDraft();
    window.NTCards?.closeCard?.(CARD_ID);
  }

  function applyStepUi(root) {
    if (!root) return;

    const step = getStep(root);
    const title = root.querySelector(".ntCardTitle");
    const subHeader = root.querySelector(".ntCardSubHeader");
    const body = root.querySelector(".ntCardBody");
    const row = root.querySelector(".ntCardFooterRow");
    const cancel = root.querySelector(".jsNtCardCancel");
    const save = root.querySelector(".jsNtCardSave");
    const close = root.querySelector(".jsNtCardClose");

    if (title) title.textContent = getHeaderTitle(step);
    if (subHeader) subHeader.innerHTML = renderProgress(step);

    body?.querySelectorAll(".ntProfileWizardStep").forEach((el) => {
      el.hidden = Number(el.dataset.step) !== step;
    });

    setFooterVisible(root, true);

    if (row) {
      row.style.display = "grid";
      row.style.gridTemplateColumns = "1fr 1fr";
      row.style.alignItems = "center";
      row.style.gap = "12px";
    }

    if (cancel) {
      if (step === 0) {
        cancel.hidden = false;
        cancel.style.display = "";
        cancel.style.visibility = "hidden";
        cancel.disabled = true;
        cancel.textContent = "";
        cancel.setAttribute("aria-hidden", "true");
      } else {
        cancel.hidden = false;
        cancel.style.display = "";
        cancel.style.visibility = "";
        cancel.disabled = false;
        cancel.textContent = "indietro";
        cancel.removeAttribute("aria-hidden");
        cancel.onclick = () => goBack(root);
      }
    }

    if (save) {
      save.hidden = false;
      save.style.display = "";
      save.style.visibility = "";
      save.disabled = false;
      save.classList.remove("isBlocked");

      if (step < TOTAL_STEPS - 1) {
        save.textContent = "avanti";
        save.onclick = () => goNext(root);
      } else {
        save.textContent = "salva";
        save.onclick = () => finish();
      }
    }

    if (close) {
      close.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeWizardAutosave();
      };
    }
  }

  function bind(root) {
    const formRoot = root?.querySelector("#profileWizardForm");
    if (!formRoot) return;

    if (window.NTSelect?.hydrate) {
      window.NTSelect.hydrate(formRoot);
    }

    const birth = root.querySelector("#ntProfileBirthDate");
    if (birth) {
      birth.addEventListener("input", () => {
        birth.value = formatBirth(birth.value);
        syncDraft();
      });
    }

    const gender = root.querySelector("#ntProfileGender");
    if (gender) {
      gender.addEventListener("change", syncDraft);
      gender.addEventListener("input", syncDraft);
    }

    formRoot.addEventListener("input", syncDraft);
    formRoot.addEventListener("change", syncDraft);

    requestAnimationFrame(syncDraft);

    const errorBack = root.querySelector("#wizardErrorBack");
    if (errorBack) {
      errorBack.onclick = () => {
        const body = root.querySelector(".ntCardBody");
        if (!body) return;

        body.innerHTML = renderBody(readCtx().profile || {});
        bind(root);
        applyStepUi(root);
      };
    }
  }

  function goBack(root) {
    const step = Math.max(0, getStep(root) - 1);
    setStep(root, step);
    applyStepUi(root);
  }

  function goNext(root) {
    const step = getStep(root);
    const draft = getDraft();

    if (step === 0) {
      if (!allRequiredFilled(draft)) {
        const body = root?.querySelector(".ntCardBody");
        setFooterVisible(root, false);

        if (body) {
          body.innerHTML = renderError("Compila tutti i dati prima di proseguire.");
          bind(root);
        }
        return;
      }

      if (!validBirth(draft.birthDate)) {
        const body = root?.querySelector(".ntCardBody");
        setFooterVisible(root, false);

        if (body) {
          body.innerHTML = renderError("Data non valida");
          bind(root);
        }
        return;
      }
    }

    setStep(root, Math.min(TOTAL_STEPS - 1, step + 1));
    applyStepUi(root);
  }

  function finish() {
    const d = getDraft();
    persist(d);
    clearCtx();
    window.NTCards.closeCard(CARD_ID);
    window.NTProfileCard?.refreshLive?.(d);
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;
    if (window.NTCards?.state?.registry?.has?.(CARD_ID)) return;

    window.NTCards.registerCard({
      id: CARD_ID,
      render,
      onOpen() {
        const root = window.NTCards.getCardRoot(CARD_ID);
        setStep(root, 0);
        applyStepUi(root);
        bind(root);
      }
    });
  }

  return { register };
})();