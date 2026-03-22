window.NTProfileCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  }

  function hasData(data = read()) {
    if (!data) return false;
    return Object.values(data).some(v => String(v || "").trim() !== "");
  }

  function label() {
    return hasData() ? "Modifica i dati" : "Inserisci i dati";
  }

  function openWizard() {
    if (window.NTCards?.openCard) {
      window.NTCards.openCard("profileWizard");
    }
  }

  function renderBody(data = read()) {
    return `
      <div class="ntProfileContent">

        <div class="ntProfileHero">

          <div class="ntProfileAvatarBox">
            <div class="ntProfileAvatarCircle">●</div>
          </div>

          <div class="ntProfileMainInfo">

            ${row("Nome", data?.firstName)}
            ${row("Cognome", data?.lastName)}
            ${row("Sesso", data?.gender)}
            ${row("Data di nascita", data?.birthDate)}
            ${row("Paese", data?.country)}
            ${row("Occupazione", data?.occupation)}

          </div>
        </div>

        <p class="ntProfileHelperText">
          ${
            hasData(data)
              ? "Consulta i dati del tuo profilo."
              : "Inserisci le informazioni per creare il tuo profilo."
          }
        </p>

      </div>
    `;
  }

  function row(label, value) {
    return `
      <div class="ntProfileRow">
        <span class="ntProfileLabel">${label}:</span>
        <span class="ntProfileValue">${value || "—"}</span>
      </div>
    `;
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "profile",

      render() {
        return NTCardTemplate.createCard({
          id: "profile",
          title: "Profilo utente",
          body: renderBody(),

          // 👇 QUESTO È IL PUNTO GIUSTO
          footer: true,
          footerPrimary: {
            label: label(),
            onClick: openWizard
          },

          showBack: false,
          showNext: false
        });
      }
    });
  }

  return { register };
})();