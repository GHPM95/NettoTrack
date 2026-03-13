/* =========================
   NettoTrack Smart Dots
   ========================= */

window.NTCardDots = (() => {
  let mountEl = null;

  function setMount(el) {
    mountEl = el;
  }

  function render({ openCards, activeIndex, registry }) {
    if (!mountEl) return;

    if (!openCards || openCards.length <= 1) {
      mountEl.innerHTML = "";
      mountEl.classList.add("hidden");
      return;
    }

    mountEl.classList.remove("hidden");

    mountEl.innerHTML = `
      <div class="ntDots">
        ${openCards.map((cardId, index) => {
          const def = registry.get(cardId);
          const status = def?.getStatus ? def.getStatus() : "inactive";
          const statusClass =
            index === activeIndex ? "isActive" :
            status === "done" ? "isDone" :
            status === "warning" ? "isWarning" : "";

          return `
            <button
              class="ntDot ${statusClass}"
              type="button"
              aria-label="Vai card ${index + 1}"
              data-nt-dot-index="${index}">
            </button>
          `;
        }).join("")}
      </div>
    `;

    mountEl.querySelectorAll("[data-nt-dot-index]").forEach((btn) => {
      btn.onclick = () => {
        const index = Number(btn.dataset.ntDotIndex || 0);
        NTCards.goToCard(index);
      };
    });
  }

  return {
    setMount,
    render
  };
})();