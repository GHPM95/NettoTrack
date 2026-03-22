/* ========================= NettoTrack Profile Wizard Card ========================= */
window.NTProfileWizardCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";
  const CARD_ID = "profileWizard";
  const PROFILE_CARD_ID = "profile";
  const TOTAL_STEPS = 4;

  function safeText(value) {
    return String(value ?? "").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function readStoredProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function readWizardContext() {
    try {
      const raw = sessionStorage.getItem(CTX_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeWizardContext(ctx) {
    try {
      sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx || {}));
    } catch {}
  }

  function clearWizardContext() {
    try {
      sessionStorage.removeItem(CTX_KEY);
    } catch {}
  }

  function getInitialDraft() {
    const ctx = readWizardContext();
    const stored = readStoredProfile();
    const source = ctx?.profile && typeof ctx.profile === "object" ? ctx.profile : (stored || {});

    return {
      firstName: safeText(source.firstName),
      lastName: safeText(source.lastName),
      gender: safeText(source.gender),
      birthDate: safeText(source.birthDate),
      country: safeText(source.country),
      occupation: safeText(source.occupation)
    };
  }

  function persistProfile(draft) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      firstName: safeText(draft.firstName),
      lastName: safeText(draft.lastName),
      gender: safeText(draft.gender),
      birthDate: safeText(draft.birthDate),
      country: safeText(draft.country),
      occupation: safeText(draft.occupation)
    }));
  }

  function getAvatarToneClass(gender) {
    return window.NTProfileCard?.getAvatarToneClass?.(gender) || "ntAvatar--gradient";
  }

  function getHeaderTitle(step, ctx) {
    if (step === 0) return "Dati anagrafici";
    return ctx?.mode === "edit" ? "Modifica profilo" : "Inserisci profilo";
  }

  function renderSubHeader() {
    return `
      <div class="ntProfileWizardSubHeader">
        <div class="ntProfileWizardProgress">
          <div class="ntProfileWizardProgressBar">
            <div class="ntProfileWizardProgressFill" id="ntProfileWizardProgressFill"></div>
          </div>
          <div class="ntProfileWizardProgressText" id="ntProfileWizardProgressText">1/4</div>
        </div>
      </div>
    `;
  }

  function renderStepOne(draft) {
    const avatarTone = getAvatarToneClass(draft.gender);

    return `
      <div class="ntWizardStep ntProfileWizardStep" data-step="0">
        <div class="ntProfileWizardHero">
          <div id="ntProfileWizardAvatarBox" class="ntProfileWizardAvatarBox ${avatarTone}" aria-hidden="true">
            <div class="ntProfileWizardAvatarCircle">○</div>
          </div>

          <div class="ntProfileWizardFields">
            <label class="ntProfileWizardField">
              <span class="ntProfileWizardLabel">Nome</span>
              <input
                id="ntProfileFirstName"
                class="ntInput"
                type="text"
                value="${escapeHtml(draft.firstName)}"
                placeholder=""
                autocomplete="given-name"
              />
            </label>

            <label class="ntProfileWizardField">
              <span class="ntProfileWizardLabel">Cognome</span>
              <input
                id="ntProfileLastName"
                class="ntInput"
                type="text"
                value="${escapeHtml(draft.lastName)}"
                placeholder=""
                autocomplete="family-name"
              />
            </label>

            <label class="ntProfileWizardField">
              <span class="ntProfileWizardLabel">Sesso</span>
              <select id="ntProfileGender" class="ntSelect jsNtSelect">
                <option value=""></option>
                <option value="Uomo" ${draft.gender === "Uomo" ? "selected" : ""}>Uomo</option>
                <option value="Donna" ${draft.gender === "Donna" ? "selected" : ""}>Donna</option>
                <option value="Preferisco non specificare" ${draft.gender === "Preferisco non specificare" ? "selected" : ""}>Preferisco non specificare</option>
              </select>
            </label>

            <label class="ntProfileWizardField">
              <span class="ntProfileWizardLabel">Data di nascita</span>
              <input
                id="ntProfileBirthDate"
                class="ntInput"
                type="text"
                inputmode="numeric"
                autocomplete="bday"
                maxlength="10"
                placeholder="GG/MM/AAAA"
                value="${escapeHtml(draft.birthDate)}"
              />
            </label>
          </div>
        </div>
      </div>
    `;
  }

  function renderPlaceholderStep(step, text) {
    return `
      <div class="ntWizardStep ntProfileWizardStep" data-step="${step}" hidden>
        <div class="ntProfileWizardPlaceholder">
          <div class="ntProfileWizardPlaceholderTitle">${escapeHtml(text)}</div>
        </div>
      </div>
    `;
  }

  function renderErrorState(message) {
    return `
      <div class="ntProfileWizardErrorScreen" id="ntProfileWizardErrorScreen">
        <div class="ntProfileWizardErrorBox">
          <div class="ntProfileWizardErrorTitle">Errore</div>
          <div class="ntProfileWizardErrorText">${escapeHtml(message)}</div>
          <button type="button" class="ntCardFooterBtn ntCardFooterBtn--primary" id="ntProfileWizardErrorBackBtn">
            Torna indietro
          </button>
        </div>
      </div>
    `;
  }

  function renderCard() {
    const draft = getInitialDraft();
    const ctx = readWizardContext();
    const step = Number(window.NTCardWizard?.get?.(CARD_ID)?.step || 0);

    return {
      title: getHeaderTitle(step, ctx),
      subHeader: renderSubHeader(),
      body: `
        <div class="ntWizard" id="ntProfileWizard">
          <div class="ntWizardContent" id="ntProfileWizardContent">
            ${renderStepOne(draft)}
            ${renderPlaceholderStep(1, "Pagina 2 in preparazione")}
            ${renderPlaceholderStep(2, "Pagina 3 in preparazione")}
            ${renderPlaceholderStep(3, "Pagina 4 in preparazione")}
          </div>
        </div>
      `
    };
  }

  function getDraft() {
    return {
      firstName: safeText(document.getElementById("ntProfileFirstName")?.value),
      lastName: safeText(document.getElementById("ntProfileLastName")?.value),
      gender: safeText(document.getElementById("ntProfileGender")?.value),
      birthDate: safeText(document.getElementById("ntProfileBirthDate")?.value),
      country: safeText(document.getElementById("ntProfileCountry")?.value),
      occupation: safeText(document.getElementById("ntProfileOccupation")?.value)
    };
  }

  function applyDraft({ draft }) {
    const next = draft || {};
    const map = {
      ntProfileFirstName: next.firstName,
      ntProfileLastName: next.lastName,
      ntProfileGender: next.gender,
      ntProfileBirthDate: next.birthDate,
      ntProfileCountry: next.country,
      ntProfileOccupation: next.occupation
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = safeText(value);
    });

    updateAvatarFromGender();
    window.NTProfileCard?.refreshLiveCard?.(next);
  }

  function hasChanges({ draft, committedDraft }) {
    return JSON.stringify(draft || {}) !== JSON.stringify(committedDraft || {});
  }

  function formatBirthDateInput(raw) {
    const digits = String(raw || "").replace(/\D/g, "").slice(0, 8);
    let out = "";

    if (digits.length > 0) out += digits.slice(0, 2);
    if (digits.length >= 3) out += "/" + digits.slice(2, 4);
    if (digits.length >= 5) out += "/" + digits.slice(4, 8);

    return out;
  }

  function parseBirthDate(value) {
    const clean = safeText(value);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
      return { valid: false, reason: "Inserisci la data completa nel formato GG/MM/AAAA." };
    }

    const [dd, mm, yyyy] = clean.split("/").map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();

    if (yyyy > currentYear) {
      return { valid: false, reason: "L'anno di nascita non può essere futuro." };
    }

    if (mm < 1 || mm > 12) {
      return { valid: false, reason: "Il mese inserito non è valido." };
    }

    const test = new Date(yyyy, mm - 1, dd);
    const same =
      test.getFullYear() === yyyy &&
      test.getMonth() === mm - 1 &&
      test.getDate() === dd;

    if (!same) {
      return { valid: false, reason: "La data di nascita non è valida." };
    }

    if (test > now) {
      return { valid: false, reason: "La data di nascita non può essere futura." };
    }

    return { valid: true };
  }

  function setFooterVisible(isVisible) {
    const root = window.NTCards?.getCardRoot?.(CARD_ID);
    const footer = root?.querySelector(".ntCardFooter");
    if (!footer) return;

    footer.style.display = isVisible ? "" : "none";
  }

  function showInlineError(message) {
    const content = document.getElementById("ntProfileWizardContent");
    if (!content) return;

    setFooterVisible(false);
    content.innerHTML = renderErrorState(message);

    const btn = document.getElementById("ntProfileWizardErrorBackBtn");
    if (btn) {
      btn.onclick = () => {
        const root = window.NTCards?.getCardRoot?.(CARD_ID);
        if (!root) return;

        const fresh = renderCard();
        const body = root.querySelector(".ntCardBody");
        if (body) body.innerHTML = fresh.body;

        bindMaskAndInputs();
        refreshSteps();
        setFooterVisible(true);
      };
    }
  }

  function refreshHeaderTitle() {
    const step = Number(window.NTCardWizard?.get?.(CARD_ID)?.step || 0);
    const ctx = readWizardContext();
    const titleEl = document.querySelector(`[data-card-id="${CARD_ID}"] .ntCardTitle`);
    if (titleEl) {
      titleEl.textContent = getHeaderTitle(step, ctx);
    }
  }

  function refreshProgress() {
    const wizard = window.NTCardWizard?.get?.(CARD_ID);
    const step = Number(wizard?.step || 0);
    const current = step + 1;
    const percent = `${(current / TOTAL_STEPS) * 100}%`;

    const fill = document.getElementById("ntProfileWizardProgressFill");
    const text = document.getElementById("ntProfileWizardProgressText");

    if (fill) fill.style.width = percent;
    if (text) text.textContent = `${current}/${TOTAL_STEPS}`;
  }

  function refreshFooterForStep(step) {
    const root = window.NTCards?.getCardRoot?.(CARD_ID);
    if (!root) return;

    const backBtn = root.querySelector(".jsNtCardCancel");
    const actionBtn = root.querySelector(".jsNtCardSave");

    if (!backBtn || !actionBtn) return;

    setFooterVisible(true);

    if (step === 0) {
      backBtn.style.visibility = "hidden";
      backBtn.style.pointerEvents = "none";
      backBtn.disabled = true;
      backBtn.setAttribute("aria-hidden", "true");
      backBtn.textContent = "";

      actionBtn.style.visibility = "";
      actionBtn.style.pointerEvents = "";
      actionBtn.textContent = "avanti";
      actionBtn.setAttribute("aria-label", "Avanti");
      actionBtn.setAttribute("data-nt-action", "next");
      actionBtn.disabled = false;
      actionBtn.classList.remove("isBlocked");
    } else if (step < TOTAL_STEPS - 1) {
      backBtn.style.visibility = "";
      backBtn.style.pointerEvents = "";
      backBtn.disabled = false;
      backBtn.removeAttribute("aria-hidden");
      backBtn.textContent = "indietro";
      backBtn.setAttribute("aria-label", "Indietro");
      backBtn.setAttribute("data-nt-action", "back");
      backBtn.classList.remove("isBlocked");

      actionBtn.style.visibility = "";
      actionBtn.style.pointerEvents = "";
      actionBtn.textContent = "avanti";
      actionBtn.setAttribute("aria-label", "Avanti");
      actionBtn.setAttribute("data-nt-action", "next");
      actionBtn.disabled = false;
      actionBtn.classList.remove("isBlocked");
    } else {
      backBtn.style.visibility = "";
      backBtn.style.pointerEvents = "";
      backBtn.disabled = false;
      backBtn.removeAttribute("aria-hidden");
      backBtn.textContent = "indietro";
      backBtn.setAttribute("aria-label", "Indietro");
      backBtn.setAttribute("data-nt-action", "back");
      backBtn.classList.remove("isBlocked");

      actionBtn.style.visibility = "";
      actionBtn.style.pointerEvents = "";
      actionBtn.textContent = "salva";
      actionBtn.setAttribute("aria-label", "Salva");
      actionBtn.setAttribute("data-nt-action", "save");
      actionBtn.disabled = false;
      actionBtn.classList.remove("isBlocked");
    }

    window.NTCardActions?.bindWithin?.(root);
    window.NTCardActions?.refreshButtons?.(root);
  }

  function refreshSteps() {
    const wizard = window.NTCardWizard?.get?.(CARD_ID);
    const step = Number(wizard?.step || 0);

    document.querySelectorAll("#ntProfileWizard .ntWizardStep").forEach((el) => {
      el.hidden = Number(el.dataset.step) !== step;
    });

    refreshHeaderTitle();
    refreshProgress();
    refreshFooterForStep(step);
    window.NTCards?.refreshActionState?.(CARD_ID);
  }

  function updateAvatarFromGender() {
    const avatar = document.getElementById("ntProfileWizardAvatarBox");
    const gender = document.getElementById("ntProfileGender")?.value;
    if (!avatar) return;

    avatar.classList.remove("ntAvatar--male", "ntAvatar--female", "ntAvatar--gradient");
    avatar.classList.add(getAvatarToneClass(gender));
  }

  function autosaveDraft() {
    const draft = getDraft();
    const ctx = readWizardContext() || {};

    writeWizardContext({
      ...ctx,
      profile: draft
    });

    window.NTProfileCard?.refreshLiveCard?.(draft);
  }

  function hydrateSystemSelect() {
    if (window.NTSelect?.hydrate) {
      window.NTSelect.hydrate(document.getElementById("ntProfileWizard"));
    }
  }

  function bindMaskAndInputs() {
    hydrateSystemSelect();

    const birthInput = document.getElementById("ntProfileBirthDate");
    if (birthInput) {
      birthInput.addEventListener("input", () => {
        birthInput.value = formatBirthDateInput(birthInput.value);
        autosaveDraft();
        window.NTCards?.refreshCardState?.(CARD_ID);
        window.NTCards?.refreshActionState?.(CARD_ID);
      });
    }

    const genderSelect = document.getElementById("ntProfileGender");
    if (genderSelect) {
      genderSelect.addEventListener("change", () => {
        updateAvatarFromGender();
        autosaveDraft();
        window.NTCards?.refreshCardState?.(CARD_ID);
        window.NTCards?.refreshActionState?.(CARD_ID);
      });
    }

    const root = document.getElementById("ntProfileWizard");
    if (root) {
      root.addEventListener("input", () => {
        autosaveDraft();
        window.NTCards?.refreshCardState?.(CARD_ID);
        window.NTCards?.refreshActionState?.(CARD_ID);
      });

      root.addEventListener("change", () => {
        autosaveDraft();
        window.NTCards?.refreshCardState?.(CARD_ID);
        window.NTCards?.refreshActionState?.(CARD_ID);
      });
    }

    updateAvatarFromGender();
    autosaveDraft();
  }

  function bindWizard() {
    window.NTCardWizard?.setTotal?.(CARD_ID, TOTAL_STEPS);
    window.NTCardWizard?.setStep?.(CARD_ID, 0);
    bindMaskAndInputs();
    refreshSteps();
  }

  function refreshProfileCard() {
    const cards = window.NTCards;
    if (!cards || !cards.state?.registry?.has?.(PROFILE_CARD_ID)) return;

    const isOpen = cards.isOpen?.(PROFILE_CARD_ID);
    if (isOpen) {
      cards.closeCard?.(PROFILE_CARD_ID);
      cards.openCard?.(PROFILE_CARD_ID);
    }
  }

  function canLeaveStep(step) {
    if (step !== 0) return true;

    const result = parseBirthDate(document.getElementById("ntProfileBirthDate")?.value);
    if (!result.valid) {
      showInlineError(result.reason);
      return false;
    }

    return true;
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: CARD_ID,

      render() {
        const { title, subHeader, body } = renderCard();

        return NTCardTemplate.createCard({
          id: CARD_ID,
          title,
          subHeader,
          body,
          showBack: true,
          showNext: true,
          footer: true
        });
      },

      onOpen() {
        bindWizard();
      },

      getDraft() {
        return getDraft();
      },

      applyDraft({ draft }) {
        applyDraft({ draft });
        window.NTCards?.refreshCardState?.(CARD_ID);
      },

      hasChanges({ draft, committedDraft }) {
        return hasChanges({ draft, committedDraft });
      },

      onSave({ draft }) {
        persistProfile(draft);
        clearWizardContext();
        window.NTCards?.closeCard?.(CARD_ID);
        refreshProfileCard();
      },

      onAutoSave({ draft }) {
        const ctx = readWizardContext() || {};
        writeWizardContext({
          ...ctx,
          profile: draft
        });
      },

      onCancel({ committedDraft }) {
        applyDraft({ draft: committedDraft });
      },

      onBack() {
        window.NTCardWizard?.prev?.(CARD_ID);
        refreshSteps();
      },

      onNext() {
        const step = Number(window.NTCardWizard?.get?.(CARD_ID)?.step || 0);
        if (!canLeaveStep(step)) return;

        window.NTCardWizard?.next?.(CARD_ID);
        refreshSteps();
      }
    });
  }

  return { register };
})();