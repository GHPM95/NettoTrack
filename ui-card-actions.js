/* ========================= NettoTrack Card Actions ========================= */
window.NTCardActions = (() => {
  function getActiveCardId() {
    return window.NTCards?.getActiveCardId?.() || null;
  }

  function getActiveCardDef() {
    return window.NTCards?.getActiveCardDef?.() || null;
  }

  function getActionState() {
    const activeId = getActiveCardId();
    return window.NTCards?.getActionState?.(activeId) || null;
  }

  async function handleClose() {
    const activeId = getActiveCardId();
    if (!activeId) return;

    const actionState = getActionState();
    if (!actionState?.canClose) return;

    if (actionState.dirty && actionState.canAutoSave) {
      await window.NTCards?.autoSaveCard?.(activeId);
    }

    if (window.NTCardManager?.closeActive) {
      window.NTCardManager.closeActive();
      return;
    }

    window.NTCards?.closeActiveCard?.();
  }

  async function handleSave() {
    const activeId = getActiveCardId();
    if (!activeId) return;

    const actionState = getActionState();
    if (!actionState?.canSave) return;

    await window.NTCards?.saveCard?.(activeId, { mode: "manual" });
  }

  async function handleCancel() {
    const activeId = getActiveCardId();
    if (!activeId) return;

    const actionState = getActionState();
    if (!actionState?.canCancel) return;

    await window.NTCards?.cancelCard?.(activeId);
  }

  async function handleBack() {
    const activeId = getActiveCardId();
    if (!activeId) return;

    const actionState = getActionState();
    if (!actionState?.canBack) return;

    const def = getActiveCardDef();

    if (typeof def?.onBack === "function") {
      await Promise.resolve(def.onBack({
        cardId: activeId,
        wizard: window.NTCardWizard?.get?.(activeId) || null
      }));
    } else {
      window.NTCardWizard?.prev?.(activeId);
    }

    window.NTCards?.refreshActionState?.(activeId);
  }

  async function handleNext() {
    const activeId = getActiveCardId();
    if (!activeId) return;

    const actionState = getActionState();
    if (!actionState?.canNext) return;

    const def = getActiveCardDef();

    if (typeof def?.onNext === "function") {
      await Promise.resolve(def.onNext({
        cardId: activeId,
        wizard: window.NTCardWizard?.get?.(activeId) || null
      }));
    } else {
      window.NTCardWizard?.next?.(activeId);
    }

    window.NTCards?.refreshActionState?.(activeId);
  }

  function bindWithin(root = document) {
    root.querySelectorAll("[data-nt-action='close']").forEach((el) => {
      el.onclick = () => {
        handleClose().catch(() => {});
      };
    });

    root.querySelectorAll("[data-nt-action='save']").forEach((el) => {
      el.onclick = () => {
        handleSave().catch(() => {});
      };
    });

    root.querySelectorAll("[data-nt-action='cancel']").forEach((el) => {
      el.onclick = () => {
        handleCancel().catch(() => {});
      };
    });

    root.querySelectorAll("[data-nt-action='back']").forEach((el) => {
      el.onclick = () => {
        handleBack().catch(() => {});
      };
    });

    root.querySelectorAll("[data-nt-action='next']").forEach((el) => {
      el.onclick = () => {
        handleNext().catch(() => {});
      };
    });

    refreshButtons(root);
  }

  function refreshButtons(root = document) {
    const activeId = getActiveCardId();
    const actionState = window.NTCards?.getActionState?.(activeId);

    const cardRoot = activeId
      ? window.NTCards?.getCardRoot?.(activeId)
      : null;

    const scope = cardRoot || root;

    setButtonState(scope.querySelector("[data-nt-action='back']"), Boolean(actionState?.canBack));
    setButtonState(scope.querySelector("[data-nt-action='next']"), Boolean(actionState?.canNext));
    setButtonState(scope.querySelector("[data-nt-action='cancel']"), Boolean(actionState?.canCancel));
    setButtonState(scope.querySelector("[data-nt-action='save']"), Boolean(actionState?.canSave));

    setButtonState(scope.querySelector("[data-nt-action='close']"), Boolean(actionState?.canClose), {
      keepEnabled: true
    });
  }

  function setButtonState(el, enabled, { keepEnabled = false } = {}) {
    if (!el) return;

    const isEnabled = keepEnabled ? true : Boolean(enabled);

    el.disabled = !isEnabled;
    el.setAttribute("aria-disabled", isEnabled ? "false" : "true");
    el.classList.toggle("isBlocked", !isEnabled);
    el.classList.toggle("isEnabled", isEnabled);
  }

  document.addEventListener("nt:cardchange", () => {
    bindWithin(document);
    refreshButtons(document);
  });

  document.addEventListener("nt:cardsrendered", () => {
    bindWithin(document);
    refreshButtons(document);
  });

  document.addEventListener("nt:cardstate", () => {
    refreshButtons(document);
  });

  document.addEventListener("nt:carddirtychange", () => {
    refreshButtons(document);
  });

  document.addEventListener("nt:wizardchange", () => {
    const activeId = getActiveCardId();
    if (activeId) {
      window.NTCards?.refreshActionState?.(activeId);
    }
    refreshButtons(document);
  });

  return {
    bindWithin,
    refreshButtons,
    handleClose,
    handleSave,
    handleCancel,
    handleBack,
    handleNext
  };
})();