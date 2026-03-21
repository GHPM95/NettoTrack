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

  function getCommittedDraft() {
    return {
      autoMode: getThemeAutoMode(),
      manualTheme: getStoredThemeMode()
    };
  }

  function normalizeManualTheme(value) {
    return value === "theme-dark" ? "theme-dark" : "theme-light";
  }

  function getActiveThemeClass() {
    const committed = getCommittedDraft();
    return committed.autoMode ? getSystemThemeClass() : committed.manualTheme;
  }

  function applyThemeClass(themeClass) {
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(themeClass);
  }

  function syncAutoCheckboxUI(value = getThemeAutoMode()) {
    const autoCheckbox = document.getElementById("ntThemeAutoToggle");
    if (!autoCheckbox) return;
    autoCheckbox.checked = Boolean(value);
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

  function getDraft() {
    const autoCheckbox = document.getElementById("ntThemeAutoToggle");
    const selectedBtn = document.querySelector("#ntThemeModes [data-nt-theme].isSelected");
    const committed = getCommittedDraft();

    let manualTheme = committed.manualTheme;

    if (selectedBtn?.dataset?.ntTheme === "dark") {
      manualTheme = "theme-dark";
    } else if (selectedBtn?.dataset?.ntTheme === "light") {
      manualTheme = "theme-light";
    }

    return {
      autoMode: autoCheckbox ? Boolean(autoCheckbox.checked) : committed.autoMode,
      manualTheme: normalizeManualTheme(manualTheme)
    };
  }

  function hasChanges({ draft, committedDraft } = {}) {
    const current = draft || getDraft();
    const committed = committedDraft || getCommittedDraft();

    return (
      Boolean(current.autoMode) !== Boolean(committed.autoMode) ||
      normalizeManualTheme(current.manualTheme) !== normalizeManualTheme(committed.manualTheme)
    );
  }

  function applyDraftToUI(draft) {
    const nextDraft = draft || getCommittedDraft();
    const normalizedDraft = {
      autoMode: Boolean(nextDraft.autoMode),
      manualTheme: normalizeManualTheme(nextDraft.manualTheme)
    };

    syncAutoCheckboxUI(normalizedDraft.autoMode);

    if (normalizedDraft.autoMode) {
      const systemTheme = getSystemThemeClass();
      applyThemeClass(systemTheme);
      updateThemeSelectionUI(systemTheme);
    } else {
      applyThemeClass(normalizedDraft.manualTheme);
      updateThemeSelectionUI(normalizedDraft.manualTheme);
    }
  }

  function persistDraft(draft) {
    const normalizedDraft = {
      autoMode: Boolean(draft.autoMode),
      manualTheme: normalizeManualTheme(draft.manualTheme)
    };

    setThemeAutoMode(normalizedDraft.autoMode);
    localStorage.setItem("ntThemeMode", normalizedDraft.manualTheme);

    if (normalizedDraft.autoMode) {
      const systemTheme = getSystemThemeClass();
      applyThemeClass(systemTheme);
      updateThemeSelectionUI(systemTheme);
    } else {
      applyThemeClass(normalizedDraft.manualTheme);
      updateThemeSelectionUI(normalizedDraft.manualTheme);
    }

    syncAutoCheckboxUI(normalizedDraft.autoMode);
  }

  function refreshCardStateUI() {
    queueMicrotask(() => {
      window.NTCards?.refreshCardState?.("themeSettings");
      window.NTCards?.refreshActionState?.("themeSettings");
    });
  }

  function setDraftPreviewFromMode(mode) {
    const manualTheme = mode === "dark" ? "theme-dark" : "theme-light";
    const autoCheckbox = document.getElementById("ntThemeAutoToggle");

    if (autoCheckbox?.checked) {
      autoCheckbox.checked = false;
    }

    applyThemeClass(manualTheme);
    updateThemeSelectionUI(manualTheme);
    refreshCardStateUI();
  }

  function setDraftPreviewFromAuto(autoEnabled) {
    if (autoEnabled) {
      const systemTheme = getSystemThemeClass();
      applyThemeClass(systemTheme);
      updateThemeSelectionUI(systemTheme);
    } else {
      const draft = getDraft();
      applyThemeClass(draft.manualTheme);
      updateThemeSelectionUI(draft.manualTheme);
    }

    refreshCardStateUI();
  }

  function applyAutomaticThemeIfNeeded() {
    const draft = getDraft();
    if (!draft.autoMode) return;

    const systemTheme = getSystemThemeClass();
    applyThemeClass(systemTheme);
    updateThemeSelectionUI(systemTheme);
    refreshCardStateUI();
  }

  function ensureSystemThemeListener() {
    if (systemThemeListenerBound || !window.matchMedia) return;

    systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    const onSystemThemeChange = () => {
      applyAutomaticThemeIfNeeded();
    };

    if (typeof systemThemeMedia.addEventListener === "function") {
      systemThemeMedia.addEventListener("change", onSystemThemeChange);
    } else if (typeof systemThemeMedia.addListener === "function") {
      systemThemeMedia.addListener(onSystemThemeChange);
    }

    systemThemeListenerBound = true;
  }

  function bindThemeCard() {
    const root = document.getElementById("ntThemeModes");
    if (!root) return;

    ensureSystemThemeListener();

    applyDraftToUI(getCommittedDraft());
    refreshCardStateUI();

    root.querySelectorAll("[data-nt-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const selectedMode = btn.dataset.ntTheme === "dark" ? "dark" : "light";
        setDraftPreviewFromMode(selectedMode);
      });
    });

    const autoCheckbox = document.getElementById("ntThemeAutoToggle");
    if (autoCheckbox) {
      autoCheckbox.addEventListener("change", () => {
        setDraftPreviewFromAuto(Boolean(autoCheckbox.checked));
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
        applyDraftToUI(draft);
        refreshCardStateUI();
      },

      hasChanges({ draft, committedDraft }) {
        return hasChanges({ draft, committedDraft });
      },

      onSave({ draft }) {
        persistDraft(draft || getDraft());
        refreshCardStateUI();
      },

      onAutoSave({ draft }) {
        persistDraft(draft || getDraft());
        refreshCardStateUI();
      },

      onCancel({ committedDraft }) {
        applyDraftToUI(committedDraft || getCommittedDraft());
        refreshCardStateUI();
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