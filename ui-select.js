/* =========================
   NettoTrack Universal Select
   ========================= */

window.NTSelect = (() => {
  function create({
    root,
    trigger,
    valueEl,
    menu,
    options = [],
    value = "",
    onChange = null
  } = {}) {
    if (!root || !trigger || !valueEl || !menu) {
      throw new Error("NTSelect: parametri mancanti");
    }

    const state = {
      value,
      options: Array.isArray(options) ? options : [],
      onChange
    };

    function renderMenu() {
      menu.innerHTML = state.options.map((opt) => {
        const selected = String(opt.value) === String(state.value);
        return `
          <button
            type="button"
            class="ntSelectOption ${selected ? "isSelected" : ""}"
            data-nt-select-value="${escapeHtml(opt.value)}">
            ${escapeHtml(opt.label)}
          </button>
        `;
      }).join("");

      menu.querySelectorAll("[data-nt-select-value]").forEach((btn) => {
        btn.addEventListener("click", () => {
          setValue(btn.dataset.ntSelectValue || "");
          close();
          if (typeof state.onChange === "function") {
            state.onChange(state.value);
          }
        });
      });
    }

    function setValue(newValue) {
      state.value = newValue;
      const found = state.options.find((o) => String(o.value) === String(newValue));
      valueEl.textContent = found ? found.label : "";
      renderMenu();
    }

    function open() {
      menu.classList.remove("hidden");
      requestAnimationFrame(() => menu.classList.add("isOpen"));
      trigger.setAttribute("aria-expanded", "true");
    }

    function close() {
      menu.classList.remove("isOpen");
      trigger.setAttribute("aria-expanded", "false");
      setTimeout(() => {
        if (!menu.classList.contains("isOpen")) {
          menu.classList.add("hidden");
        }
      }, 180);
    }

    function toggle() {
      if (menu.classList.contains("hidden")) open();
      else close();
    }

    trigger.addEventListener("click", toggle);

    document.addEventListener("pointerdown", (e) => {
      if (!root.contains(e.target)) close();
    });

    renderMenu();
    setValue(state.value);

    return {
      setValue,
      getValue: () => state.value,
      open,
      close
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return { create };
})();