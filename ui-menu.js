/* ========================= NettoTrack Menu ========================= */
window.NTMenu = (() => {
  let overlayEl = null;
  let panelEl = null;
  let backdropEl = null;
  let closeBtnEl = null;
  let openBtnEl = null;
  let bodyEl = null;
  let isOpen = false;
  let isBound = false;

  function init({
    overlaySelector = "#ntMenuOverlay",
    openBtnSelector = "[data-nt-open-menu]"
  } = {}) {
    overlayEl = document.querySelector(overlaySelector);
    openBtnEl = document.querySelector(openBtnSelector);

    if (!overlayEl) return;

    /*
      Supporta sia il layout nuovo previsto dal CSS menu
      (.ntMenuPanel / .ntMenuBackdrop)
      sia la struttura che stai usando ora
      (.ntMenuSheet / #ntMenuBody).
    */
    panelEl =
      overlayEl.querySelector(".ntMenuPanel") ||
      overlayEl.querySelector(".ntMenuSheet") ||
      overlayEl.querySelector(".ntMenuBody");

    bodyEl =
      overlayEl.querySelector("#ntMenuBody") ||
      overlayEl.querySelector(".ntMenuBody") ||
      panelEl;

    backdropEl = overlayEl.querySelector(".ntMenuBackdrop");
    closeBtnEl = overlayEl.querySelector("[data-nt-close-menu]");

    mountContent();
    bind();
  }

  function mountContent() {
    if (!bodyEl || !window.NTMenuContent?.render) return;
    bodyEl.innerHTML = window.NTMenuContent.render();
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
        return;
      }

      /*
        Se non esiste un backdrop dedicato ma clicchi fuori dal pannello/sheet,
        chiude comunque il menu.
      */
      if (!backdropEl && panelEl && !panelEl.contains(e.target)) {
        close();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    });

    bodyEl?.addEventListener("click", (e) => {
      const actionEl = e.target.closest("[data-nt-menu-action]");
      if (!actionEl) return;

      const action = actionEl.dataset.ntMenuAction;
      handleAction(action);
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

    // aspetta la fine della transizione se presente
    window.setTimeout(() => {
      if (!isOpen) {
        overlayEl.hidden = true;
      }
    }, 220);
  }

  function handleAction(action) {
    if (!action) return;

    switch (action) {
      case "go-insert":
        openCardById("calendarInsert");
        close();
        break;

      case "go-calendar":
        openCardById("calendarView");
        close();
        break;

      case "go-profile":
        openCardById("profile");
        close();
        break;

      case "settings-theme":
        openCardById("themeSettings");
        close();
        break;

      default:
        close();
        break;
    }
  }

  function openCardById(cardId) {
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