/* ========================= NettoTrack Menu ========================= */
window.NTMenu = (() => {
  let overlayEl = null;
  let shellEl = null;
  let panelWrapEl = null;
  let panelEl = null;
  let backdropEl = null;
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
    // Se la struttura corretta esiste già, la riusiamo.
    backdropEl = overlayEl.querySelector(".ntMenuBackdrop");
    shellEl = overlayEl.querySelector(".ntMenuShell");
    panelWrapEl = overlayEl.querySelector(".ntMenuPanelWrap");
    panelEl = overlayEl.querySelector(".ntMenuPanel");
    closeBtnEl = overlayEl.querySelector("[data-nt-close-menu]");

    if (backdropEl && shellEl && panelWrapEl && panelEl && closeBtnEl) {
      return;
    }

    // Ricostruiamo il menu nella struttura che ui-menu-layout.css si aspetta.
    overlayEl.innerHTML = `
      <div class="ntMenuBackdrop"></div>

      <div class="ntMenuShell">
        <div class="ntMenuPanelWrap">
          <aside class="ntMenuPanel" aria-label="Menu"></aside>
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
      const clickedCloseZone = e.target.closest(".ntMenuCloseZone");
      if (clickedCloseZone) {
        close();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    });

    panelEl?.addEventListener("click", (e) => {
      const actionEl = e.target.closest("[data-nt-menu-action]");
      if (!actionEl) return;
      handleAction(actionEl.dataset.ntMenuAction);
    });
  }

  function open() {
    if (!overlayEl) return;

    isOpen = true;
    overlayEl.hidden = false;
    overlayEl.classList.add("isOpen");
    overlayEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (!overlayEl) return;

    isOpen = false;
    overlayEl.classList.remove("isOpen");
    overlayEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    window.setTimeout(() => {
      if (!isOpen) overlayEl.hidden = true;
    }, 240);
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