/* =========================
   NettoTrack Card Actions
   ========================= */

window.NTCardActions = (() => {
  function handleClose() {
    if (window.NTCardManager?.closeActive) {
      NTCardManager.closeActive();
      return;
    }

    if (window.NTCards?.closeActiveCard) {
      NTCards.closeActiveCard();
    }
  }

  function handleSave() {
    const def = window.NTCards?.getActiveCardDef?.();
    if (def?.onSave) def.onSave();
  }

  function handleCancel() {
    const def = window.NTCards?.getActiveCardDef?.();
    if (def?.onCancel) def.onCancel();
  }

  function handleBack() {
    const def = window.NTCards?.getActiveCardDef?.();

    if (def?.onBack) {
      def.onBack();
      return;
    }

    window.NTCards?.goPrevCard?.();
  }

  function handleNext() {
    const def = window.NTCards?.getActiveCardDef?.();

    if (def?.onNext) {
      def.onNext();
      return;
    }

    window.NTCards?.goNextCard?.();
  }

  function bindWithin(root = document) {
    root.querySelectorAll("[data-nt-action='close']").forEach((el) => {
      el.onclick = handleClose;
    });

    root.querySelectorAll("[data-nt-action='save']").forEach((el) => {
      el.onclick = handleSave;
    });

    root.querySelectorAll("[data-nt-action='cancel']").forEach((el) => {
      el.onclick = handleCancel;
    });

    root.querySelectorAll("[data-nt-action='back']").forEach((el) => {
      el.onclick = handleBack;
    });

    root.querySelectorAll("[data-nt-action='next']").forEach((el) => {
      el.onclick = handleNext;
    });
  }

  document.addEventListener("nt:cardchange", () => {
    bindWithin(document);
  });

  document.addEventListener("nt:cardsrendered", () => {
    bindWithin(document);
  });

  return {
    bindWithin,
    handleClose,
    handleSave,
    handleCancel,
    handleBack,
    handleNext
  };
})();