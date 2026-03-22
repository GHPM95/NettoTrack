window.NTProfileCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";
  const CARD_ID = "profile";
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

  function writeCtx(data) {
    try {
      sessionStorage.setItem(CTX_KEY, JSON.stringify(data || {}));
    } catch {}
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

  function formatValue(v) {
    return safe(v) || "—";
  }

  function helperText(d) {
    return hasData(d)
      ? "Consulta i dati del tuo profilo."
      : "Inserisci i dati per creare il tuo profilo.";
  }

  function primaryLabel() {
    return hasData(readStored()) ? "Modifica i dati" : "Inserisci i dati";
  }

  function openWizard() {
    const d = getData();

    writeCtx({
      profile: d,
      mode: hasData(d) ? "edit" : "create"
    });

    if (window.NTProfileWizardCard?.register) {
      window.NTProfileWizardCard.register();
    }

    if (window.NTCards?.state?.registry?.has?.(WIZARD_CARD_ID)) {
      window.NTCards.openCard(WIZARD_CARD_ID);
    }
  }

  function renderBody(d) {
    return `
      <div class="ntProfileContent">
        <div class="ntProfileHero">
          <div class="ntProfileAvatarBox ${avatarClass(d.gender)}" data-avatar>
            <div class="ntProfileAvatarCalendarIcon">○</div>
          </div>

          <div class="ntProfileMainInfo">
            <div class="ntProfileRow">
              <span class="ntProfileLabel">Nome:</span>
              <span class="ntProfileValue" data-k="firstName">${formatValue(d.firstName)}</span>
            </div>

            <div class="ntProfileRow">
              <span class="ntProfileLabel">Cognome:</span>
              <span class="ntProfileValue" data-k="lastName">${formatValue(d.lastName)}</span>
            </div>

            <div class="ntProfileRow">
              <span class="ntProfileLabel">Sesso:</span>
              <span class="ntProfileValue" data-k="gender">${formatValue(d.gender)}</span>
            </div>

            <div class="ntProfileRow">
              <span class="ntProfileLabel">Data di nascita:</span>
              <span class="ntProfileValue" data-k="birthDate">${formatValue(d.birthDate)}</span>
            </div>
          </div>
        </div>

        <p class="ntProfileHelperText" data-helper>${helperText(d)}</p>
      </div>
    `;
  }

  function applyFooter(root) {
    if (!root) return;

    const row = root.querySelector(".ntCardFooterRow");
    const cancel = root.querySelector(".jsNtCardCancel");
    const save = root.querySelector(".jsNtCardSave");

    if (row) {
      row.style.display = "flex";
      row.style.justifyContent = "flex-end";
      row.style.alignItems = "center";
      row.style.gap = "12px";
    }

    if (cancel) {
      cancel.hidden = true;
      cancel.disabled = true;
      cancel.style.display = "none";
      cancel.textContent = "";
      cancel.setAttribute("aria-hidden", "true");
    }

    if (save) {
      const label = primaryLabel();

      save.hidden = false;
      save.disabled = false;
      save.style.display = "";
      save.textContent = label;
      save.setAttribute("aria-label", label);
      save.classList.remove("isBlocked");
      save.onclick = () => openWizard();
    }
  }

  function refreshLive(d) {
    const root = window.NTCards?.getCardRoot?.(CARD_ID);
    if (!root) return;

    const data = d || getData();

    const avatar = root.querySelector("[data-avatar]");
    if (avatar) {
      avatar.className = "ntProfileAvatarBox " + avatarClass(data.gender);
    }

    ["firstName", "lastName", "gender", "birthDate"].forEach((k) => {
      const el = root.querySelector(`[data-k="${k}"]`);
      if (el) el.textContent = formatValue(data[k]);
    });

    const helper = root.querySelector("[data-helper]");
    if (helper) helper.textContent = helperText(data);

    applyFooter(root);
  }

  function render() {
    return NTCardTemplate.createCard({
      id: CARD_ID,
      title: "Profilo utente",
      showBack: false,
      showNext: false,
      footer: true,
      footerLeftDisabled: true,
      footerRightDisabled: false,
      body: renderBody(getData())
    });
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;
    if (window.NTCards?.state?.registry?.has?.(CARD_ID)) return;

    window.NTCards.registerCard({
      id: CARD_ID,
      render,
      onOpen() {
        const root = window.NTCards.getCardRoot(CARD_ID);
        applyFooter(root);
        refreshLive(getData());
      }
    });
  }

  function autoRegister() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", register, { once: true });
    } else {
      register();
    }
  }

  autoRegister();

  return {
    register,
    refreshLive,
    openWizard,
    avatarClass
  };
})();