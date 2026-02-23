(() => {
  const $ = (sel, root=document) => root.querySelector(sel);

  const body = document.body;
  const root = document.documentElement;

  const menuBtn = $("#menuBtn");
  const menuDrawer = $("#menuDrawer");
  const menuOverlay = $("#menuOverlay");
  const menuCloseBtn = $("#menuCloseBtn");

  const cardsViewport = $("#cardsViewport");
  const cardsTrack = $("#cardsTrack");
  const dotsPill = $("#dotsPill");

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

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
    return art;
  }

  function removeSlide(id) {
    const s = getSlides().find(x => x.dataset.slideId === id);
    if (s && id !== "home") s.remove();
  }

  // --- menu metric (X affianco al drawer)
  function syncMenuWidthVar() {
    const w = menuDrawer.getBoundingClientRect().width || 0;
    root.style.setProperty("--menuW", `${Math.round(w)}px`);
  }

  // ============================
  // HOME VISIBILITY (MINIMA)
  // ============================
  function setHomeHidden(on) {
    const home = cardsTrack.querySelector('.slide[data-slide-id="home"]');
    if (!home) return;

    if (on) {
      home.style.opacity = "0";
      home.style.visibility = "hidden";
      home.style.pointerEvents = "none";
    } else {
      home.style.opacity = "";
      home.style.visibility = "";
      home.style.pointerEvents = "";
    }
  }

  function hasExtraSlides() {
    return getSlides().some(s => s.dataset.slideId !== "home");
  }

  // ============================
  // DOTS (Safari iOS fix)
  // ============================
  let rafDots = 0;

  function scheduleDotsSync() {
    if (rafDots) cancelAnimationFrame(rafDots);

    // Safari iOS: a volte non ridisegna se tocchi visibility + transform nello stesso tick
    // Forziamo un micro reflow e ridisegniamo al frame successivo.
    // (Non cambia grafica, è solo un “refresh”.)
    void dotsPill?.offsetWidth;

    rafDots = requestAnimationFrame(() => {
      rafDots = 0;
      renderDots();
      syncActiveDot();
    });
  }

  let activeIndex = 0;

  function renderDots() {
    const slides = getSlides();

    // Se esistono altre card oltre home, non disegnare il dot di home
    const showHomeDot = !hasExtraSlides();
    const dotsSlides = showHomeDot ? slides : slides.filter(s => s.dataset.slideId !== "home");

    dotsPill.innerHTML = "";

    dotsSlides.forEach((s) => {
      const d = document.createElement("div");
      d.className = "dot";
      d.dataset.slideId = s.dataset.slideId;

      if (s.dataset.slideId === currentSlideId()) d.classList.add("isActive");

      d.title = s.dataset.title || s.dataset.slideId || "";
      d.addEventListener("click", () => goToSlideId(s.dataset.slideId, { fromUser: true }));

      dotsPill.appendChild(d);
    });
  }

  function syncActiveDot() {
    const id = currentSlideId();
    Array.from(dotsPill.children).forEach((d) => {
      d.classList.toggle("isActive", d.dataset.slideId === id);
    });
  }

  function setActiveIndex(i) {
    const slides = getSlides();
    activeIndex = clamp(i, 0, slides.length - 1);

    slides.forEach((s, idx) => s.classList.toggle("isActive", idx === activeIndex));
    syncActiveDot();
  }

  // --- track positioning
  let gapPx = 18;

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
    cardsTrack.style.transition = withTransition ? "transform .28s cubic-bezier(.2,.8,.2,1)" : "none";
    cardsTrack.style.transform = `translate3d(${x}px,0,0)`;
  }

  function currentSlideId() {
    return getSlides()[activeIndex]?.dataset.slideId || "home";
  }

  function goTo(i, { fromUser=false } = {}) {
    computeGap();

    // evita home “di swipe” quando ci sono altre card
    const curId = currentSlideId();
    const homeIndex = getSlideIndexById("home");
    if (!fromUser && curId !== "home" && homeIndex === 0) {
      i = Math.max(1, i);
    }

    setActiveIndex(i);
    applyTrackX(trackXForIndex(activeIndex), true);

    const id = currentSlideId();
    document.dispatchEvent(new CustomEvent("nettotrack:slideChanged", { detail: { id } }));

    // ✅ refresh dots (con fix iOS)
    scheduleDotsSync();
  }

  function goToSlideId(id, opts={}) {
    const idx = getSlideIndexById(id);
    if (idx >= 0) goTo(idx, opts);
  }

  // --- swipe / drag
  let isDragging = false;
  let startX = 0;
  let lastX = 0;

  function onPointerDown(e) {
    if (body.classList.contains("isMenuOpen")) return;
    isDragging = true;
    startX = e.clientX;
    lastX = startX;
    cardsTrack.setPointerCapture?.(e.pointerId);
    cardsTrack.style.transition = "none";
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const x = e.clientX;
    const dx = x - startX;
    lastX = x;

    const base = trackXForIndex(activeIndex);
    const resistance = 0.55;
    applyTrackX(base + dx * resistance, false);
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;

    const slides = getSlides();
    const dx = lastX - startX;
    const threshold = Math.max(60, slideWidth() * 0.18);

    let nextIndex = activeIndex;

    if (slides.length > 1) {
      if (dx <= -threshold) nextIndex = clamp(activeIndex + 1, 0, slides.length - 1);
      if (dx >= threshold)  nextIndex = clamp(activeIndex - 1, 0, slides.length - 1);
    }

    goTo(nextIndex, { fromUser: false });
  }

  cardsViewport.addEventListener("pointerdown", onPointerDown, { passive: true });
  cardsViewport.addEventListener("pointermove", onPointerMove, { passive: true });
  cardsViewport.addEventListener("pointerup", onPointerUp, { passive: true });
  cardsViewport.addEventListener("pointercancel", onPointerUp, { passive: true });

  // --- dots drag feedback
  let dotsDragging = false;
  let dotsStartX = 0;

  dotsPill.addEventListener("pointerdown", (e) => {
    dotsDragging = true;
    dotsStartX = e.clientX;
    dotsPill.classList.add("isPressing");
    dotsPill.setPointerCapture?.(e.pointerId);
  }, { passive: true });

  dotsPill.addEventListener("pointermove", (e) => {
    if (!dotsDragging) return;
    const slides = getSlides();
    if (slides.length <= 1) return;

    const dx = e.clientX - dotsStartX;
    const t = 34;
    if (dx <= -t) { dotsStartX = e.clientX; goTo(activeIndex + 1, { fromUser:true }); }
    if (dx >=  t) { dotsStartX = e.clientX; goTo(activeIndex - 1, { fromUser:true }); }
  }, { passive: true });

  function endDotsDrag() {
    dotsDragging = false;
    dotsPill.classList.remove("isPressing");
  }
  dotsPill.addEventListener("pointerup", endDotsDrag, { passive: true });
  dotsPill.addEventListener("pointercancel", endDotsDrag, { passive: true });

  // --- menu open/close
  function openMenu() {
    body.classList.add("isMenuOpen");
    menuDrawer.setAttribute("aria-hidden", "false");
    menuOverlay.setAttribute("aria-hidden", "false");

    syncMenuWidthVar();
    requestAnimationFrame(syncMenuWidthVar);
    setTimeout(syncMenuWidthVar, 280);
  }

  function closeMenu() {
    body.classList.remove("isMenuOpen");
    menuDrawer.setAttribute("aria-hidden", "true");
    menuOverlay.setAttribute("aria-hidden", "true");
    syncMenuWidthVar();
  }

  menuBtn.addEventListener("click", () => {
    if (body.classList.contains("isMenuOpen")) closeMenu();
    else openMenu();
  });
  menuCloseBtn.addEventListener("click", closeMenu);
  menuOverlay.addEventListener("click", () => {
    if (body.classList.contains("isMenuOpen")) closeMenu();
  });

  // --- no pinch zoom / no double tap zoom
  document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("gesturechange", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("gestureend", (e) => e.preventDefault(), { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // --- public API
  function openCalendarInsert() {
    ensureSlide({ id: "calInsert", title: "Calendario" });
    setHomeHidden(true);
    scheduleDotsSync();
    goToSlideId("calInsert", { fromUser:true });
    document.dispatchEvent(new Event("nettotrack:calendarInsertOpened"));
  }

  function openCalendarView() {
    ensureSlide({ id: "calView", title: "Agenda" });
    setHomeHidden(true);
    scheduleDotsSync();
    goToSlideId("calView", { fromUser:true });
    document.dispatchEvent(new Event("nettotrack:calendarViewOpened"));
  }

  function openDayEditor(dateKey) {
    ensureSlide({ id: "dayEditor", title: "Turni" });
    setHomeHidden(true);
    scheduleDotsSync();
    goToSlideId("dayEditor", { fromUser:true });
    document.dispatchEvent(new CustomEvent("nettotrack:dayEditorOpened", { detail: { dateKey } }));
  }

  function closeSlide(id, fallbackId="home") {
    const idx = getSlideIndexById(id);
    const wasActive = idx === activeIndex;

    removeSlide(id);

    const slides = getSlides();
    const anyExtra = slides.some(s => s.dataset.slideId !== "home");

    // se non ci sono più card oltre home, home torna visibile
    setHomeHidden(anyExtra);

    if (!slides.length) return;

    if (wasActive) {
      const fb = getSlideIndexById(fallbackId);
      activeIndex = clamp(fb >= 0 ? fb : 0, 0, slides.length - 1);

      // se fallback è home ma home è nascosta, vai alla prima card “vera”
      if (anyExtra && (slides[activeIndex]?.dataset.slideId === "home")) {
        activeIndex = Math.max(1, activeIndex);
      }

      setActiveIndex(activeIndex);
      computeGap();
      applyTrackX(trackXForIndex(activeIndex), false);

      document.dispatchEvent(new CustomEvent("nettotrack:slideChanged", { detail: { id: currentSlideId() } }));
    } else {
      activeIndex = clamp(activeIndex, 0, slides.length - 1);
      setActiveIndex(activeIndex);
      computeGap();
      applyTrackX(trackXForIndex(activeIndex), false);
    }

    // ✅ refresh dots (con fix iOS)
    scheduleDotsSync();
  }

  // events used by menu.js
  document.addEventListener("nettotrack:openCalendarInsert", openCalendarInsert);
  document.addEventListener("nettotrack:openCalendarView", openCalendarView);
  document.addEventListener("nettotrack:closeCalendarInsert", () => closeSlide("calInsert"));
  document.addEventListener("nettotrack:closeCalendarView", () => closeSlide("calView"));
  document.addEventListener("nettotrack:closeDayEditor", () => closeSlide("dayEditor", "calInsert"));

  window.NettoTrackUI = {
    ensureSlide,
    goToSlideId,
    openCalendarInsert,
    openCalendarView,
    openDayEditor,
    closeSlide,
    getActiveSlideId: currentSlideId
  };

  // init
  computeGap();
  setActiveIndex(0);

  setHomeHidden(false);
  scheduleDotsSync();

  applyTrackX(trackXForIndex(0), false);

  window.addEventListener("resize", () => {
    computeGap();
    applyTrackX(trackXForIndex(activeIndex), false);
    syncMenuWidthVar();
    scheduleDotsSync(); // Safari a volte “perde” il repaint
  });

  syncMenuWidthVar();
})();