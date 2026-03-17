/* =========================
   NettoTrack Theme Settings Card
   ========================= */

window.NTThemeSettingsCard = (() => {
  function applyTheme(mode) {
    const nextMode = mode === "dark" ? "theme-dark" : "theme-light";
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(nextMode);
    localStorage.setItem("ntThemeMode", nextMode);
  }

  function getCurrentTheme() {
    const saved = localStorage.getItem("ntThemeMode");
    if (saved === "theme-dark" || saved === "theme-light") return saved;
    return document.body.classList.contains("theme-dark") ? "theme-dark" : "theme-light";
  }

  function getThemeAutoMode() {
    const saved = localStorage.getItem("ntThemeAutoMode");
    if (saved === "0" || saved === "1") return saved === "1";
    return true;
  }

  function setThemeAutoMode(value) {
    localStorage.setItem("ntThemeAutoMode", value ? "1" : "0");
  }

  function updateThemeSelectionUI(currentThemeClass) {
    const root = document.getElementById("ntThemeModes");
    if (!root) return;

    root.querySelectorAll("[data-nt-theme]").forEach((btn) => {
      const isDark = btn.dataset.ntTheme === "dark";
      const shouldBeActive =
        (isDark && currentThemeClass === "theme-dark") ||
        (!isDark && currentThemeClass === "theme-light");

      btn.classList.toggle("isSelected", shouldBeActive);

      const stateEl = btn.querySelector(".ntThemeModeState");
      if (stateEl) {
        stateEl.textContent = shouldBeActive ? "In uso" : "Tocca per attivare";
      }
    });
  }

  function bindThemeCard() {
    const root = document.getElementById("ntThemeModes");
    if (!root) return;

    const current = getCurrentTheme();
    updateThemeSelectionUI(current);

    root.querySelectorAll("[data-nt-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const selected = btn.dataset.ntTheme === "dark" ? "theme-dark" : "theme-light";
        applyTheme(selected === "theme-dark" ? "dark" : "light");
        updateThemeSelectionUI(selected);
      });
    });

    const autoCheckbox = document.getElementById("ntThemeAutoToggle");
    if (autoCheckbox) {
      autoCheckbox.checked = getThemeAutoMode();

      autoCheckbox.addEventListener("change", () => {
        setThemeAutoMode(autoCheckbox.checked);
      });
    }
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate || !window.NTComponents) return;

    NTCards.registerCard({
      id: "themeSettings",

      render() {
        const body = `
          <div class="ntThemeModes" id="ntThemeModes">
            <button type="button" class="ntThemeMode ntPress" data-nt-theme="light">
              <div class="ntThemeModePreview ntThemeModePreview--light"></div>
              <div class="ntThemeModeText">
                <div class="ntThemeModeLabel">Modalità chiara</div>
                <div class="ntThemeModeState">Tocca per attivare</div>
              </div>
            </button>

            <button type="button" class="ntThemeMode ntPress" data-nt-theme="dark">
              <div class="ntThemeModePreview ntThemeModePreview--dark"></div>
              <div class="ntThemeModeText">
                <div class="ntThemeModeLabel">Modalità scura</div>
                <div class="ntThemeModeState">Tocca per attivare</div>
              </div>
            </button>
          </div>

          <div class="ntThemeAuto">
            ${NTComponents.checkbox({
              id: "ntThemeAutoToggle",
              title: "Modalità automatica",
              desc: "Attiva o disattiva la gestione automatica del tema",
              checked: true
            })}
          </div>
        `;

        return NTCardTemplate.createCard({
          id: "themeSettings",
          title: "Aspetto e tema",
          body,
          footer: false,
          showBack: true,
          showNext: false
        });
      },

      onOpen() {
        bindThemeCard();
      }
    });
  }

  return {
    register,
    bindThemeCard,
    applyTheme,
    getCurrentTheme,
    getThemeAutoMode,
    setThemeAutoMode
  };
})();