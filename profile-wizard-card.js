/* ========================= NettoTrack Profile Wizard Card ========================= */
window.NTProfileWizardCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";
  const CARD_ID = "profileWizard";
  const PROFILE_CARD_ID = "profile";

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

    const source = ctx?.profile && typeof ctx.profile === "object"
      ? ctx.profile
      : (stored || {});

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

  function renderStepOne(draft) {
    return `
      <div class="ntWizardStep" data-step="0">
        <div class="ntSection">
          <label class="ntField">
            <span class="ntFieldLabel">Nome</span>
            <input id="ntProfileFirstName" class="ntInput" type="text" value="${escapeHtml(draft.firstName)}" placeholder="Nome" />
          </label>

          <label class="ntField">
            <span class="ntFieldLabel">Cognome</span>
            <input id="ntProfileLastName" class="ntInput" type="text" value="${escapeHtml(draft.lastName)}" placeholder="Cognome" />
          </label>

          <label class="ntField">
            <span class="ntFieldLabel">Sesso</span>
            <input id="ntProfileGender" class="ntInput" type="text" value="${escapeHtml(draft.gender)}" placeholder="Sesso" />
          </label>
        </div>
      </div>
    `;
  }

  function renderStepTwo(draft) {
    return `
      <div class="ntWizardStep" data-step="1" hidden>
        <div class="ntSection">
          <label class="ntField">
            <span class="ntFieldLabel">Data di nascita</span>
            <input id="ntProfileBirthDate" class="ntInput" type="text" value="${escapeHtml(draft.birthDate)}" placeholder="GG/MM/AAAA" />
          </label>

          <label class="ntField">
            <span class="ntFieldLabel">Paese</span>
            <input id="ntProfileCountry" class="ntInput" type="text" value="${escapeHtml(draft.country)}" placeholder="Paese" />
          </label>

          <label class="ntField">
            <span class="ntFieldLabel">Occupazione</span>
            <input id="ntProfileOccupation" class="ntInput" type="text" value="${escapeHtml(draft.occupation)}" placeholder="Occupazione" />
          </label>
        </div>
      </div>
    `;
  }

  function renderCard() {
    const draft = getInitialDraft();
    const ctx = readWizardContext();
    const title = ctx?.mode === "edit" ? "Modifica profilo" : "Inserisci profilo";

    return {
      title,
      body: `
        <div class="ntWizard" id="ntProfileWizard">
          <div class="ntWizardContent" id="ntProfileWizardContent">
            ${renderStepOne(draft)}
            ${renderStepTwo(draft)}
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
  }

  function hasChanges({ draft, committedDraft }) {
    return JSON.stringify(draft || {}) !== JSON.stringify(committedDraft || {});
  }

  function refreshWizardStep() {
    const wizard = window.NTCardWizard?.get?.(CARD_ID);
    const step = Number(wizard?.step || 0);

    document.querySelectorAll("#ntProfileWizard .ntWizardStep").forEach((el) => {
      const isCurrent = Number(el.dataset.step) === step;
      el.hidden = !isCurrent;
    });

    window.NTCards?.refreshActionState?.(CARD_ID);
  }

  function bindWizard() {
    window.NTCardWizard?.setTotal?.(CARD_ID, 2);
    window.NTCardWizard?.setStep?.(CARD_ID, 0);
    refreshWizardStep();

    const root = document.getElementById("ntProfileWizard");
    if (!root) return;

    root.addEventListener("input", () => {
      window.NTCards?.refreshCardState?.(CARD_ID);
      window.NTCards?.refreshActionState?.(CARD_ID);
    });
  }

  function refreshProfileCard() {
    const cards = window.NTCards;
    if (!cards) return;

    const isOpen = cards.isOpen?.(PROFILE_CARD_ID);

    if (isOpen) {
      cards.closeCard?.(PROFILE_CARD_ID);
      cards.openCard?.(PROFILE_CARD_ID);
    }
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: CARD_ID,

      render() {
        const { title, body } = renderCard();

        return NTCardTemplate.createCard({
          id: CARD_ID,
          title,
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
        refreshWizardStep();
      },

      onNext() {
        window.NTCardWizard?.next?.(CARD_ID);
        refreshWizardStep();
      }
    });
  }

  return {
    register
  };
})();