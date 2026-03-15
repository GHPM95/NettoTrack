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

    const hasSubHeader = !!String(subHeader || "").trim();

    return `
      <section class="ntCard" data-nt-card="${safeId}">
        <div class="ntCardShell">
          <div class="ntCardTop">
            <header class="ntCardHeader ${title || showBack || showNext ? "" : "isHidden"}">
              <div class="ntCardNav ${showBack || showNext ? "" : "isHidden"}">
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

              <div class="ntCardTitleWrap ${safeTitle ? "" : "isHidden"}">
                <h2 class="ntCardTitle">${safeTitle}</h2>
              </div>

              <div class="${title ? "" : "ntCardHeaderSide"}">
                <button
                  type="button"
                  class="ntIconBtn ntPress jsNtCardClose ${title ? "" : "isGhost"}"
                  aria-label="Chiudi card"
                >×</button>
              </div>
            </header>

            <div class="ntCardSubHeader ${hasSubHeader ? "" : "isPlaceholder"}">
              <div class="ntCardSubHeaderContent">
                ${hasSubHeader ? subHeader : ""}
              </div>
            </div>
          </div>

          <div class="ntCardBody ntScrollY">
            ${body}
          </div>

          <footer class="ntCardFooter ${footer ? "" : "isPlaceholder"}">
            <div class="ntCardFooterRow">
              ${footer ? `
                <button
                  type="button"
                  class="ntBtn ntBtnSecondary ntPress jsNtCardCancel"
                >annulla</button>

                <button
                  type="button"
                  class="ntBtn ntBtnPrimary ntPress jsNtCardSave"
                >salva</button>
              ` : `
                <button
                  type="button"
                  class="ntBtn ntBtnSecondary"
                  tabindex="-1"
                  aria-hidden="true"
                >annulla</button>

                <button
                  type="button"
                  class="ntBtn ntBtnPrimary"
                  tabindex="-1"
                  aria-hidden="true"
                >salva</button>
              `}
            </div>
          </footer>
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