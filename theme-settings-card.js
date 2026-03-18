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

      const stateEl = btn.querySelector(".ntThemeModeState");
      if (stateEl) {
        stateEl.textContent = shouldBeActive ? "In uso" : "Tocca per attivare";
      }
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

  function renderAutoModeRow() {
    return `
      <label class="ntCheckRow themeAutoInline" for="ntThemeAutoToggle">
        <input
          id="ntThemeAutoToggle"
          class="ntToolCheck themeToolCheck"
          type="checkbox"
          role="switch"
          aria-label="Modalità automatica"
        />
        <span class="ntCheckContent">
          <span class="ntCheckTitle">Modalità automatica</span>
        </span>
      </label>
    `;
  }

  function register() {
    if (!window.NTCards || !window.NTCardTemplate) return;

    NTCards.registerCard({
      id: "themeSettings",

      render() {
        const body = `
          <div id="ntThemeModes" class="ntThemeSettings">
            <div class="ntThemeModesGrid">
              <button
                type="button"
                class="ntThemeModeCard"
                data-nt-theme="light"
                aria-pressed="false"
              >
                <span class="ntThemeModeTitle">Modalità chiara</span>
                <span class="ntThemeModeState">Tocca per attivare</span>
              </button>

              <button
                type="button"
                class="ntThemeModeCard"
                data-nt-theme="dark"
                aria-pressed="false"
              >
                <span class="ntThemeModeTitle">Modalità scura</span>
                <span class="ntThemeModeState">Tocca per attivare</span>
              </button>
            </div>

            ${renderAutoModeRow()}
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

  function initThemeOnAppStart() {
    ensureSystemThemeListener();
    applyThemeClass(getActiveThemeClass());
  }

  return {
    register,
    initThemeOnAppStart
  };
})();