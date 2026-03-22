window.NTCardActions = (() => {
  function labelOf(el) {
    return String(el?.textContent || "").trim().toLowerCase();
  }

  function getCardIdFromElement(el) {
    return el?.closest?.("[data-card-id]")?.getAttribute?.("data-card-id") || "";
  }

  function handleClose(cardId) {
    if (!cardId) return;

    if (cardId === "profileWizard") {
      window.NTProfileWizardCard?.closeWithAutosave?.();
      return;
    }

    window.NTCards?.closeCard?.(cardId);
  }

  function handleByLabel(label, cardId) {
    if (label === "inserisci i dati") {
      window.NTProfileCard?.openWizard?.("create");
      return true;
    }

    if (label === "modifica i dati") {
      window.NTProfileCard?.openWizard?.("edit");
      return true;
    }

    if (label === "avanti" && cardId === "profileWizard") {
      const root = window.NTCards?.getCardRoot?.("profileWizard");
      window.NTProfileWizardCard?.goNext?.(root);
      return true;
    }

    if (label === "indietro" && cardId === "profileWizard") {
      const root = window.NTCards?.getCardRoot?.("profileWizard");
      window.NTProfileWizardCard?.goBack?.(root);
      return true;
    }

    if (label === "salva" && cardId === "profileWizard") {
      window.NTProfileWizardCard?.finish?.();
      return true;
    }

    return false;
  }

  function handleClick(event) {
    const btn = event.target.closest("button");
    if (!btn) return;

    const cardId = getCardIdFromElement(btn);

    if (btn.classList.contains("jsNtCardClose")) {
      event.preventDefault();
      event.stopPropagation();
      handleClose(cardId);
      return;
    }

    if (btn.classList.contains("jsNtCardBack") && cardId === "profileWizard") {
      event.preventDefault();
      event.stopPropagation();
      const root = window.NTCards?.getCardRoot?.("profileWizard");
      window.NTProfileWizardCard?.goBack?.(root);
      return;
    }

    if (btn.classList.contains("jsNtCardNext") && cardId === "profileWizard") {
      event.preventDefault();
      event.stopPropagation();
      const root = window.NTCards?.getCardRoot?.("profileWizard");
      window.NTProfileWizardCard?.goNext?.(root);
      return;
    }

    const handled = handleByLabel(labelOf(btn), cardId);
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function init() {
    document.removeEventListener("click", handleClick);
    document.addEventListener("click", handleClick);
  }

  return { init };
})();