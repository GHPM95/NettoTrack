/* =========================
   NettoTrack Menu
   ========================= */

window.NTMenu = (() => {
  let overlayEl = null;
  let panelEl = null;
  let backdropEl = null;
  let closeBtnEl = null;
  let openBtnEl = null;
  let isOpen = false;

  function init({
    overlaySelector = "#ntMenuOverlay",
    openBtnSelector = "[data-nt-open-menu]"
  } = {}) {
    overlayEl = document.querySelector(overlaySelector);
    openBtnEl = document.querySelector(openBtnSelector);

    if (!overlayEl) return;

    panelEl = overlayEl.querySelector(".ntMenuPanel");
    backdropEl = overlayEl.querySelector(".ntMenuBackdrop");
    closeBtnEl = overlayEl.querySelector("[data-nt-close-menu]");

    mountContent();
    bind();
  }

  function mountContent() {
    if (!panelEl || !window.NTMenuContent?.render) return;
    panelEl.innerHTML = window.NTMenuContent.render();
  }

  function bind() {
    if (openBtnEl) {
      openBtnEl.addEventListener("click", open);
    }

    if (backdropEl) {
      backdropEl.addEventListener("click", close);
    }

    if (closeBtnEl) {
      closeBtnEl.addEventListener("click", close);
    }

    overlayEl?.addEventListener("click", (e) => {
      const clickedCloseZone = e.target.closest(".ntMenuCloseZone");
      if (clickedCloseZone) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    });

    panelEl?.addEventListener("click", (e) => {
      const actionEl = e.target.closest("[data-nt-menu-action]");
      if (!actionEl) return;

      const action = actionEl.dataset.ntMenuAction;
      handleAction(action);
    });
  }

  function open() {
    if (!overlayEl) return;
    isOpen = true;
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
  }

  function handleAction(action) {
    if (!action) return;

    switch (action) {
      case "go-insert":
        document.getElementById("btnInsert")?.click();
        close();
        break;

      case "go-calendar":
        document.getElementById("btnCalendar")?.click();
        close();
        break;

      case "go-profile":
        document.getElementById("btnProfile")?.click();
        close();
        break;

      case "settings-theme":
        window.NTCardManager?.open("themeSettings");
        close();
        break;

      default:
        close();
        break;
    }
  }

  return {
    init,
    open,
    close
  };
})();