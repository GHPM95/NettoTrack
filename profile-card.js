window.NTProfileCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";
  const WIZARD_CARD_ID = "profileWizard";

  const safe = (v) => String(v ?? "").trim();

  function readStored() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function readCtx() {
    try {
      return JSON.parse(sessionStorage.getItem(CTX_KEY) || "null");
    } catch {
      return null;
    }
  }

  function getData() {
    return readCtx()?.profile || readStored() || {};
  }

  function hasData(d) {
    return Object.values(d || {}).some((v) => safe(v));
  }

  function avatarClass(gender) {
    if (gender === "Uomo") return "ntAvatar--male";
    if (gender === "Donna") return "ntAvatar--female";
    return "ntAvatar--gradient";
  }

  function openWizard() {
    const d = getData();

    sessionStorage.setItem(
      CTX_KEY,
      JSON.stringify({
        profile: d,
        mode: hasData(d) ? "edit" : "create"
      })
    );

    if (window.NTCards?.state?.registry?.has?.(WIZARD_CARD_ID)) {
      window.NTCards.openCard(WIZARD_CARD_ID);
    }
  }

  function render() {
    const d = getData();

    return NTCardTemplate.createCard({
      id: "profile",
      title: "Profilo utente",
      showBack: false,
      showNext: false,
      footer: true,
      body: `
        <div class="ntProfileContent">
          <div class="ntProfileHero">
            <div class="ntProfileAvatarBox ${avatarClass(d.gender)}" data-avatar>
              <div class="ntProfileAvatarCalendarIcon">○</div>
            </div>

            <div class="ntProfileMainInfo">
              <div class="ntProfileRow">
                <span class="ntProfileLabel">Nome:</span>
                <span class="ntProfileValue" data-k="firstName">${safe(d.firstName) || "—"}</span>
              </div>

              <div class="ntProfileRow">
                <span class="ntProfileLabel">Cognome:</span>
                <span class="ntProfileValue" data-k="lastName">${safe(d.lastName) || "—"}</span>
              </div>

              <div class="ntProfileRow">
                <span class="ntProfileLabel">Sesso:</span>
                <span class="ntProfileValue" data-k="gender">${safe(d.gender) || "—"}</span>
              </div>

              <div class="ntProfileRow">
                <span class="ntProfileLabel">Data di nascita:</span>
                <span class="ntProfileValue" data-k="birthDate">${safe(d.birthDate) || "—"}</span>
              </div>
            </div>
          </div>

          <p class="ntProfileHelperText">
            ${hasData(d) ? "Consulta i dati del tuo profilo." : "Inserisci i dati per creare il tuo profilo."}
          </p>
        </div>
      `
    });
  }

  function fixFooter(root) {
    if (!root) return;

    const cancel = root.querySelector(".jsNtCardCancel");
    const save = root.querySelector(".jsNtCardSave");
    const row = root.querySelector(".ntCardFooterRow");

    if (row) {
      row.classList.add("ntFooterSingleRight");
    }

    if (cancel) {
      cancel.hidden = true;
      cancel.style.display = "none";
      cancel.disabled = true;
      cancel.textContent = "";
      cancel.setAttribute("aria-hidden", "true");
    }

    if (save) {
      const label = hasData(readStored()) ? "Modifica i dati" : "Inserisci i dati";

      save.hidden = false;
      save.style.display = "";
      save.disabled = false;
      save.textContent = label;
      save.setAttribute("aria-label", label);
      save.classList.remove("isBlocked");
      save.onclick = () => openWizard();
    }
  }

  function refreshLive(d) {
    const root = window.NTCards?.getCardRoot?.("profile");
    if (!root) return;

    const avatar = root.querySelector("[data-avatar]");
    if (avatar) {
      avatar.className = "ntProfileAvatarBox " + avatarClass(d.gender);
    }

    ["firstName", "lastName", "gender", "birthDate"].forEach((k) => {
      const el = root.querySelector(`[data-k="${k}"]`);
      if (el) el.textContent = safe(d[k]) || "—";
    });

    const helper = root.querySelector(".ntProfileHelperText");
    if (helper) {
      helper.textContent = hasData(d)
        ? "Consulta i dati del tuo profilo."
        : "Inserisci i dati per creare il tuo profilo.";
    }

    fixFooter(root);
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "profile",
      render,
      onOpen() {
        const root = NTCards.getCardRoot("profile");
        fixFooter(root);
        refreshLive(getData());
      }
    });
  }

  return {
    register,
    refreshLive,
    openWizard,
    avatarClass
  };
})();