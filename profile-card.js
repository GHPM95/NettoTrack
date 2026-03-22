window.NTProfileCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";
  const WIZARD_CARD_ID = "profileWizard";
  const CARD_ID = "profile";

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

  function avatarGlyph(gender) {
    if (gender === "Uomo") return "♂";
    if (gender === "Donna") return "♀";
    return "○";
  }

  function formatValue(v) {
    return safe(v) || "—";
  }

  function helperText(d) {
    return hasData(d)
      ? "Consulta i dati del tuo profilo."
      : "Inserisci i dati per creare il tuo profilo.";
  }

  function openWizard(mode = "edit") {
    const d = getData();

    writeCtx({
      profile: d,
      mode
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
            <div class="ntProfileAvatarCalendarIcon" data-avatar-glyph>
              <span>${avatarGlyph(d.gender)}</span>
            </div>
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

    const data = getData();
    const exists = hasData(data);

    const row = root.querySelector(".ntCardFooterRow");
    const leftBtn = root.querySelector(".jsNtCardCancel");
    const rightBtn = root.querySelector(".jsNtCardSave");

    if (row) {
      row.style.display = "flex";
      row.style.justifyContent = exists ? "space-between" : "flex-end";
      row.style.alignItems = "center";
      row.style.gap = "12px";
    }

    if (leftBtn) {
      if (exists) {
        leftBtn.hidden = false;
        leftBtn.style.display = "";
        leftBtn.disabled = false;
        leftBtn.classList.remove("isBlocked");
        leftBtn.removeAttribute("aria-hidden");
        leftBtn.textContent = "Modifica i dati";
        leftBtn.setAttribute("aria-label", "Modifica i dati");
      } else {
        leftBtn.hidden = true;
        leftBtn.style.display = "none";
        leftBtn.disabled = true;
        leftBtn.textContent = "";
        leftBtn.setAttribute("aria-hidden", "true");
      }
    }

    if (rightBtn) {
      rightBtn.hidden = false;
      rightBtn.style.display = "";
      rightBtn.textContent = "Inserisci i dati";
      rightBtn.setAttribute("aria-label", "Inserisci i dati");

      if (exists) {
        rightBtn.disabled = true;
        rightBtn.classList.add("isBlocked");
      } else {
        rightBtn.disabled = false;
        rightBtn.classList.remove("isBlocked");
      }
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

    const glyph = root.querySelector("[data-avatar-glyph] span");
    if (glyph) {
      glyph.textContent = avatarGlyph(data.gender);
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
    return window.NTCardTemplate.createCard({
      id: CARD_ID,
      title: "Profilo utente",
      showBack: false,
      showNext: false,
      footer: true,
      footerLeftDisabled: true,
      footerRightDisabled: false,
      footerLeftLabel: "Modifica i dati",
      footerRightLabel: "Inserisci i dati",
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

  return {
    register,
    refreshLive,
    openWizard,
    avatarClass,
    avatarGlyph
  };
})();