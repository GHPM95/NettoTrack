/* ========================= NettoTrack Profile Card ========================= */
window.NTProfileCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";

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

  function readProfileData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;

      return {
        firstName: safeText(parsed.firstName),
        lastName: safeText(parsed.lastName),
        gender: safeText(parsed.gender),
        birthDate: safeText(parsed.birthDate),
        country: safeText(parsed.country),
        occupation: safeText(parsed.occupation)
      };
    } catch {
      return null;
    }
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

  function getPrimaryActionLabel(profile = readProfileData()) {
    return hasProfileData(profile) ? "Modifica i dati" : "Inserisci i dati";
  }

  function openProfileWizard() {
    if (window.NTCards?.openCard && window.NTCards.state?.registry?.has?.("profileWizard")) {
      window.NTCards.openCard("profileWizard");
      return;
    }

    document.dispatchEvent(new CustomEvent("nt:open-profile-wizard", {
      detail: {
        sourceCard: "profile",
        mode: hasProfileData() ? "edit" : "create"
      }
    }));
  }

  function renderProfileBody(profile = readProfileData()) {
    const helper = hasProfileData(profile)
      ? "Consulta le informazioni principali del tuo profilo utente."
      : "Inserisci le informazioni principali per creare il tuo profilo utente.";

    return `
      <div class="ntProfileContent">
        <div class="ntProfileHero">
          <div class="ntProfileAvatarBox" aria-hidden="true">
            <div class="ntProfileAvatarCalendarIcon">○</div>
          </div>

          <div class="ntProfileMainInfo">
            ${renderRow("Nome", profile?.firstName)}
            ${renderRow("Cognome", profile?.lastName)}
            ${renderRow("Sesso", profile?.gender)}
            ${renderRow("Data di nascita", profile?.birthDate)}
            ${renderRow("Paese", profile?.country)}
            ${renderRow("Occupazione", profile?.occupation)}
          </div>
        </div>

        <p class="ntProfileHelperText">${escapeHtml(helper)}</p>
      </div>
    `;
  }

  function renderRow(label, value) {
    return `
      <div class="ntProfileRow">
        <span class="ntProfileLabel">${escapeHtml(label)}:</span>
        <span class="ntProfileValue">${escapeHtml(formatValue(value))}</span>
      </div>
    `;
  }

  function bindProfileCard(root) {
    if (!root) return;

    const primaryBtn = root.querySelector(".jsNtProfilePrimaryAction");
    if (primaryBtn) {
      primaryBtn.addEventListener("click", () => {
        openProfileWizard();
      });
    }
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "profile",

      render() {
        const profile = readProfileData();
        const actionLabel = getPrimaryActionLabel(profile);

        return NTCardTemplate.createCard({
          id: "profile",
          title: "Profilo utente",
          body: renderProfileBody(profile),
          showBack: false,
          showNext: false,
          footer: true,

          footerLeftLabel: actionLabel,
          footerLeftClass: "ntCardFooterBtn ntCardFooterBtn--primary jsNtProfilePrimaryAction",
          footerLeftAction: "profile-primary",
          footerLeftDisabled: false,

          footerRightLabel: "",
          footerRightClass: "ntProfileFooterGhost",
          footerRightAction: "noop",
          footerRightDisabled: true
        });
      },

      onOpen() {
        const root = window.NTCards?.getCardRoot?.("profile");
        bindProfileCard(root);
      }
    });
  }

  return {
    register,
    readProfileData,
    hasProfileData,
    openProfileWizard
  };
})();