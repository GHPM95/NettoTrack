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
    refreshFooterState();
  }

  function applyAutomaticThemeIfNeeded() {
    if (!getThemeAutoMode()) return;
    const systemTheme = getSystemThemeClass();
    applyThemeClass(systemTheme);
    updateThemeSelectionUI(systemTheme);
    refreshFooterState();
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

  function getDraft() {
    const autoCheckbox = document.getElementById("ntThemeAutoToggle");

    let manualTheme = "theme-light";
    const selectedBtn = document.querySelector("#ntThemeModes [data-nt-theme].isSelected");
    if (selectedBtn?.dataset?.ntTheme === "dark") {
      manualTheme = "theme-dark";
    } else if (selectedBtn?.dataset?.ntTheme === "light") {
      manualTheme = "theme-light";
    } else {
      manualTheme = getStoredThemeMode();
    }

    return {
      autoMode: autoCheckbox ? Boolean(autoCheckbox.checked) : getThemeAutoMode(),
      manualTheme
    };
  }

  function getCommittedDraft() {
    return {
      autoMode: getThemeAutoMode(),
      manualTheme: getStoredThemeMode()
    };
  }

  function applyDraft(draft) {
    const nextDraft = draft || getCommittedDraft();

    setThemeAutoMode(Boolean(nextDraft.autoMode));
    localStorage.setItem(
      "ntThemeMode",
      nextDraft.manualTheme === "theme-dark" ? "theme-dark" : "theme-light"
    );

    syncAutoCheckboxUI();

    if (nextDraft.autoMode) {
      const systemTheme = getSystemThemeClass();
      applyThemeClass(systemTheme);
      updateThemeSelectionUI(systemTheme);
    } else {
      applyThemeClass(nextDraft.manualTheme);
      updateThemeSelectionUI(nextDraft.manualTheme);
    }

    refreshFooterState();
  }

  function saveDraft(draft) {
    const nextDraft = draft || getDraft();

    setThemeAutoMode(Boolean(nextDraft.autoMode));
    localStorage.setItem(
      "ntThemeMode",
      nextDraft.manualTheme === "theme-dark" ? "theme-dark" : "theme-light"
    );

    if (nextDraft.autoMode) {
      const systemTheme = getSystemThemeClass();
      applyThemeClass(systemTheme);
      updateThemeSelectionUI(systemTheme);
    } else {
      applyThemeClass(nextDraft.manualTheme);
      updateThemeSelectionUI(nextDraft.manualTheme);
    }

    refreshFooterState();
  }

  function hasChanges(draft, committedDraft) {
    const a = draft || getDraft();
    const b = committedDraft || getCommittedDraft();

    return (
      Boolean(a.autoMode) !== Boolean(b.autoMode) ||
      String(a.manualTheme) !== String(b.manualTheme)
    );
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

  function refreshFooterState() {
    const activeId = window.NTCards?.getActiveCardId?.();
    if (activeId === "themeSettings") {
      window.NTCards?.refreshCardState?.("themeSettings");
      window.NTCards?.refreshActionState?.("themeSettings");
    }
  }

  function bindThemeCard() {
    const root = document.getElementById("ntThemeModes");
    if (!root) return;

    ensureSystemThemeListener();

    const currentTheme = getActiveThemeClass();
    applyThemeClass(currentTheme);
    updateThemeSelectionUI(currentTheme);
    syncAutoCheckboxUI();
    refreshFooterState();

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

        refreshFooterState();
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
          id: "themeSettings",
          title: "Aspetto e tema",
          body,
          showBack: false,
          showNext: false,
          footer: true
        });
      },

      onOpen() {
        bindThemeCard();
      },

      getDraft() {
        return getDraft();
      },

      applyDraft({ draft }) {
        applyDraft(draft);
      },

      hasChanges({ draft, committedDraft }) {
        return hasChanges(draft, committedDraft);
      },

      onSave({ draft }) {
        saveDraft(draft);
      },

      onAutoSave({ draft }) {
        saveDraft(draft);
      },

      onCancel({ committedDraft }) {
        applyDraft(committedDraft || getCommittedDraft());
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