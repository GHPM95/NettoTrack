/* =========================
   NettoTrack Cards Manager
   ========================= */

window.NTCards = (() => {
  const state = {
    registry: new Map(),
    openCards: [],
    activeIndex: -1,
    viewportEl: null,
    trackEl: null,
    dotsHook: null,
    runtime: new Map()
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
      onCancel: config.onCancel || null,
      onBack: config.onBack || null,
      onNext: config.onNext || null,
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

  function focusCard(cardId) {
    const idx = state.openCards.indexOf(cardId);
    if (idx === -1) return false;

    state.activeIndex = idx;
    syncTrack();
    emitCardChange();
    pulseCurrentCard();
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
      def.onOpen({
        cardId,
        runtime,
        signal: runtime.signal,
        addCleanup: (fn) => addCleanup(cardId, fn),
        addInterval: (id) => addInterval(cardId, id),
        addTimeout: (id) => addTimeout(cardId, id),
        addRaf: (id) => addRaf(cardId, id),
        addObserver: (observer) => addObserver(cardId, observer)
      });
    }

    emitCardChange();
    pulseCurrentCard();
    return true;
  }

  function closeCard(cardId) {
    const idx = state.openCards.indexOf(cardId);
    if (idx === -1) return false;

    const def = state.registry.get(cardId);
    const runtime = getRuntime(cardId);

    if (def?.onClose) {
      try {
        def.onClose({
          cardId,
          runtime,
          signal: runtime?.signal || null
        });
      } catch {}
    }

    cleanupRuntime(cardId);
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
    return true;
  }

  function render() {
    if (!state.trackEl) return;

    const html = state.openCards.map((cardId) => {
      const def = state.registry.get(cardId);
      const content = def ? def.render() : "";

      return `
        <section class="ntCardSlide" data-card-id="${escapeHtml(cardId)}">
          ${content}
        </section>
      `;
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
    getRuntime,
    addCleanup,
    addInterval,
    addTimeout,
    addRaf,
    addObserver,
    isOpen,
    getViewportWidth,
    getTranslateXForIndex,
    get state() {
      return state;
    }
  };
})();