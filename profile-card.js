/* ========================= NettoTrack Profile Card ========================= */
window.NTProfileCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";
  const WIZARD_CARD_ID = "profileWizard";

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

  function readStoredProfileData() {
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

  function readProfileData() {
    const ctx = readWizardContext();
    const live = ctx?.profile && typeof ctx.profile === "object" ? ctx.profile : null;
    const stored = readStoredProfileData();

    const source = live || stored;
    if (!source) return null;

    return {
      firstName: safeText(source.firstName),
      lastName: safeText(source.lastName),
      gender: safeText(source.gender),
      birthDate: safeText(source.birthDate),
      country: safeText(source.country),
      occupation: safeText(source.occupation)
    };
  }

  function hasProfileData(profile = readProfileData()) {
    if (!profile) return false;

    return [
      profile.firstName,
      profile.lastName,
      profile.gender,
      profile.birthDate,
      profile.country,
      profile.occupation
    ].some(Boolean);
  }

  function formatValue(value, fallback = "—") {
    return safeText(value) || fallback;
  }

  function getPrimaryActionLabel(profile = readStoredProfileData()) {
    return hasProfileData(profile) ? "Modifica i dati" : "Inserisci i dati";
  }

  function getWizardMode(profile = readStoredProfileData()) {
    return hasProfileData(profile) ? "edit" : "create";
  }

  function getAvatarToneClass(gender) {
    if (gender === "Uomo") return "ntAvatar--male";
    if (gender === "Donna") return "ntAvatar--female";
    return "ntAvatar--gradient";
  }

  function writeWizardContext(context) {
    try {
      sessionStorage.setItem(CTX_KEY, JSON.stringify(context || {}));
    } catch {}
  }

  function openProfileWizard() {
    const profile = readProfileData();
    const mode = getWizardMode(profile);

    writeWizardContext({
      mode,
      sourceCard: "profile",
      profile
    });

    if (window.NTCards?.state?.registry?.has?.(WIZARD_CARD_ID)) {
      window.NTCards.openCard(WIZARD_CARD_ID);
      return;
    }

    document.dispatchEvent(
      new CustomEvent("nt:open-profile-wizard", {
        detail: {
          mode,
          sourceCard: "profile",
          profile
        }
      })
    );
  }

  function renderRow(key, label, value) {
    return `
      <div class="ntProfileRow">
        <span class="ntProfileLabel">${escapeHtml(label)}:</span>
        <span class="ntProfileValue" data-nt-profile-value="${escapeHtml(key)}">${escapeHtml(formatValue(value))}</span>
      </div>
    `;
  }

  function renderProfileBody(profile = readProfileData()) {
    const helper = hasProfileData(profile)
      ? "Consulta i dati del tuo profilo."
      : "Inserisci i dati per creare il tuo profilo.";

    const avatarTone = getAvatarToneClass(profile?.gender);

    return `
      <div class="ntProfileContent">
        <div class="ntProfileHero">
          <div class="ntProfileAvatarBox ${avatarTone}" data-nt-profile-avatar aria-hidden="true">
            <div class="ntProfileAvatarCalendarIcon">○</div>
          </div>

          <div class="ntProfileMainInfo">
            ${renderRow("firstName", "Nome", profile?.firstName)}
            ${renderRow("lastName", "Cognome", profile?.lastName)}
            ${renderRow("gender", "Sesso", profile?.gender)}
            ${renderRow("birthDate", "Data di nascita", profile?.birthDate)}
          </div>
        </div>

        <p class="ntProfileHelperText" data-nt-profile-helper>${escapeHtml(helper)}</p>
      </div>
    `;
  }

  function applyFooterState(root) {
    if (!root) return;

    const cancelBtn = root.querySelector(".jsNtCardCancel");
    const saveBtn = root.querySelector(".jsNtCardSave");

    if (cancelBtn) {
      cancelBtn.style.visibility = "hidden";
      cancelBtn.style.pointerEvents = "none";
      cancelBtn.disabled = true;
      cancelBtn.setAttribute("aria-hidden", "true");
      cancelBtn.textContent = "";
    }

    if (saveBtn) {
      const label = getPrimaryActionLabel(readStoredProfileData());

      saveBtn.style.visibility = "";
      saveBtn.style.pointerEvents = "";
      saveBtn.disabled = false;
      saveBtn.textContent = label;
      saveBtn.setAttribute("aria-label", label);
      saveBtn.setAttribute("data-nt-action", "profile-primary");
      saveBtn.classList.add("jsNtProfilePrimaryAction");
      saveBtn.classList.remove("isBlocked");
    }

    window.NTCardActions?.bindWithin?.(root);
    window.NTCardActions?.refreshButtons?.(root);
  }

  function refreshLiveCard(nextProfile = readProfileData()) {
    const root = window.NTCards?.getCardRoot?.("profile");
    if (!root || !nextProfile) return;

    const avatar = root.querySelector("[data-nt-profile-avatar]");
    if (avatar) {
      avatar.classList.remove("ntAvatar--male", "ntAvatar--female", "ntAvatar--gradient");
      avatar.classList.add(getAvatarToneClass(nextProfile.gender));
    }

    const map = {
      firstName: formatValue(nextProfile.firstName),
      lastName: formatValue(nextProfile.lastName),
      gender: formatValue(nextProfile.gender),
      birthDate: formatValue(nextProfile.birthDate)
    };

    Object.entries(map).forEach(([key, value]) => {
      const el = root.querySelector(`[data-nt-profile-value="${key}"]`);
      if (el) el.textContent = value;
    });

    const helper = root.querySelector("[data-nt-profile-helper]");
    if (helper) {
      helper.textContent = hasProfileData(nextProfile)
        ? "Consulta i dati del tuo profilo."
        : "Inserisci i dati per creare il tuo profilo.";
    }

    applyFooterState(root);
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "profile",

      render() {
        return NTCardTemplate.createCard({
          id: "profile",
          title: "Profilo utente",
          body: renderProfileBody(),
          showBack: false,
          showNext: false,
          footer: true
        });
      },

      onOpen() {
        const root = window.NTCards?.getCardRoot?.("profile");
        applyFooterState(root);
        refreshLiveCard(readProfileData());
      }
    });
  }

  return {
    register,
    readProfileData,
    hasProfileData,
    openProfileWizard,
    getAvatarToneClass,
    refreshLiveCard
  };
})();