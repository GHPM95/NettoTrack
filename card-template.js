/* ========================= NettoTrack Card Template ========================= */
window.NTCardTemplate = (() => {
  function createCard({
    id = "",
    title = "",
    body = "",
    footer = true,
    subHeader = "",
    showBack = true,
    showNext = true
  } = {}) {
    const safeId = escapeHtml(id);
    const safeTitle = escapeHtml(title);
    const hasSubHeader = String(subHeader || "").trim().length > 0;

    return `
      <section class="ntCard" data-card-id="${safeId}">
        <header class="ntCardHeader">
          <div class="ntCardHeaderSide ntCardHeaderSide--left">
            ${
              showBack
                ? `
                  <button
                    type="button"
                    class="ntCardIconBtn jsNtCardBack"
                    data-nt-action="back"
                    aria-label="Indietro"
                    disabled
                  >
                    ←
                  </button>
                `
                : ``
            }

            ${
              showNext
                ? `
                  <button
                    type="button"
                    class="ntCardIconBtn jsNtCardNext"
                    data-nt-action="next"
                    aria-label="Avanti"
                    disabled
                  >
                    →
                  </button>
                `
                : ``
            }
          </div>

          <div class="ntCardHeaderCenter">
            <h2 class="ntCardTitle">${safeTitle}</h2>
            ${hasSubHeader ? `<div class="ntCardSubHeader">${subHeader}</div>` : ``}
          </div>

          <div class="ntCardHeaderSide ntCardHeaderSide--right">
            <button
              type="button"
              class="ntCardIconBtn jsNtCardClose"
              data-nt-action="close"
              aria-label="Chiudi"
            >
              ×
            </button>
          </div>
        </header>

        <div class="ntCardBody">
          ${body}
        </div>

        ${
          footer
            ? `
              <footer class="ntCardFooter">
                <button
                  type="button"
                  class="ntCardFooterBtn ntCardFooterBtn--ghost jsNtCardCancel"
                  data-nt-action="cancel"
                  disabled
                >
                  annulla
                </button>

                <button
                  type="button"
                  class="ntCardFooterBtn ntCardFooterBtn--primary jsNtCardSave"
                  data-nt-action="save"
                  disabled
                >
                  salva
                </button>
              </footer>
            `
            : ``
        }
      </section>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  return { createCard };
})();