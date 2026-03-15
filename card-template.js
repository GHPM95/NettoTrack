/* =========================
   NettoTrack Card Template
   ========================= */

window.NTCardTemplate = (() => {
  function createCard({
    id,
    title = "",
    body = "",
    footer = true,
    subHeader = "",
    showBack = true,
    showNext = true
  }) {
    const safeId = escapeHtml(id || "");
    const safeTitle = escapeHtml(title || "");

    return `
      <section class="ntCard" data-nt-card="${safeId}">
        <div class="ntCardShell">
          <div class="ntCardTop">
            <header class="ntCardHeader">
              <div class="ntCardNav">
                ${showBack ? `
                  <button
                    type="button"
                    class="ntIconBtn ntPress jsNtCardBack"
                    aria-label="Card precedente"
                  >←</button>
                ` : `<div class="ntCardHeaderSide"></div>`}

                ${showNext ? `
                  <button
                    type="button"
                    class="ntIconBtn ntPress jsNtCardNext"
                    aria-label="Card successiva"
                  >→</button>
                ` : `<div class="ntCardHeaderSide"></div>`}
              </div>

              <div class="ntCardTitleWrap">
                <h2 class="ntCardTitle">${safeTitle}</h2>
              </div>

              <button
                type="button"
                class="ntIconBtn ntPress jsNtCardClose"
                aria-label="Chiudi card"
              >×</button>
            </header>

            ${subHeader ? `
              <div class="ntCardSubHeader">
                ${subHeader}
              </div>
            ` : ""}
          </div>

          <div class="ntCardBody ntScrollY">
            ${body}
          </div>

          ${
            footer
              ? `
                <footer class="ntCardFooter">
                  <div class="ntCardFooterRow">
                    <button
                      type="button"
                      class="ntBtn ntBtnSecondary ntPress jsNtCardCancel"
                    >annulla</button>

                    <button
                      type="button"
                      class="ntBtn ntBtnPrimary ntPress jsNtCardSave"
                    >salva</button>
                  </div>
                </footer>
              `
              : `
                <footer class="ntCardFooter isPlaceholder" aria-hidden="true">
                  <div class="ntCardFooterRow">
                    <button
                      type="button"
                      class="ntBtn ntBtnSecondary"
                      tabindex="-1"
                    >annulla</button>

                    <button
                      type="button"
                      class="ntBtn ntBtnPrimary"
                      tabindex="-1"
                    >salva</button>
                  </div>
                </footer>
              `
          }
        </div>
      </section>
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

  return {
    createCard
  };
})();