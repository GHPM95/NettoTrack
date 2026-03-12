/* =========================
   NettoTrack Empty State
   ========================= */

window.NTEmptyState = (() => {
  function render({
    icon = "•",
    title = "",
    text = ""
  } = {}) {
    return `
      <div class="ntEmptyState">
        <div class="ntEmptyStateIcon" aria-hidden="true">${escapeHtml(icon)}</div>
        <div class="ntEmptyStateTitle">${escapeHtml(title)}</div>
        <div class="ntEmptyStateText">${escapeHtml(text)}</div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return { render };
})();