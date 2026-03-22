/* ========================= NettoTrack Profile Card ========================= */
window.NTProfileCard = (() => {
  const PROFILE_STORAGE_KEY = "ntUserProfileData";

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
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
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

  function renderProfileSummary(profile = readProfileData()) {
    return `
      <div class="ntProfileContent">
        <div class="ntProfileHero">
          <div class="ntProfileAvatarBox" aria-hidden="true">
            <div class="ntProfileAvatarCalendarIcon">
              ○
            </div>
          </div>

          <div class="ntProfileMainInfo">
            <div class="ntProfileRow">
              <span class="ntProfileLabel">Nome:</span>
              <span class="ntProfileValue">${escapeHtml(formatValue(profile?.firstName))}</span>
            </div>

            <div class="ntProfileRow">
              <span class="ntProfileLabel">Cognome:</span>
              <span class="ntProfileValue">${escapeHtml(formatValue(profile?.lastName))}</span>
            </div>

            <div class="ntProfileRow">
              <span class="ntProfileLabel">Sesso:</span>
              <span class="ntProfileValue">${escapeHtml(formatValue(profile?.gender))}</span>
            </div>

            <div class="ntProfileRow">
              <span class="ntProfileLabel">Data di nascita:</span>
              <span class="ntProfileValue">${escapeHtml(formatValue(profile?.birthDate))}</span>
            </div>

            <div class="ntProfileRow">
              <span class="ntProfileLabel">Paese:</span>
              <span class="ntProfileValue">${escapeHtml(formatValue(profile?.country))}</span>
            </div>

            <div class="ntProfileRow">
              <span class="ntProfileLabel">Occupazione:</span>
              <span class="ntProfileValue">${escapeHtml(formatValue(profile?.occupation))}</span>
            </div>
          </div>
        </div>

        <p class="ntProfileHelperText">
          ${hasProfileData(profile)
            ? "Consulta i dati principali del tuo profilo personale e lavorativo."
            : "Inserisci le informazioni principali per creare il tuo profilo utente."}
        </p>
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

  function buildFooterButton(label) {
    return `
      <button
        type="button"
        class="ntCardFooterBtn ntCardFooterBtn--primary jsNtProfilePrimaryAction"
        aria-label="${escapeHtml(label)}"
      >
        ${escapeHtml(label)}
      </button>
    `;
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "profile",

      render() {
        const profile = readProfileData();
        const actionLabel = getPrimaryActionLabel(profile);

        const body = renderProfileSummary(profile);

        const html = NTCardTemplate.createCard({
          id: "profile",
          title: "Profilo utente",
          body,
          showBack: false,
          showNext: false,
          footer: true
        });

        return html
          .replace(
            /<button[\s\S]*?jsNtCardCancel[\s\S]*?<\/button>/,
            buildFooterButton(actionLabel)
          )
          .replace(
            /<button[\s\S]*?jsNtCardSave[\s\S]*?<\/button>/,
            `<span class="ntProfileFooterGhost" aria-hidden="true"></span>`
          );
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