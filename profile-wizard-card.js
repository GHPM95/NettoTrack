window.NTProfileWizardCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";

  const safe = (v) => String(v ?? "").trim();

  function readCtx() {
    try {
      return JSON.parse(sessionStorage.getItem(CTX_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveCtx(d) {
    sessionStorage.setItem(CTX_KEY, JSON.stringify(d));
  }

  function persist(d) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  }

  function avatarClass(gender) {
    return window.NTProfileCard?.avatarClass?.(gender) || "ntAvatar--gradient";
  }

  function getDraft() {
    return {
      firstName: safe(document.getElementById("name")?.value),
      lastName: safe(document.getElementById("last")?.value),
      gender: safe(document.getElementById("gender")?.value),
      birthDate: safe(document.getElementById("birth")?.value)
    };
  }

  function updateAvatar() {
    const box = document.getElementById("avatar");
    const gender = document.getElementById("gender")?.value;

    if (!box) return;
    box.className = "ntProfileAvatarBox " + avatarClass(gender);
  }

  function syncAll() {
    const d = getDraft();
    saveCtx({ profile: d });
    updateAvatar();
    window.NTProfileCard?.refreshLive?.(d);
  }

  function formatBirth(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    let out = "";
    if (digits.length > 0) out += digits.slice(0, 2);
    if (digits.length >= 3) out += "/" + digits.slice(2, 4);
    if (digits.length >= 5) out += "/" + digits.slice(4, 8);
    return out;
  }

  function validBirth(value) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value || "")) return false;

    const [dd, mm, yyyy] = value.split("/").map(Number);
    const now = new Date();

    if (yyyy > now.getFullYear()) return false;
    if (mm < 1 || mm > 12) return false;

    const dt = new Date(yyyy, mm - 1, dd);
    return (
      dt.getFullYear() === yyyy &&
      dt.getMonth() === mm - 1 &&
      dt.getDate() === dd &&
      dt <= now
    );
  }

  function renderError(message) {
    return `
      <div class="ntProfileWizardErrorScreen">
        <div class="ntProfileWizardErrorBox">
          <div class="ntProfileWizardErrorTitle">Errore</div>
          <div class="ntProfileWizardErrorText">${message}</div>
          <button type="button" class="ntCardFooterBtn ntCardFooterBtn--primary" id="wizardErrorBack">
            Torna indietro
          </button>
        </div>
      </div>
    `;
  }

  function render() {
    const d = readCtx().profile || {};

    return NTCardTemplate.createCard({
      id: "profileWizard",
      title: "Dati anagrafici",
      subHeader: `
        <div class="ntProfileWizardSubHeader">
          <div class="ntProfileWizardProgress">
            <div class="ntProfileWizardProgressBar">
              <div class="ntProfileWizardProgressFill" style="width:25%"></div>
            </div>
            <div class="ntProfileWizardProgressText">1/4</div>
          </div>
        </div>
      `,
      footer: true,
      body: `
        <div id="profileWizard" class="ntWizard">
          <div class="ntProfileWizardHero">
            <div id="avatar" class="ntProfileAvatarBox ${avatarClass(d.gender)}">
              <div class="ntProfileAvatarCalendarIcon">○</div>
            </div>

            <div class="ntProfileWizardFields">
              <label class="ntProfileWizardField">
                <span class="ntProfileWizardLabel">Nome</span>
                <input id="name" class="ntInput" value="${safe(d.firstName)}" />
              </label>

              <label class="ntProfileWizardField">
                <span class="ntProfileWizardLabel">Cognome</span>
                <input id="last" class="ntInput" value="${safe(d.lastName)}" />
              </label>

              <label class="ntProfileWizardField">
                <span class="ntProfileWizardLabel">Sesso</span>
                <select id="gender" class="ntSelect jsNtSelect">
                  <option value=""></option>
                  <option value="Uomo" ${d.gender === "Uomo" ? "selected" : ""}>Uomo</option>
                  <option value="Donna" ${d.gender === "Donna" ? "selected" : ""}>Donna</option>
                  <option value="Preferisco non specificare" ${d.gender === "Preferisco non specificare" ? "selected" : ""}>Preferisco non specificare</option>
                </select>
              </label>

              <label class="ntProfileWizardField">
                <span class="ntProfileWizardLabel">Data di nascita</span>
                <input
                  id="birth"
                  class="ntInput"
                  inputmode="numeric"
                  maxlength="10"
                  placeholder="GG/MM/AAAA"
                  value="${safe(d.birthDate)}"
                />
              </label>
            </div>
          </div>
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
      row.style.display = "flex";
      row.style.justifyContent = "flex-end";
      row.style.alignItems = "center";
    }

    if (cancel) {
      cancel.hidden = true;
      cancel.style.display = "none";
      cancel.disabled = true;
      cancel.textContent = "";
      cancel.setAttribute("aria-hidden", "true");
    }

    if (save) {
      save.hidden = false;
      save.style.display = "";
      save.disabled = false;
      save.textContent = "avanti";
      save.classList.remove("isBlocked");
      save.onclick = () => next();
    }
  }

  function bind() {
    const root = document.getElementById("profileWizard");
    if (!root) return;

    if (window.NTSelect?.hydrate) {
      window.NTSelect.hydrate(root);
    }

    const birth = document.getElementById("birth");
    if (birth) {
      birth.addEventListener("input", () => {
        birth.value = formatBirth(birth.value);
        syncAll();
      });
    }

    const gender = document.getElementById("gender");
    if (gender) {
      gender.addEventListener("change", syncAll);
      gender.addEventListener("input", syncAll);
    }

    root.addEventListener("input", syncAll);
    root.addEventListener("change", syncAll);

    requestAnimationFrame(syncAll);
  }

  function next() {
    const d = getDraft();
    const root = window.NTCards?.getCardRoot?.("profileWizard");

    if (!validBirth(d.birthDate)) {
      const footer = root?.querySelector(".ntCardFooter");
      const body = root?.querySelector(".ntCardBody");

      if (footer) footer.style.display = "none";
      if (body) {
        body.innerHTML = renderError("Data non valida");
        const btn = document.getElementById("wizardErrorBack");
        if (btn) {
          btn.onclick = () => {
            const fresh = render();
            if (body) body.innerHTML = fresh.match(/<div id="profileWizard"[\s\S]*$/)?.[0] || body.innerHTML;
            if (footer) footer.style.display = "";
            bind();
            fixFooter(root);
          };
        }
      }
      return;
    }

    persist(d);
    sessionStorage.removeItem(CTX_KEY);
    window.NTCards.closeCard("profileWizard");
    window.NTProfileCard?.refreshLive?.(d);
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "profileWizard",
      render,
      onOpen() {
        const root = NTCards.getCardRoot("profileWizard");
        fixFooter(root);
        bind();
      }
    });
  }

  return { register };
})();