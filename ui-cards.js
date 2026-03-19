/* ========================= NettoTrack Cards Manager ========================= */
window.NTCards = (() => {
  const state = {
    registry: new Map(),
    openCards: [],
    activeIndex: -1,
    viewportEl: null,
    trackEl: null,
    dotsHook: null,
    runtime: new Map(),
    cardState: new Map()
  };

  function setElements({ viewportEl, trackEl, dotsHook } = {}) {
    state.viewportEl = viewportEl || state.viewportEl;
    state.trackEl = trackEl || state.trackEl;
    state.dotsHook = dotsHook || state.dotsHook;

    render();
    syncTrack();
    window.addEventListener("resize", syncTrack);
  }

  function registerCard(config) {
    if (!config || !config.id) return;

    state.registry.set(config.id, {
      id: config.id,
      title: config.title || "",
      render: typeof config.render === "function" ? config.render : (() => ""),

      onOpen: config.onOpen || null,
      onClose: config.onClose || null,
      onSave: config.onSave || null,
      onAutoSave: config.onAutoSave || null,
      onCancel: config.onCancel || null,
      onBack: config.onBack || null,
      onNext: config.onNext || null,

      getDraft: config.getDraft || null,
      applyDraft: config.applyDraft || null,
      hasChanges: config.hasChanges || null,

      getStatus: config.getStatus || null
    });
  }

  function isOpen(cardId) {
    return state.openCards.includes(cardId);
  }

  function getViewportWidth() {
    return state.viewportEl?.clientWidth || 0;
  }

  function getTranslateXForIndex(index) {
    return -(getViewportWidth() * index);
  }

  function createRuntime(cardId) {
    const controller = new AbortController();
    const runtime = {
      cardId,
      abortController: controller,
      signal: controller.signal,
      cleanups: [],
      intervals: [],
      timeouts: [],
      rafs: [],
      observers: []
    };

    state.runtime.set(cardId, runtime);
    return runtime;
  }

  function getRuntime(cardId) {
    return state.runtime.get(cardId) || null;
  }

  function ensureRuntime(cardId) {
    return getRuntime(cardId) || createRuntime(cardId);
  }

  function addCleanup(cardId, fn) {
    const runtime = ensureRuntime(cardId);
    if (typeof fn === "function") runtime.cleanups.push(fn);
  }

  function addInterval(cardId, intervalId) {
    const runtime = ensureRuntime(cardId);
    runtime.intervals.push(intervalId);
    return intervalId;
  }

  function addTimeout(cardId, timeoutId) {
    const runtime = ensureRuntime(cardId);
    runtime.timeouts.push(timeoutId);
    return timeoutId;
  }

  function addRaf(cardId, rafId) {
    const runtime = ensureRuntime(cardId);
    runtime.rafs.push(rafId);
    return rafId;
  }

  function addObserver(cardId, observer) {
    const runtime = ensureRuntime(cardId);
    if (observer) runtime.observers.push(observer);
    return observer;
  }

  function cleanupRuntime(cardId) {
    const runtime = getRuntime(cardId);
    if (!runtime) return;

    try {
      runtime.abortController.abort();
    } catch {}

    runtime.intervals.forEach((id) => {
      try { clearInterval(id); } catch {}
    });

    runtime.timeouts.forEach((id) => {
      try { clearTimeout(id); } catch {}
    });

    runtime.rafs.forEach((id) => {
      try { cancelAnimationFrame(id); } catch {}
    });

    runtime.observers.forEach((observer) => {
      try {
        if (observer && typeof observer.disconnect === "function") {
          observer.disconnect();
        }
      } catch {}
    });

    runtime.cleanups.forEach((fn) => {
      try { fn(); } catch {}
    });

    state.runtime.delete(cardId);
  }

  function ensureCardState(cardId) {
    if (!state.cardState.has(cardId)) {
      state.cardState.set(cardId, {
        committedDraft: null,
        lastAutoSavedDraft: null,
        dirty: false,
        ready: false
      });
    }
    return state.cardState.get(cardId);
  }

  function clearCardState(cardId) {
    state.cardState.delete(cardId);
  }

  function focusCard(cardId) {
    const idx = state.openCards.indexOf(cardId);
    if (idx === -1) return false;

    state.activeIndex = idx;
    syncTrack();
    emitCardChange();
    pulseCurrentCard();
    refreshActionState(cardId);
    return true;
  }

  function openCard(cardId) {
    if (!state.registry.has(cardId)) return false;

    if (isOpen(cardId)) {
      return focusCard(cardId);
    }

    state.openCards.push(cardId);
    state.activeIndex = state.openCards.length - 1;
    createRuntime(cardId);

    render();
    syncTrack();

    const def = state.registry.get(cardId);
    if (def?.onOpen) {
      const runtime = ensureRuntime(cardId);
      def.onOpen(buildCardContext(cardId, runtime));
    }

    initializeCardState(cardId);
    emitCardChange();
    pulseCurrentCard();
    refreshActionState(cardId);
    return true;
  }

  function closeCard(cardId) {
    const idx = state.openCards.indexOf(cardId);
    if (idx === -1) return false;

    const def = state.registry.get(cardId);
    const runtime = getRuntime(cardId);

    if (def?.onClose) {
      try {
        def.onClose({ cardId, runtime, signal: runtime?.signal || null });
      } catch {}
    }

    cleanupRuntime(cardId);
    clearCardState(cardId);

    state.openCards.splice(idx, 1);

    if (!state.openCards.length) {
      state.activeIndex = -1;
      render();
      emitCardChange();
      return true;
    }

    state.activeIndex = idx < state.openCards.length ? idx : state.openCards.length - 1;
    render();
    syncTrack();
    emitCardChange();
    pulseCurrentCard();
    refreshActionState(getActiveCardId());
    return true;
  }

  function closeActiveCard() {
    const activeId = getActiveCardId();
    if (!activeId) return false;
    return closeCard(activeId);
  }

  function getActiveCardId() {
    if (state.activeIndex < 0) return null;
    return state.openCards[state.activeIndex] || null;
  }

  function getActiveCardDef() {
    const id = getActiveCardId();
    if (!id) return null;
    return state.registry.get(id) || null;
  }

  function goNextCard() {
    if (state.activeIndex < state.openCards.length - 1) {
      state.activeIndex += 1;
      syncTrack();
      emitCardChange();
      pulseCurrentCard();
      refreshActionState(getActiveCardId());
      return true;
    }
    return false;
  }

  function goPrevCard() {
    if (state.activeIndex > 0) {
      state.activeIndex -= 1;
      syncTrack();
      emitCardChange();
      pulseCurrentCard();
      refreshActionState(getActiveCardId());
      return true;
    }
    return false;
  }

  function goToCard(index) {
    if (index < 0 || index >= state.openCards.length) return false;
    state.activeIndex = index;
    syncTrack();
    emitCardChange();
    pulseCurrentCard();
    refreshActionState(getActiveCardId());
    return true;
  }

  function render() {
    if (!state.trackEl) return;

    const html = state.openCards.map((cardId) => {
      const def = state.registry.get(cardId);
      return def ? def.render() : "";
    }).join("");

    state.trackEl.innerHTML = html;
    updateDots();
    document.dispatchEvent(new CustomEvent("nt:cardsrendered"));
  }

  function syncTrack() {
    if (!state.trackEl || !state.viewportEl) return;

    const index = Math.max(0, state.activeIndex);
    const viewportWidth = state.viewportEl.clientWidth;
    const offsetX = -(index * viewportWidth);

    state.trackEl.style.transform = `translate3d(${offsetX}px,0,0)`;
    updateDots();
  }

  function updateDots() {
    if (typeof state.dotsHook === "function") {
      state.dotsHook({
        openCards: [...state.openCards],
        activeIndex: state.activeIndex,
        registry: state.registry
      });
    }
  }

  function emitCardChange() {
    const activeId = getActiveCardId();

    document.dispatchEvent(new CustomEvent("nt:cardchange", {
      detail: {
        activeId,
        activeIndex: state.activeIndex,
        openCards: [...state.openCards]
      }
    }));

    updateDots();
  }

  function pulseCurrentCard() {
    const activeId = getActiveCardId();
    if (!activeId || !state.trackEl) return;

    const el = state.trackEl.querySelector(`[data-card-id="${cssEscape(activeId)}"]`);
    if (!el) return;

    el.classList.remove("ntCardEnter");
    void el.offsetWidth;
    el.classList.add("ntCardEnter");
  }

  function getCardRoot(cardId) {
    if (!cardId || !state.trackEl) return null;
    return state.trackEl.querySelector(`[data-card-id="${cssEscape(cardId)}"]`);
  }

  function buildCardContext(cardId, runtime = null) {
    const def = state.registry.get(cardId) || null;
    const cardRuntime = runtime || getRuntime(cardId);

    return {
      cardId,
      def,
      runtime: cardRuntime,
      signal: cardRuntime?.signal || null,
      root: getCardRoot(cardId),
      getState: () => ensureCardState(cardId),
      getCommittedDraft: () => cloneDeep(ensureCardState(cardId).committedDraft),
      getCurrentDraft: () => getDraft(cardId),
      markDirty: (value = true) => setCardDirty(cardId, value),
      refresh: () => refreshCardState(cardId),
      commit: (draft) => setCommittedDraft(cardId, draft),
      applyCommitted: () => applyCommittedDraft(cardId)
    };
  }

  function initializeCardState(cardId) {
    const cardState = ensureCardState(cardId);
    cardState.ready = false;
    cardState.dirty = false;

    attachCardDirtyTracking(cardId);

    queueMicrotask(() => {
      const draft = getDraft(cardId);
      setCommittedDraft(cardId, draft);
      const nextState = ensureCardState(cardId);
      nextState.ready = true;
      refreshActionState(cardId);
    });
  }

  function attachCardDirtyTracking(cardId) {
    const runtime = ensureRuntime(cardId);
    const root = getCardRoot(cardId);
    if (!root) return;

    const onMaybeDirty = () => {
      queueMicrotask(() => {
        refreshCardState(cardId);
      });
    };

    root.addEventListener("input", onMaybeDirty, true);
    root.addEventListener("change", onMaybeDirty, true);

    root.querySelectorAll("[contenteditable='true']").forEach((el) => {
      el.addEventListener("input", onMaybeDirty, true);
    });

    addCleanup(cardId, () => {
      try { root.removeEventListener("input", onMaybeDirty, true); } catch {}
      try { root.removeEventListener("change", onMaybeDirty, true); } catch {}
    });

    runtime.cleanups.push(() => {});
  }

  function getDraft(cardId) {
    const def = state.registry.get(cardId);
    if (!def?.getDraft) return null;

    try {
      return cloneDeep(def.getDraft(buildCardContext(cardId)));
    } catch {
      return null;
    }
  }

  function setCommittedDraft(cardId, draft) {
    const cardState = ensureCardState(cardId);
    cardState.committedDraft = cloneDeep(draft);
    cardState.lastAutoSavedDraft = cloneDeep(draft);
    cardState.dirty = false;
    emitCardState(cardId);
    refreshActionState(cardId);
  }

  function setLastAutoSavedDraft(cardId, draft) {
    const cardState = ensureCardState(cardId);
    cardState.lastAutoSavedDraft = cloneDeep(draft);
  }

  function setCardDirty(cardId, dirty) {
    const cardState = ensureCardState(cardId);
    const nextDirty = Boolean(dirty);

    if (cardState.dirty === nextDirty) {
      refreshActionState(cardId);
      return;
    }

    cardState.dirty = nextDirty;
    emitCardState(cardId);
    refreshActionState(cardId);
  }

  function refreshCardState(cardId) {
    const def = state.registry.get(cardId);
    const cardState = ensureCardState(cardId);

    if (!cardState.ready) {
      refreshActionState(cardId);
      return false;
    }

    if (!def?.getDraft) {
      refreshActionState(cardId);
      return cardState.dirty;
    }

    const draft = getDraft(cardId);
    const dirty = computeHasChanges(cardId, draft);
    setCardDirty(cardId, dirty);
    return dirty;
  }

  function computeHasChanges(cardId, draft) {
    const def = state.registry.get(cardId);
    const cardState = ensureCardState(cardId);
    const saved = cardState.committedDraft;

    if (typeof def?.hasChanges === "function") {
      try {
        return Boolean(def.hasChanges({
          ...buildCardContext(cardId),
          draft: cloneDeep(draft),
          committedDraft: cloneDeep(saved)
        }));
      } catch {}
    }

    return stableStringify(draft) !== stableStringify(saved);
  }

  async function saveCard(cardId, { mode = "manual" } = {}) {
    const def = state.registry.get(cardId);
    if (!def) return false;

    const draft = getDraft(cardId);
    const dirty = def.getDraft ? computeHasChanges(cardId, draft) : ensureCardState(cardId).dirty;

    if (!dirty) {
      refreshActionState(cardId);
      return false;
    }

    const ctx = {
      ...buildCardContext(cardId),
      draft: cloneDeep(draft),
      committedDraft: cloneDeep(ensureCardState(cardId).committedDraft),
      mode
    };

    const handler =
      mode === "auto"
        ? (def.onAutoSave || def.onSave)
        : def.onSave;

    if (typeof handler !== "function") {
      refreshActionState(cardId);
      return false;
    }

    await Promise.resolve(handler(ctx));

    if (mode === "auto") {
      setLastAutoSavedDraft(cardId, draft);
    }

    setCommittedDraft(cardId, draft);
    return true;
  }

  async function cancelCard(cardId) {
    const def = state.registry.get(cardId);
    if (!def) return false;

    const cardState = ensureCardState(cardId);
    if (!cardState.dirty) {
      refreshActionState(cardId);
      return false;
    }

    const committedDraft = cloneDeep(cardState.committedDraft);

    if (typeof def.applyDraft === "function") {
      await Promise.resolve(def.applyDraft({
        ...buildCardContext(cardId),
        draft: committedDraft,
        committedDraft: committedDraft
      }));
    }

    if (typeof def.onCancel === "function") {
      await Promise.resolve(def.onCancel({
        ...buildCardContext(cardId),
        draft: committedDraft,
        committedDraft: committedDraft
      }));
    }

    setCardDirty(cardId, false);

    queueMicrotask(() => {
      refreshCardState(cardId);
      setCardDirty(cardId, false);
    });

    return true;
  }

  async function autoSaveCard(cardId) {
    const def = state.registry.get(cardId);
    if (!def) return false;

    const actionState = getActionState(cardId);
    if (!actionState.canAutoSave) return false;

    return saveCard(cardId, { mode: "auto" });
  }

  async function applyCommittedDraft(cardId) {
    const def = state.registry.get(cardId);
    const cardState = ensureCardState(cardId);
    if (!def?.applyDraft) return false;

    await Promise.resolve(def.applyDraft({
      ...buildCardContext(cardId),
      draft: cloneDeep(cardState.committedDraft),
      committedDraft: cloneDeep(cardState.committedDraft)
    }));

    queueMicrotask(() => {
      refreshCardState(cardId);
      setCardDirty(cardId, false);
    });

    return true;
  }

  function getActionState(cardId = getActiveCardId()) {
    const def = cardId ? state.registry.get(cardId) : null;
    const cardState = cardId ? ensureCardState(cardId) : null;

    const wizard = window.NTCardWizard?.get?.(cardId) || { step: 0, total: 1 };
    const hasWizard = Number(wizard.total || 1) > 1;

    const dirty = Boolean(cardState?.dirty);
    const canSave = dirty && typeof def?.onSave === "function";
    const canAutoSave = dirty && typeof (def?.onAutoSave || def?.onSave) === "function";
    const canCancel = dirty && (typeof def?.applyDraft === "function" || typeof def?.onCancel === "function");

    return {
      cardId,
      dirty,
      hasWizard,
      canClose: true,
      canSave,
      canAutoSave,
      canCancel,
      canBack: hasWizard && Boolean(window.NTCardWizard?.canPrev?.(cardId)),
      canNext: hasWizard && Boolean(window.NTCardWizard?.canNext?.(cardId))
    };
  }

  function refreshActionState(cardId = getActiveCardId()) {
    if (!cardId) return;

    const actionState = getActionState(cardId);

    document.dispatchEvent(new CustomEvent("nt:cardstate", {
      detail: {
        cardId,
        ...actionState
      }
    }));
  }

  function emitCardState(cardId) {
    const cardState = ensureCardState(cardId);

    document.dispatchEvent(new CustomEvent("nt:carddirtychange", {
      detail: {
        cardId,
        dirty: Boolean(cardState.dirty)
      }
    }));
  }

  function stableStringify(value) {
    try {
      return JSON.stringify(sortKeysDeep(value));
    } catch {
      return String(value);
    }
  }

  function sortKeysDeep(value) {
    if (Array.isArray(value)) {
      return value.map(sortKeysDeep);
    }

    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce((acc, key) => {
          acc[key] = sortKeysDeep(value[key]);
          return acc;
        }, {});
    }

    return value;
  }

  function cloneDeep(value) {
    if (value == null) return value;

    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch {}
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }

  return {
    setElements,
    registerCard,
    openCard,
    closeCard,
    closeActiveCard,
    focusCard,
    goNextCard,
    goPrevCard,
    goToCard,
    getActiveCardId,
    getActiveCardDef,
    getCardRoot,
    getRuntime,
    addCleanup,
    addInterval,
    addTimeout,
    addRaf,
    addObserver,
    isOpen,
    getViewportWidth,
    getTranslateXForIndex,

    getDraft,
    refreshCardState,
    setCommittedDraft,
    setCardDirty,
    getActionState,
    refreshActionState,
    saveCard,
    autoSaveCard,
    cancelCard,
    applyCommittedDraft,

    get state() {
      return state;
    }
  };
})();