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

  // --------------------------
  // Slides helpers
  // --------------------------
  function getSlides() {
    return Array.from(cardsTrack.querySelectorAll(".slide"));
  }

  function getSlideById(id) {
    return getSlides().find(s => s.dataset.slideId === id) || null;
  }

  function getSlideIndexById(id) {
    return getSlides().findIndex(s => s.dataset.slideId === id);
  }

  function ensureSlide({ id, title }) {
    const existing = getSlideById(id);
    if (existing) return existing;

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
    const s = getSlideById(id);
    if (s && id !== "home") s.remove();
  }

  // --------------------------
  // Menu metric (X affianco drawer)
  // --------------------------
  function syncMenuWidthVar() {
    const w = menuDrawer.getBoundingClientRect().width || 0;
    root.style.setProperty("--menuW", `${Math.round(w)}px`);
  }

  // --------------------------
  // iOS repaint helper (generico)
  // --------------------------
  function forceRepaint() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          cardsViewport.style.transform = "translateZ(0)";
          // eslint-disable-next-line no-unused-expressions
          cardsViewport.offsetHeight;
          cardsViewport.style.transform = "";
        } catch {}
      });
    });
  }

  // --------------------------
  // Home visibility logic
  // --------------------------
  let homeHidden = false;

  function setHomeHidden(on) {
    const home = getSlideById("home");
    homeHidden = !!on;

    if (!home) return;

    if (homeHidden) {
      // invisibile, non cliccabile, non “sporca” visivamente
      home.style.opacity = "0";
      home.style.pointerEvents = "none";
      home.style.visibility = "hidden";
    } else {
      home.style.opacity = "";
      home.style.pointerEvents = "";
      home.style.visibility = "";
    }
  }

  function updateHomeVisibility() {
    const slides = getSlides();
    const shouldHide = slides.some(s => s.dataset.slideId !== "home");

    setHomeHidden(shouldHide);

    // Se home è nascosta e per caso sei su home, spostati sulla prima non-home
    if (homeHidden && currentSlideId() === "home") {
      const firstNonHome = slides.find(s => s.dataset.slideId !== "home");
      if (firstNonHome) {
        const idx = getSlideIndexById(firstNonHome.dataset.slideId);
        if (idx >= 0) {
          activeIndex = idx;
          setActiveIndex(activeIndex);
          computeGap();
          applyTrackX(trackXForIndex(activeIndex), false);
        }
      }
    }
  }

  // --------------------------
  // Dots
  // --------------------------
  let activeIndex = 0;

  function visibleSlidesForDots() {
    const slides = getSlides();
    // quando home è nascosta, non mostriamo il suo dot (evita “dot fantasma”)
    return homeHidden ? slides.filter(s => s.dataset.slideId !== "home") : slides;
  }

  function renderDots() {
    const slides = visibleSlidesForDots();
    dotsPill.innerHTML = "";

    slides.forEach((s) => {
      const d = document.createElement("div");
      d.className = "dot";
      d.dataset.id = s.dataset.slideId || "";

      d.title = s.dataset.title || s.dataset.slideId || "";

      d.addEventListener("click", () => {
        // click dot = vai a quella slide
        const id = d.dataset.id;
        if (id) goToSlideId(id, { fromUser: true });
      });

      dotsPill.appendChild(d);
    });

    // aggiorna “attivo” dopo render
    syncDotsActive();
  }

  function syncDotsActive() {
    const id = currentSlideId();
    Array.from(dotsPill.children).forEach(dot => {
      dot.classList.toggle("isActive", dot.dataset.id === id);
    });
  }

  function setActiveIndex(i) {
    const slides = getSlides();
    activeIndex = clamp(i, 0, slides.length - 1);

    slides.forEach((s, idx) => s.classList.toggle("isActive", idx === activeIndex));
    syncDotsActive();
  }

  // --------------------------
  // Track positioning
  // --------------------------
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

    // quando home è nascosta, non permettere di atterrare su home
    if (homeHidden) {
      const slides = getSlides();
      const homeIdx = getSlideIndexById("home");
      if (homeIdx === i) {
        // vai alla prima non-home
        const firstNonHome = slides.find(s => s.dataset.slideId !== "home");
        i = firstNonHome ? getSlideIndexById(firstNonHome.dataset.slideId) : i;
      }
    }

    setActiveIndex(i);
    applyTrackX(trackXForIndex(activeIndex), true);

    const id = currentSlideId();
    document.dispatchEvent(new CustomEvent("nettotrack:slideChanged", { detail: { id } }));

    forceRepaint();
  }

  function goToSlideId(id, opts={}) {
    const idx = getSlideIndexById(id);
    if (idx >= 0) goTo(idx, opts);
  }

  // --------------------------
  // Swipe / drag
  // --------------------------
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

    // Se home è nascosta, impedisci swipe su home
    if (homeHidden && slides[nextIndex]?.dataset?.slideId === "home") {
      // rimani dove sei
      nextIndex = activeIndex;
    }

    goTo(nextIndex, { fromUser: false });
  }

  cardsViewport.addEventListener("pointerdown", onPointerDown, { passive: true });
  cardsViewport.addEventListener("pointermove", onPointerMove, { passive: true });
  cardsViewport.addEventListener("pointerup", onPointerUp, { passive: true });
  cardsViewport.addEventListener("pointercancel", onPointerUp, { passive: true });

  // --------------------------
  // Dots drag feedback (opzionale, resta)
  // --------------------------
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

    const allSlides = getSlides();
    const curId = currentSlideId();

    // costruisci una lista di slide “navigabili” (se homeHidden, escludi home)
    const nav = homeHidden ? allSlides.filter(s => s.dataset.slideId !== "home") : allSlides;
    if (nav.length <= 1) return;

    const curNavIndex = nav.findIndex(s => s.dataset.slideId === curId);
    if (curNavIndex < 0) return;

    const dx = e.clientX - dotsStartX;
    const t = 34;

    if (dx <= -t) {
      dotsStartX = e.clientX;
      const next = clamp(curNavIndex + 1, 0, nav.length - 1);
      goToSlideId(nav[next].dataset.slideId, { fromUser: true });
    }
    if (dx >= t) {
      dotsStartX = e.clientX;
      const prev = clamp(curNavIndex - 1, 0, nav.length - 1);
      goToSlideId(nav[prev].dataset.slideId, { fromUser: true });
    }
  }, { passive: true });

  function endDotsDrag() {
    dotsDragging = false;
    dotsPill.classList.remove("isPressing");
  }
  dotsPill.addEventListener("pointerup", endDotsDrag, { passive: true });
  dotsPill.addEventListener("pointercancel", endDotsDrag, { passive: true });

  // --------------------------
  // Menu open/close
  // --------------------------
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

  // --------------------------
  // No pinch zoom / no double tap zoom
  // --------------------------
  document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("gesturechange", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("gestureend", (e) => e.preventDefault(), { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // --------------------------
  // Public API
  // --------------------------
  function openCalendarInsert() {
    ensureSlide({ id: "calInsert", title: "Calendario" });
    updateHomeVisibility();
    renderDots();
    goToSlideId("calInsert", { fromUser:true });
    document.dispatchEvent(new Event("nettotrack:calendarInsertOpened"));
    forceRepaint();
  }

  function openCalendarView() {
    ensureSlide({ id: "calView", title: "Agenda" });
    updateHomeVisibility();
    renderDots();
    goToSlideId("calView", { fromUser:true });
    document.dispatchEvent(new Event("nettotrack:calendarViewOpened"));
    forceRepaint();
  }

  function openDayEditor(dateKey) {
    ensureSlide({ id: "dayEditor", title: "Turni" });
    updateHomeVisibility();
    renderDots();
    goToSlideId("dayEditor", { fromUser:true });
    document.dispatchEvent(new CustomEvent("nettotrack:dayEditorOpened", { detail: { dateKey } }));
    forceRepaint();
  }

  function closeSlide(id, fallbackId="home") {
    const idx = getSlideIndexById(id);
    const wasActive = idx === activeIndex;

    removeSlide(id);

    // dopo remove, aggiorna visibilità home (se restano slide non-home, home resta nascosta)
    updateHomeVisibility();

    renderDots();

    const slides = getSlides();
    if (!slides.length) return;

    if (wasActive) {
      // fallback: se home è nascosta, fallback deve essere la prima non-home (se esiste)
      let targetId = fallbackId;

      if (homeHidden && targetId === "home") {
        const firstNonHome = slides.find(s => s.dataset.slideId !== "home");
        targetId = firstNonHome ? firstNonHome.dataset.slideId : "home";
      }

      const fb = getSlideIndexById(targetId);
      activeIndex = clamp(fb >= 0 ? fb : 0, 0, slides.length - 1);
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

    // se ora resta SOLO home -> rendila visibile e riallinea su home
    if (!slides.some(s => s.dataset.slideId !== "home")) {
      setHomeHidden(false);
      activeIndex = 0;
      setActiveIndex(0);
      computeGap();
      applyTrackX(trackXForIndex(0), false);
      renderDots();
    }

    forceRepaint();
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

  // --------------------------
  // Init
  // --------------------------
  computeGap();
  setActiveIndex(0);

  // visibilità home + dots
  updateHomeVisibility();
  renderDots();

  applyTrackX(trackXForIndex(0), false);

  window.addEventListener("resize", () => {
    computeGap();
    applyTrackX(trackXForIndex(activeIndex), false);
    syncMenuWidthVar();
    forceRepaint();
  });

  // Safari iOS: ritorno da cache
  window.addEventListener("pageshow", () => {
    computeGap();
    updateHomeVisibility();
    renderDots();
    applyTrackX(trackXForIndex(activeIndex), false);
    forceRepaint();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      computeGap();
      updateHomeVisibility();
      renderDots();
      applyTrackX(trackXForIndex(activeIndex), false);
      forceRepaint();
    }
  });

  syncMenuWidthVar();
})();