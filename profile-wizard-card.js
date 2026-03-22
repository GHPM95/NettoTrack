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
      birthDate: safe(document.getElementById("ntProfileBirthDate")?.value),
      country: safe(document.getElementById("ntProfileCountry")?.value),
      occupation: safe(document.getElementById("ntProfileOccupation")?.value)
    };
  }

  function getInitialDraft() {
    const ctx = readCtx();
    return ctx.profile || {};
  }

  function getStep() {
    const root = window.NTCards?.getCardRoot?.(CARD_ID);
    const value = Number(root?.dataset?.wizardStep ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  function setStep(step) {
    const root = window.NTCards?.getCardRoot?.(CARD_ID);
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
      <div id="profileWizard" class="ntWizard">
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

    return NTCardTemplate.createCard({
      id: CARD_ID,
      title: getHeaderTitle(step),
      subHeader: renderProgress(step),
      footer: true,
      body: renderBody(d)
    });
  }

  function applyStepUi(root) {
    if (!root) return;

    const step = getStep();
    const title = root.querySelector(".ntCardTitle");
    const subHeader = root.querySelector(".ntCardSubHeader");
    const body = root.querySelector(".ntCardBody");
    const footer = root.querySelector(".ntCardFooter");
    const row = root.querySelector(".ntCardFooterRow");
    const cancel = root.querySelector(".jsNtCardCancel");
    const save = root.querySelector(".jsNtCardSave");

    if (title) title.textContent = getHeaderTitle(step);
    if (subHeader) subHeader.innerHTML = renderProgress(step);

    body?.querySelectorAll(".ntProfileWizardStep").forEach((el) => {
      el.hidden = Number(el.dataset.step) !== step;
    });

    if (footer) footer.style.display = "";
    if (row) {
      row.classList.add("ntFooterSingleRight");
    }

    if (cancel) {
      if (step === 0) {
        cancel.hidden = true;
        cancel.style.display = "none";
        cancel.disabled = true;
        cancel.textContent = "";
        cancel.setAttribute("aria-hidden", "true");
      } else {
        cancel.hidden = false;
        cancel.style.display = "";
        cancel.disabled = false;
        cancel.textContent = "indietro";
        cancel.onclick = () => goBack();
      }
    }

    if (save) {
      save.hidden = false;
      save.style.display = "";
      save.disabled = false;
      save.classList.remove("isBlocked");

      if (step < TOTAL_STEPS - 1) {
        save.textContent = "avanti";
        save.onclick = () => goNext();
      } else {
        save.textContent = "salva";
        save.onclick = () => finish();
      }
    }
  }

  function bind(root) {
    const formRoot = document.getElementById("profileWizard");
    if (!formRoot) return;

    if (window.NTSelect?.hydrate) {
      window.NTSelect.hydrate(formRoot);
    }

    const birth = document.getElementById("ntProfileBirthDate");
    if (birth) {
      birth.addEventListener("input", () => {
        birth.value = formatBirth(birth.value);
        syncDraft();
      });
    }

    const gender = document.getElementById("ntProfileGender");
    if (gender) {
      gender.addEventListener("change", syncDraft);
      gender.addEventListener("input", syncDraft);
    }

    formRoot.addEventListener("input", syncDraft);
    formRoot.addEventListener("change", syncDraft);

    requestAnimationFrame(syncDraft);

    const errorBack = document.getElementById("wizardErrorBack");
    if (errorBack) {
      errorBack.onclick = () => {
        const body = root?.querySelector(".ntCardBody");
        const footer = root?.querySelector(".ntCardFooter");
        if (!body) return;

        body.innerHTML = renderBody(readCtx().profile || {});
        if (footer) footer.style.display = "";
        bind(root);
        applyStepUi(root);
      };
    }
  }

  function goBack() {
    const root = window.NTCards?.getCardRoot?.(CARD_ID);
    const step = Math.max(0, getStep() - 1);
    setStep(step);
    applyStepUi(root);
  }

  function goNext() {
    const root = window.NTCards?.getCardRoot?.(CARD_ID);
    const step = getStep();

    if (step === 0 && !validBirth(getDraft().birthDate)) {
      const footer = root?.querySelector(".ntCardFooter");
      const body = root?.querySelector(".ntCardBody");

      if (footer) footer.style.display = "none";
      if (body) {
        body.innerHTML = renderError("Data non valida");
        bind(root);
      }
      return;
    }

    setStep(Math.min(TOTAL_STEPS - 1, step + 1));
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

    NTCards.registerCard({
      id: CARD_ID,
      render,
      onOpen() {
        const root = NTCards.getCardRoot(CARD_ID);
        setStep(0);
        applyStepUi(root);
        bind(root);
      }
    });
  }

  return { register };
})();