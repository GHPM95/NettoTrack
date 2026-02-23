(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const body = document.body;
  const root = document.documentElement;

  /* =====================================================
     MENU
     ===================================================== */

  const menuBtn      = $("#menuBtn");
  const menuDrawer   = $("#menuDrawer");
  const menuOverlay  = $("#menuOverlay");
  const menuCloseBtn = $("#menuCloseBtn");

  function syncMenuWidthVar() {
    if (!menuDrawer) return;
    const w = menuDrawer.getBoundingClientRect().width || 0;
    root.style.setProperty("--menuW", `${Math.round(w)}px`);
  }

  function openMenu() {
    body.classList.add("isMenuOpen");
    menuDrawer?.setAttribute("aria-hidden", "false");
    menuOverlay?.setAttribute("aria-hidden", "false");
    syncMenuWidthVar();
    requestAnimationFrame(syncMenuWidthVar);
    setTimeout(syncMenuWidthVar, 260);
    document.dispatchEvent(new Event("nettotrack:refreshMenu"));
  }

  function closeMenu() {
    body.classList.remove("isMenuOpen");
    menuDrawer?.setAttribute("aria-hidden", "true");
    menuOverlay?.setAttribute("aria-hidden", "true");
    syncMenuWidthVar();
  }

  menuBtn?.addEventListener("click", () => {
    body.classList.contains("isMenuOpen") ? closeMenu() : openMenu();
  });
  menuCloseBtn?.addEventListener("click", closeMenu);
  menuOverlay?.addEventListener("click", closeMenu);

  /* =====================================================
     CARDS / SLIDER
     ===================================================== */

  const cardsViewport = $("#cardsViewport");
  const cardsTrack    = $("#cardsTrack");
  const dotsPill      = $("#dotsPill");

  if (!cardsViewport || !cardsTrack || !dotsPill) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  let activeIndex = 0;
  let gapPx = 18;

  function getSlides() {
    return Array.from(cardsTrack.querySelectorAll(".slide"));
  }

  function getSlideIndexById(id) {
    return getSlides().findIndex(s => s.dataset.slideId === id);
  }

  function ensureSlide({ id, title }) {
    const idx = getSlideIndexById(id);
    if (idx >= 0) return getSlides()[idx];

    const art = document.createElement("article");
    art.className = "card slide";
    art.dataset.slideId = id;
    art.dataset.title = title || id;

    const inner = document.createElement("div");
    inner.className = "cardInner";

    const mount = document.createElement("div");
    mount.className = "cardMount";
    mount.id = `${id}Mount`;

    inner.appendChild(mount);
    art.appendChild(inner);

    cardsTrack.appendChild(art);
    renderDots();
    return art;
  }

  function removeSlide(id) {
    const s = getSlides().find(x => x.dataset.slideId === id);
    if (s && id !== "home") s.remove();
  }

  function computeGap() {
    const cs = getComputedStyle(cardsTrack);
    const g = parseFloat(cs.columnGap || cs.gap || "18");
    if (!Number.isNaN(g)) gapPx = g;
  }

  function slideWidth() {
    return cardsViewport.getBoundingClientRect().width;
  }

  function trackXForIndex(i) {
    return -(i * (slideWidth() + gapPx));
  }

  function applyTrackX(x, withTransition) {
    cardsTrack.style.transition = withTransition
      ? "transform .28s cubic-bezier(.2,.8,.2,1)"
      : "none";
    cardsTrack.style.transform = `translate3d(${x}px,0,0)`;
  }

  function setActiveIndex(i) {
    const slides = getSlides();
    activeIndex = clamp(i, 0, slides.length - 1);

    slides.forEach((s, idx) => s.classList.toggle("isActive", idx === activeIndex));
    Array.from(dotsPill.children).forEach((d, idx) => d.classList.toggle("isActive", idx === activeIndex));
  }

  function currentSlideId() {
    return getSlides()[activeIndex]?.dataset.slideId || "home";
  }

  function goTo(i, { fromUser = false } = {}) {
    computeGap();

    const slides = getSlides();
    const curId = currentSlideId();
    const homeIndex = getSlideIndexById("home");

    // protezione: quando sei in una card diversa da home, lo swipe non deve “atterrare” su home per errore
    if (!fromUser && curId !== "home" && homeIndex === 0) {
      i = Math.max(1, i);
    }

    setActiveIndex(i);
    applyTrackX(trackXForIndex(activeIndex), true);

    document.dispatchEvent(new CustomEvent("nettotrack:slideChanged", { detail: { id: currentSlideId() } }));
  }

  function goToSlideId(id, opts = {}) {
    const idx = getSlideIndexById(id);
    if (idx >= 0) goTo(idx, opts);
  }

  /* =====================================================
     DOTS
     ===================================================== */

  function renderDots() {
    const slides = getSlides();
    dotsPill.innerHTML = "";
    slides.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "dot" + (i === activeIndex ? " isActive" : "");
      d.title = s.dataset.title || s.dataset.slideId || "";
      d.addEventListener("click", () => goTo(i, { fromUser: true }));
      dotsPill.appendChild(d);
    });
  }

  /* =====================================================
     SWIPE UNIVERSALE (Pointer + Touch + Mouse)
     ===================================================== */

  let isDragging = false;
  let startX = 0;
  let lastX = 0;
  let activePointerId = null;

  function dragStart(clientX, pointerId = null) {
    if (body.classList.contains("isMenuOpen")) return;

    isDragging = true;
    startX = clientX;
    lastX = clientX;
    activePointerId = pointerId;

    cardsTrack.style.transition = "none";
  }

  function dragMove(clientX) {
    if (!isDragging) return;

    const dx = clientX - startX;
    lastX = clientX;

    const base = trackXForIndex(activeIndex);
    const resistance = 0.55;
    applyTrackX(base + dx * resistance, false);
  }

  function dragEnd() {
    if (!isDragging) return;

    isDragging = false;
    activePointerId = null;

    const slides = getSlides();
    const dx = lastX - startX;
    const threshold = Math.max(60, slideWidth() * 0.18);

    let nextIndex = activeIndex;

    if (slides.length > 1) {
      if (dx <= -threshold) nextIndex = clamp(activeIndex + 1, 0, slides.length - 1);
      if (dx >=  threshold) nextIndex = clamp(activeIndex - 1, 0, slides.length - 1);
    }

    goTo(nextIndex, { fromUser: false });
  }

  // Pointer events (se disponibili)
  cardsViewport.addEventListener("pointerdown", (e) => {
    // solo tasto sinistro o touch/pen
    if (e.pointerType === "mouse" && e.button !== 0) return;

    try { cardsViewport.setPointerCapture(e.pointerId); } catch {}
    dragStart(e.clientX, e.pointerId);
  });

  cardsViewport.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    if (activePointerId != null && e.pointerId !== activePointerId) return;
    dragMove(e.clientX);
  });

  cardsViewport.addEventListener("pointerup", (e) => {
    if (activePointerId != null && e.pointerId !== activePointerId) return;
    try { cardsViewport.releasePointerCapture(e.pointerId); } catch {}
    dragEnd();
  });

  cardsViewport.addEventListener("pointercancel", () => dragEnd());

  // Touch fallback (iPhone) — IMPORTANT: passive:false per permettere preventDefault
  cardsViewport.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length === 1) {
      dragStart(e.touches[0].clientX, "touch");
    }
  }, { passive: true });

  cardsViewport.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    if (e.touches && e.touches.length === 1) {
      // blocca lo scroll orizzontale del browser
      e.preventDefault();
      dragMove(e.touches[0].clientX);
    }
  }, { passive: false });

  cardsViewport.addEventListener("touchend", () => dragEnd(), { passive: true });
  cardsViewport.addEventListener("touchcancel", () => dragEnd(), { passive: true });

  // Mouse fallback (PC) — per ambienti che non gestiscono bene pointer events
  cardsViewport.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    dragStart(e.clientX, "mouse");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    if (activePointerId !== "mouse") return;
    dragMove(e.clientX);
  });

  window.addEventListener("mouseup", () => {
    if (activePointerId !== "mouse") return;
    dragEnd();
  });

  /* =====================================================
     EVENTI DAL MENU → APERTURA CARD
     ===================================================== */

  function openCalendarInsert() {
    ensureSlide({ id: "calInsert", title: "Calendario" });
    renderDots();
    goToSlideId("calInsert", { fromUser: true });
    document.dispatchEvent(new Event("nettotrack:calendarInsertOpened"));
  }

  function openCalendarView() {
    ensureSlide({ id: "calView", title: "Agenda" });
    renderDots();
    goToSlideId("calView", { fromUser: true });
    document.dispatchEvent(new Event("nettotrack:calendarViewOpened"));
  }

  function openDayEditor(dateKey) {
    ensureSlide({ id: "dayEditor", title: "Turni" });
    renderDots();
    goToSlideId("dayEditor", { fromUser: true });
    document.dispatchEvent(new CustomEvent("nettotrack:dayEditorOpened", { detail: { dateKey } }));
  }

  function closeSlide(id, fallbackId = "home") {
    const idx = getSlideIndexById(id);
    const wasActive = idx === activeIndex;

    removeSlide(id);
    renderDots();

    const slides = getSlides();
    if (!slides.length) return;

    if (wasActive) {
      const fb = getSlideIndexById(fallbackId);
      activeIndex = clamp(fb >= 0 ? fb : 0, 0, slides.length - 1);
      setActiveIndex(activeIndex);
      computeGap();
      applyTrackX(trackXForIndex(activeIndex), false);
    } else {
      activeIndex = clamp(activeIndex, 0, slides.length - 1);
      setActiveIndex(activeIndex);
      computeGap();
      applyTrackX(trackXForIndex(activeIndex), false);
    }
  }

  document.addEventListener("nettotrack:openCalendarInsert", openCalendarInsert);
  document.addEventListener("nettotrack:openCalendarView", openCalendarView);
  document.addEventListener("nettotrack:closeCalendarInsert", () => closeSlide("calInsert"));
  document.addEventListener("nettotrack:closeCalendarView", () => closeSlide("calView"));
  document.addEventListener("nettotrack:closeDayEditor", () => closeSlide("dayEditor", "calInsert"));

  /* =====================================================
     API PUBBLICA
     ===================================================== */

  window.NettoTrackUI = {
    ensureSlide,
    goToSlideId,
    openCalendarInsert,
    openCalendarView,
    openDayEditor,
    closeSlide,
    getActiveSlideId: currentSlideId
  };

  /* =====================================================
     INIT
     ===================================================== */

  computeGap();
  setActiveIndex(0);
  renderDots();
  applyTrackX(trackXForIndex(0), false);
  syncMenuWidthVar();

  window.addEventListener("resize", () => {
    computeGap();
    applyTrackX(trackXForIndex(activeIndex), false);
    syncMenuWidthVar();
  });

})();
