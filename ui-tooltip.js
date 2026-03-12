/* =========================
   NettoTrack Universal Tooltip
   ========================= */

window.NTTooltip = (() => {
  function bind(root = document) {
    root.querySelectorAll("[data-nt-tooltip-trigger]").forEach((trigger) => {
      const id = trigger.dataset.ntTooltipTrigger;
      const bubble = root.querySelector(`[data-nt-tooltip="${id}"]`);
      if (!bubble) return;

      const open = () => {
        bubble.classList.remove("hidden");
        requestAnimationFrame(() => bubble.classList.add("isOpen"));
      };

      const close = () => {
        bubble.classList.remove("isOpen");
        setTimeout(() => {
          if (!bubble.classList.contains("isOpen")) bubble.classList.add("hidden");
        }, 120);
      };

      trigger.addEventListener("pointerenter", open);
      trigger.addEventListener("pointerleave", close);
      trigger.addEventListener("focus", open);
      trigger.addEventListener("blur", close);
      trigger.addEventListener("click", () => {
        if (bubble.classList.contains("hidden")) open();
        else close();
      });
    });
  }

  return { bind };
})();