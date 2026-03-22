/* ========================= NettoTrack Menu ========================= */
window.NTMenu = (() => {
  let overlayEl = null;
  let backdropEl = null;
  let shellEl = null;
  let panelWrapEl = null;
  let panelEl = null;
  let closeBtnEl = null;
  let openBtnEl = null;

  let isOpen = false;
  let isBound = false;

  function init({
    overlaySelector = "#ntMenuOverlay",
    openBtnSelector = "[data-nt-open-menu]"
  } = {}) {
    overlayEl = document.querySelector(overlaySelector);
    openBtnEl = document.querySelector(openBtnSelector);

    if (!overlayEl) return;

    ensureStructure();
    mountContent();
    bind();
  }

  function ensureStructure() {
    backdropEl = overlayEl.querySelector(".ntMenuBackdrop");
    shellEl = overlayEl.querySelector(".ntMenuShell");
    panelWrapEl = overlayEl.querySelector(".ntMenuPanelWrap");
    panelEl = overlayEl.querySelector(".ntMenuPanel");
    closeBtnEl = overlayEl.querySelector("[data-nt-close-menu]");

    if (backdropEl && shellEl && panelWrapEl && panelEl && closeBtnEl) {
      return;
    }

    overlayEl.innerHTML = `
      <div class="ntMenuBackdrop"></div>

      <div class="ntMenuShell" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="ntMenuPanelWrap">
          <aside class="ntMenuPanel"></aside>
        </div>

        <div class="ntMenuCloseZone">
          <div class="ntMenuCloseBtnWrap">
            <button
              type="button"
              class="ntIconBtn"
              data-nt-close-menu
              aria-label="Chiudi menu"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    `;

    backdropEl = overlayEl.querySelector(".ntMenuBackdrop");
    shellEl = overlayEl.querySelector(".ntMenuShell");
    panelWrapEl = overlayEl.querySelector(".ntMenuPanelWrap");
    panelEl = overlayEl.querySelector(".ntMenuPanel");
    closeBtnEl = overlayEl.querySelector("[data-nt-close-menu]");

    overlayEl.hidden = true;
    overlayEl.setAttribute("aria-hidden", "true");
  }

  function mountContent() {
    if (!panelEl || !window.NTMenuContent?.render) return;
    panelEl.innerHTML = window.NTMenuContent.render();
  }

  function bind() {
    if (isBound || !overlayEl) return;
    isBound = true;

    if (openBtnEl) {
      openBtnEl.addEventListener("click", open);
    }

    if (backdropEl) {
      backdropEl.addEventListener("click", close);
    }

    if (closeBtnEl) {
      closeBtnEl.addEventListener("click", close);
    }

    overlayEl.addEventListener("click", (e) => {
      const closeZone = e.target.closest(".ntMenuCloseZone");
      if (closeZone) {
        close();
      }
    });

    panelEl?.addEventListener("click", (e) => {
      const actionEl = e.target.closest("[data-nt-menu-action]");
      if (!actionEl) return;

      handleAction(actionEl.dataset.ntMenuAction);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    });
  }

  function open() {
    if (!overlayEl) return;

    mountContent();

    isOpen = true;
    overlayEl.hidden = false;
    overlayEl.classList.add("isOpen");
    overlayEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("ntMenuOpen");
  }

  function close() {
    if (!overlayEl) return;

    isOpen = false;
    overlayEl.classList.remove("isOpen");
    overlayEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ntMenuOpen");

    window.setTimeout(() => {
      if (!isOpen) {
        overlayEl.hidden = true;
      }
    }, 220);
  }

  function handleAction(action) {
    switch (action) {
      case "go-insert":
        openCard("calendarInsert");
        close();
        break;

      case "go-calendar":
        openCard("calendarView");
        close();
        break;

      case "go-profile":
        openCard("profile");
        close();
        break;

      case "settings-theme":
        openCard("themeSettings");
        close();
        break;

      default:
        close();
        break;
    }
  }

  function openCard(cardId) {
    if (!cardId) return;

    if (window.NTCardManager?.open) {
      window.NTCardManager.open(cardId);
      return;
    }

    if (window.NTCards?.openCard) {
      window.NTCards.openCard(cardId);
    }
  }

  return {
    init,
    open,
    close
  };
})();