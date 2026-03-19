/* ========================= NettoTrack Theme Settings Card ========================= */
window.NTThemeSettingsCard = (() => {
  let systemThemeMedia = null;
  let systemThemeListenerBound = false;

  function getStoredThemeMode() {
    const saved = localStorage.getItem("ntThemeMode");
    return saved === "theme-dark" || saved === "theme-light"
      ? saved
      : "theme-light";
  }

  function getThemeAutoMode() {
    const saved = localStorage.getItem("ntThemeAutoMode");
    if (saved === "0" || saved === "1") return saved === "1";
    return true;
  }

  function setThemeAutoMode(value) {
    localStorage.setItem("ntThemeAutoMode", value ? "1" : "0");
  }

  function getSystemThemeClass() {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "theme-dark" : "theme-light";
  }

  function getActiveThemeClass() {
    return getThemeAutoMode() ? getSystemThemeClass() : getStoredThemeMode();
  }

  function applyThemeClass(themeClass) {
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(themeClass);
  }

  function applyManualTheme(mode) {
    const nextMode = mode === "dark" ? "theme-dark" : "theme-light";
    localStorage.setItem("ntThemeMode", nextMode);
    applyThemeClass(nextMode);
    updateThemeSelectionUI(nextMode);
  }

  function applyAutomaticThemeIfNeeded() {
    if (!getThemeAutoMode()) return;
    const systemTheme = getSystemThemeClass();
    applyThemeClass(systemTheme);
    updateThemeSelectionUI(systemTheme);
  }

  function ensureSystemThemeListener() {
    if (systemThemeListenerBound || !window.matchMedia) return;

    systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    const onSystemThemeChange = () => {
      applyAutomaticThemeIfNeeded();
      syncAutoCheckboxUI();
    };

    if (typeof systemThemeMedia.addEventListener === "function") {
      systemThemeMedia.addEventListener("change", onSystemThemeChange);
    } else if (typeof systemThemeMedia.addListener === "function") {
      systemThemeMedia.addListener(onSystemThemeChange);
    }

    systemThemeListenerBound = true;
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

      const stateEl = btn.querySelector(".themeSub");
      if (stateEl) {
        stateEl.textContent = shouldBeActive ? "In uso" : "Tocca per attivare";
      }

      btn.setAttribute("aria-pressed", shouldBeActive ? "true" : "false");
    });
  }

  function syncAutoCheckboxUI() {
    const autoCheckbox = document.getElementById("ntThemeAutoToggle");
    if (!autoCheckbox) return;
    autoCheckbox.checked = getThemeAutoMode();
  }

  function bindThemeCard() {
    const root = document.getElementById("ntThemeModes");
    if (!root) return;

    ensureSystemThemeListener();

    const currentTheme = getActiveThemeClass();
    applyThemeClass(currentTheme);
    updateThemeSelectionUI(currentTheme);
    syncAutoCheckboxUI();

    root.querySelectorAll("[data-nt-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const selectedMode = btn.dataset.ntTheme === "dark" ? "dark" : "light";

        if (getThemeAutoMode()) {
          setThemeAutoMode(false);
          syncAutoCheckboxUI();
        }

        applyManualTheme(selectedMode);
      });
    });

    const autoCheckbox = document.getElementById("ntThemeAutoToggle");
    if (autoCheckbox) {
      autoCheckbox.addEventListener("change", () => {
        setThemeAutoMode(autoCheckbox.checked);

        if (autoCheckbox.checked) {
          const systemTheme = getSystemThemeClass();
          applyThemeClass(systemTheme);
          updateThemeSelectionUI(systemTheme);
        } else {
          const manualTheme = getStoredThemeMode();
          applyThemeClass(manualTheme);
          updateThemeSelectionUI(manualTheme);
        }
      });
    }
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "themeSettings",

      render() {
        const body = `
          <div id="ntThemeModes" class="themeRoot">
            <div class="themeModes">
              <button
                type="button"
                class="themeCard"
                data-nt-theme="light"
                aria-pressed="false"
              >
                <span class="themePreview light" aria-hidden="true"></span>
                <span class="themeLabel">Modalità chiara</span>
                <span class="themeSub">Tocca per attivare</span>
              </button>

              <button
                type="button"
                class="themeCard"
                data-nt-theme="dark"
                aria-pressed="false"
              >
                <span class="themePreview dark" aria-hidden="true"></span>
                <span class="themeLabel">Modalità scura</span>
                <span class="themeSub">Tocca per attivare</span>
              </button>
            </div>

            <div class="themeAutoOnlyRow">
              <input
                id="ntThemeAutoToggle"
                class="themeAutoCheck"
                type="checkbox"
                aria-label="Modalità automatica"
              />
              <label for="ntThemeAutoToggle" class="themeAutoOnlyLabel">
                Modalità automatica
              </label>
            </div>
          </div>
        `;

        return NTCardTemplate.createCard({
          render() {
  const body = `
    <div id="ntThemeModes" class="themeRoot">
      ...
    </div>
  `;

  return NTCardTemplate.createCard({
    id: "themeSettings",
    title: "Aspetto e tema",
    body,

    showBack: false,
    showNext: false,
    footer: true
  });
}

      onOpen() {
        bindThemeCard();
      }
    });
  }

  function initThemeOnAppStart() {
    ensureSystemThemeListener();
    applyThemeClass(getActiveThemeClass());
  }

  return {
    register,
    initThemeOnAppStart
  };
  
})();