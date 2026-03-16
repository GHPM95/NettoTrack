/* =========================
   NettoTrack Card Gestures
   swipe + sync smart dots
   ========================= */

window.NTCardGestures = (() => {
  let viewportEl = null;
  let holdTimer = null;
  let armedCardId = null;

  const gesture = {
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    tracking: false,
    lock: null,
    baseTranslateX: 0,
    allowInnerXScroll: false
  };

  function setViewport(el) {
    viewportEl = el;
    bind();
  }

  function bind() {
    if (!viewportEl || viewportEl.dataset.ntGesturesBound === "true") return;

    viewportEl.dataset.ntGesturesBound = "true";

    viewportEl.addEventListener("touchstart", onStart, { passive: true });
    viewportEl.addEventListener("touchmove", onMove, { passive: false });
    viewportEl.addEventListener("touchend", onEnd, { passive: true });
    viewportEl.addEventListener("touchcancel", onCancel, { passive: true });

    viewportEl.addEventListener("pointerdown", onPointerDown);
  }

  function onStart(e) {
    const t = e.touches[0];
    if (!t) return;

    gesture.startX = t.clientX;
    gesture.startY = t.clientY;
    gesture.deltaX = 0;
    gesture.deltaY = 0;
    gesture.tracking = true;
    gesture.lock = null;

    const activeIndex = window.NTCards?.state?.activeIndex ?? 0;
    gesture.baseTranslateX = window.NTCards?.getTranslateXForIndex?.(activeIndex) ?? 0;

    const target = e.target;
    gesture.allowInnerXScroll = !!target?.closest?.('[data-nt-allow-x-scroll="true"]');

    const trackEl = window.NTCards?.state?.trackEl;
    if (trackEl) {
      trackEl.style.transition = "none";
    }
  }

  function onMove(e) {
    if (!gesture.tracking) return;

    const t = e.touches[0];
    if (!t) return;

    gesture.deltaX = t.clientX - gesture.startX;
    gesture.deltaY = t.clientY - gesture.startY;

    if (!gesture.lock) {
      if (Math.abs(gesture.deltaX) > 10 || Math.abs(gesture.deltaY) > 10) {
        gesture.lock = Math.abs(gesture.deltaX) > Math.abs(gesture.deltaY) ? "x" : "y";
      }
    }

    if (gesture.allowInnerXScroll && gesture.lock === "x") {
      return;
    }

    if (gesture.lock === "x") {
      e.preventDefault();
      dragTrackWithFinger();
      syncDotsWithDrag();
      return;
    }

    if (armedCardId && gesture.lock === "y" && gesture.deltaY > 0) {
      const activeId = window.NTCards?.getActiveCardId?.();
      if (activeId !== armedCardId) return;

      const activeSlide = viewportEl?.querySelector?.(`[data-card-id="${activeId}"]`);
      if (activeSlide) {
        activeSlide.style.transform = `translateY(${gesture.deltaY}px)`;
      }

      e.preventDefault();
    }
  }

  function onEnd() {
    if (!gesture.tracking) return;

    restoreTrackTransition();

    if (!gesture.allowInnerXScroll && !armedCardId && gesture.lock === "x") {
      const width = viewportEl?.clientWidth || 1;
      const threshold = Math.min(90, width * 0.18);

      if (gesture.deltaX < -threshold) {
        if (!window.NTCards?.goNextCard?.()) {
          snapBackTrack();
        }
      } else if (gesture.deltaX > threshold) {
        if (!window.NTCards?.goPrevCard?.()) {
          snapBackTrack();
        }
      } else {
        snapBackTrack();
      }
    } else {
      snapBackTrack();
    }

    if (armedCardId) {
      const activeId = window.NTCards?.getActiveCardId?.();
      const activeSlide = viewportEl?.querySelector?.(`[data-card-id="${activeId}"]`);

      if (activeSlide) {
        if (gesture.deltaY > 100) {
          activeSlide.style.transform = "";
          disarmCloseMode();

          if (window.NTCardManager?.closeActive) {
            window.NTCardManager.closeActive();
          } else {
            window.NTCards?.closeActiveCard?.();
          }
        } else {
          activeSlide.style.transform = "";
        }
      }
    }

    syncDotsToActiveCard();
    resetGesture();
  }

  function onCancel() {
    restoreTrackTransition();
    snapBackTrack();
    syncDotsToActiveCard();
    resetGesture();
  }

  function resetGesture() {
    gesture.tracking = false;
    gesture.lock = null;
    gesture.deltaX = 0;
    gesture.deltaY = 0;
    gesture.allowInnerXScroll = false;
  }

  function dragTrackWithFinger() {
    const trackEl = window.NTCards?.state?.trackEl;
    if (!trackEl) return;

    const nextTranslateX = gesture.baseTranslateX + gesture.deltaX;
    trackEl.style.transform = `translate3d(${nextTranslateX}px,0,0)`;
  }

  function snapBackTrack() {
    const trackEl = window.NTCards?.state?.trackEl;
    const activeIndex = window.NTCards?.state?.activeIndex ?? 0;
    if (!trackEl) return;

    const x = window.NTCards?.getTranslateXForIndex?.(activeIndex) ?? 0;
    trackEl.style.transform = `translate3d(${x}px,0,0)`;
  }

  function restoreTrackTransition() {
    const trackEl = window.NTCards?.state?.trackEl;
    if (!trackEl) return;

    trackEl.style.transition = "transform .22s ease";
  }

  function syncDotsWithDrag() {
    const width = viewportEl?.clientWidth || 1;
    const activeIndex = window.NTCards?.state?.activeIndex ?? 0;

    const progress = activeIndex - (gesture.deltaX / width);

    if (window.NTCardDots?.syncFromProgress) {
      window.NTCardDots.syncFromProgress(progress);
    }
  }

  function syncDotsToActiveCard() {
    const activeIndex = window.NTCards?.state?.activeIndex ?? 0;

    if (window.NTCardDots?.setActive) {
      window.NTCardDots.setActive(activeIndex, true);
    }
  }

  function onPointerDown(e) {
    const cardSlide = e.target.closest("[data-card-id]");
    if (!cardSlide) return;

    clearTimeout(holdTimer);

    holdTimer = setTimeout(() => {
      armCloseMode(cardSlide.dataset.cardId);
    }, 4000);

    const stop = () => {
      clearTimeout(holdTimer);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointermove", stop);
      window.removeEventListener("pointercancel", stop);
    };

    window.addEventListener("pointerup", stop);
    window.addEventListener("pointermove", stop);
    window.addEventListener("pointercancel", stop);
  }

  function armCloseMode(cardId) {
    armedCardId = cardId;

    const activeCard = viewportEl?.querySelector?.(`[data-card-id="${cardId}"] .ntCard`);
    if (activeCard) {
      activeCard.classList.add("isCloseArmed");
    }

    const cancelOnTap = (e) => {
      if (e.target.closest(`[data-card-id="${cardId}"]`)) return;
      disarmCloseMode();
      document.removeEventListener("pointerdown", cancelOnTap, true);
    };

    document.addEventListener("pointerdown", cancelOnTap, true);
  }

  function disarmCloseMode() {
    if (!armedCardId) return;

    const activeCard = viewportEl?.querySelector?.(`[data-card-id="${armedCardId}"] .ntCard`);
    if (activeCard) {
      activeCard.classList.remove("isCloseArmed");
    }

    armedCardId = null;
  }

  return {
    setViewport,
    armCloseMode,
    disarmCloseMode
  };
})();