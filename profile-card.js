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
    const hasData = hasProfileData(profile);

    return `
      <div class="ntProfileSummaryCard">
        <div class="ntProfileHero">
          <div class="ntProfileAvatarBox" aria-hidden="true">
            <div class="ntProfileAvatarGlyph">◌</div>
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
          ${
            hasData
              ? "Consulta i dati principali del tuo profilo personale e lavorativo."
              : "Inserisci le informazioni principali per creare il tuo profilo utente."
          }
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

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "profile",

      render() {
        const profile = readProfileData();
        const actionLabel = getPrimaryActionLabel(profile);

        const body = `
          <div class="ntProfileCardRoot">
            ${renderProfileSummary(profile)}

            <div class="ntProfileActionRow">
              ${window.NTComponents?.button
                ? window.NTComponents.button({
                    label: actionLabel,
                    kind: "primary",
                    pressed: false
                  }).replace(
                    '<button class="ntBtn ntBtn-primary ">',
                    '<button type="button" class="ntBtn ntBtn-primary jsNtProfilePrimaryAction">'
                  )
                : `
                  <button
                    type="button"
                    class="ntBtn ntBtn-primary jsNtProfilePrimaryAction"
                  >
                    ${escapeHtml(actionLabel)}
                  </button>
                `
              }
            </div>
          </div>
        `;

        return NTCardTemplate.createCard({
          id: "profile",
          title: "Profilo utente",
          body,
          showBack: false,
          showNext: false,
          footer: false
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