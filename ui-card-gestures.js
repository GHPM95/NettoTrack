/* =========================
   NettoTrack Card Gestures
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
    lock: null
  };

  function setViewport(el) {
    viewportEl = el;
    bind();
  }

  function bind() {
    if (!viewportEl) return;

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
  }

  function onMove(e) {
    if (!gesture.tracking) return;
    const t = e.touches[0];
    if (!t) return;

    gesture.deltaX = t.clientX - gesture.startX;
    gesture.deltaY = t.clientY - gesture.startY;

    if (!gesture.lock) {
      if (Math.abs(gesture.deltaX) > 12 || Math.abs(gesture.deltaY) > 12) {
        gesture.lock = Math.abs(gesture.deltaX) > Math.abs(gesture.deltaY) ? "x" : "y";
      }
    }

    if (gesture.lock === "x") {
      e.preventDefault();
    }

    if (armedCardId && gesture.lock === "y" && gesture.deltaY > 0) {
      const activeId = NTCards.getActiveCardId();
      if (activeId !== armedCardId) return;
      const activeSlide = viewportEl.querySelector(`[data-card-id="${activeId}"]`);
      if (activeSlide) {
        activeSlide.style.transform = `translateY(${gesture.deltaY}px)`;
      }
      e.preventDefault();
    }
  }

  function onEnd() {
    if (!gesture.tracking) return;

    if (!armedCardId && gesture.lock === "x") {
      if (gesture.deltaX < -60) {
        NTCards.goNextCard();
      } else if (gesture.deltaX > 60) {
        NTCards.goPrevCard();
      }
    }

    if (armedCardId) {
      const activeId = NTCards.getActiveCardId();
      const activeSlide = viewportEl?.querySelector(`[data-card-id="${activeId}"]`);
      if (activeSlide) {
        if (gesture.deltaY > 100) {
          activeSlide.style.transform = "";
          disarmCloseMode();
          if (window.NTCardManager?.closeActive) {
            NTCardManager.closeActive();
          } else {
            NTCards.closeActiveCard();
          }
        } else {
          activeSlide.style.transform = "";
        }
      }
    }

    gesture.tracking = false;
    gesture.lock = null;
  }

  function onCancel() {
    gesture.tracking = false;
    gesture.lock = null;
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
    const activeCard = viewportEl?.querySelector(`[data-card-id="${cardId}"] .ntCard`);
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
    const activeCard = viewportEl?.querySelector(`[data-card-id="${armedCardId}"] .ntCard`);
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