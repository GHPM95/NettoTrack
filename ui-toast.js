/* =========================
   NettoTrack Universal Toast
   ========================= */

window.NTToast = (() => {
  let stack = null;

  function ensureStack() {
    if (stack) return stack;
    stack = document.createElement("div");
    stack.className = "ntToastStack";
    document.body.appendChild(stack);
    return stack;
  }

  function show({
    title = "",
    text = "",
    duration = 2600
  } = {}) {
    const root = ensureStack();
    const toast = document.createElement("div");
    toast.className = "ntToast";
    toast.innerHTML = `
      <div class="ntToastTitle">${escapeHtml(title)}</div>
      <div class="ntToastText">${escapeHtml(text)}</div>
    `;

    root.appendChild(toast);

    setTimeout(() => {
      toast.remove();
      if (root && !root.children.length) {
        root.remove();
        stack = null;
      }
    }, duration);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return { show };
})();