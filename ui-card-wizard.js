/* ========================= NettoTrack Card Wizard ========================= */
window.NTCardWizard = (() => {
  const store = new Map();

  function ensure(cardId) {
    if (!store.has(cardId)) {
      store.set(cardId, { step: 0, total: 1 });
    }
    return store.get(cardId);
  }

  function setTotal(cardId, total) {
    const wizard = ensure(cardId);
    wizard.total = Math.max(1, Number(total || 1));
    wizard.step = Math.max(0, Math.min(wizard.total - 1, wizard.step));
    emit(cardId);
  }

  function setStep(cardId, step) {
    const wizard = ensure(cardId);
    wizard.step = Math.max(0, Math.min(wizard.total - 1, Number(step || 0)));
    emit(cardId);
  }

  function next(cardId) {
    const wizard = ensure(cardId);
    if (wizard.step < wizard.total - 1) {
      wizard.step += 1;
      emit(cardId);
      return true;
    }
    return false;
  }

  function prev(cardId) {
    const wizard = ensure(cardId);
    if (wizard.step > 0) {
      wizard.step -= 1;
      emit(cardId);
      return true;
    }
    return false;
  }

  function canPrev(cardId) {
    const wizard = ensure(cardId);
    return wizard.total > 1 && wizard.step > 0;
  }

  function canNext(cardId) {
    const wizard = ensure(cardId);
    return wizard.total > 1 && wizard.step < wizard.total - 1;
  }

  function get(cardId) {
    return ensure(cardId);
  }

  function reset(cardId) {
    store.set(cardId, { step: 0, total: 1 });
    emit(cardId);
  }

  function emit(cardId) {
    document.dispatchEvent(new CustomEvent("nt:wizardchange", {
      detail: {
        cardId,
        ...ensure(cardId)
      }
    }));
  }

  return {
    setTotal,
    setStep,
    next,
    prev,
    canPrev,
    canNext,
    get,
    reset
  };
})();