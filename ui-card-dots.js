/* =========================
   NettoTrack Smart Dots
   rail + thumb animato
   sempre visibili
   ========================= */

window.NTCardDots = (() => {
  let mountEl = null;
  let currentCount = 1;
  let currentIndex = 0;

  function setMount(el) {
    mountEl = el;
  }

  function render({ openCards = [], activeIndex = 0 } = {}) {
    if (!mountEl) return;

    currentCount = Math.max(1, openCards.length || 0);
    currentIndex = Math.max(0, activeIndex || 0);

    mountEl.classList.remove("hidden");
    mountEl.innerHTML = buildDotsHtml(currentCount, currentIndex);

    bindClicks();
    syncThumb(currentIndex, false);
  }

  function buildDotsHtml(count, activeIndex) {
    const dots = Array.from({ length: count }, (_, i) => {
      const isActive = i === activeIndex;
      return `
        <button
          type="button"
          class="ntDotNav ${isActive ? "isActive" : ""}"
          data-nt-dot-index="${i}"
          aria-label="Vai alla card ${i + 1}"
          aria-pressed="${isActive ? "true" : "false"}"
        ></button>
      `;
    }).join("");

    return `
      <div class="ntSmartDots" data-nt-dots-count="${count}">
        <div class="ntSmartDotsTrack">
          <div class="ntSmartDotsThumb" id="ntSmartDotsThumb"></div>
        </div>
        <div class="ntSmartDotsButtons">
          ${dots}
        </div>
      </div>
    `;
  }

  function bindClicks() {
    if (!mountEl) return;

    mountEl.querySelectorAll("[data-nt-dot-index]").forEach((btn) => {
      btn.onclick = () => {
        const index = Number(btn.dataset.ntDotIndex || 0);
        setActive(index, true);
        window.NTCards?.goToCard?.(index);
      };
    });
  }

  function setActive(index, animate = true) {
    currentIndex = clamp(index, 0, currentCount - 1);

    mountEl?.querySelectorAll("[data-nt-dot-index]").forEach((btn, i) => {
      const active = i === currentIndex;
      btn.classList.toggle("isActive", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    syncThumb(currentIndex, animate);
  }

  function syncFromProgress(progress) {
    if (!mountEl) return;

    const maxIndex = Math.max(0, currentCount - 1);
    const clamped = clamp(progress, 0, maxIndex);

    syncThumb(clamped, false);

    const nearest = Math.round(clamped);
    mountEl.querySelectorAll("[data-nt-dot-index]").forEach((btn, i) => {
      const active = i === nearest;
      btn.classList.toggle("isActive", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function syncThumb(progressIndex, animate) {
    const root = mountEl?.querySelector(".ntSmartDots");
    const thumb = mountEl?.querySelector("#ntSmartDotsThumb");
    if (!root || !thumb) return;

    const count = Number(root.dataset.ntDotsCount || 1);
    const maxIndex = Math.max(0, count - 1);
    const trackWidth = 56;
    const thumbWidth = count <= 1 ? 18 : 18;
    const slot = maxIndex === 0 ? 0 : (trackWidth - thumbWidth) / maxIndex;
    const x = maxIndex === 0 ? (trackWidth - thumbWidth) / 2 : (slot * progressIndex);

    thumb.style.transition = animate ? "transform .22s ease" : "none";
    thumb.style.transform = `translateX(${x}px)`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  return {
    setMount,
    render,
    setActive,
    syncFromProgress
  };
})();