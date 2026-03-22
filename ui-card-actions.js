window.NTCardActions = (() => {

  function getLabel(el){
    return (el?.textContent || "").trim().toLowerCase();
  }

  function handleClick(e){
    const btn = e.target.closest("button");
    if (!btn) return;

    const label = getLabel(btn);

    const card = btn.closest("[data-card-id]");
    const cardId = card?.getAttribute("data-card-id");

    /* ===================== PROFILO ===================== */

    if (label === "inserisci i dati") {
      e.preventDefault();
      e.stopPropagation();
      window.NTProfileCard?.openWizard?.("create");
      return;
    }

    if (label === "modifica i dati") {
      e.preventDefault();
      e.stopPropagation();
      window.NTProfileCard?.openWizard?.("edit");
      return;
    }

    /* ===================== WIZARD ===================== */

    if (label === "avanti") {
      e.preventDefault();
      e.stopPropagation();

      const root = window.NTCards?.getCardRoot?.("profileWizard");
      window.NTProfileWizardCard?.goNext?.(root);
      return;
    }

    if (label === "indietro") {
      e.preventDefault();
      e.stopPropagation();

      const root = window.NTCards?.getCardRoot?.("profileWizard");
      window.NTProfileWizardCard?.goBack?.(root);
      return;
    }

    if (label === "salva") {
      e.preventDefault();
      e.stopPropagation();

      window.NTProfileWizardCard?.finish?.();
      return;
    }

    /* ===================== DEFAULT ===================== */

    // lascia comportamento standard se non matcha
  }

  function init(){
    document.addEventListener("click", handleClick);
  }

  return { init };

})();