/* =========================
   NettoTrack Universal Modal
   ========================= */

window.NTModal = (() => {
  let current = null;

  function open({
    title = "",
    text = "",
    cancelText = "Annulla",
    confirmText = "Conferma",
    onCancel = null,
    onConfirm = null
  } = {}) {
    close();

    const layer = document.createElement("div");
    layer.className = "ntModalLayer";
    layer.innerHTML = `
      <div class="ntModalCard">
        <div class="ntModalBody">
          <div class="ntModalTitle">${escapeHtml(title)}</div>
          <div class="ntModalText">${escapeHtml(text)}</div>
        </div>
        <div class="ntModalFooter">
          <button type="button" class="ntBtnSecondary ntPress" data-nt-modal-cancel>${escapeHtml(cancelText)}</button>
          <button type="button" class="ntBtnPrimary ntPress" data-nt-modal-confirm>${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    layer.addEventListener("click", (e) => {
      if (e.target === layer) {
        close();
        if (typeof onCancel === "function") onCancel();
      }
    });

    layer.querySelector("[data-nt-modal-cancel]")?.addEventListener("click", () => {
      close();
      if (typeof onCancel === "function") onCancel();
    });

    layer.querySelector("[data-nt-modal-confirm]")?.addEventListener("click", () => {
      close();
      if (typeof onConfirm === "function") onConfirm();
    });

    document.body.appendChild(layer);
    current = layer;
  }

  function close() {
    if (!current) return;
    current.remove();
    current = null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return { open, close };
})();