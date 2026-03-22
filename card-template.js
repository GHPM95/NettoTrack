window.NTCardTemplate = (() => {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function createCard({
    id = "",
    title = "",
    body = "",
    subHeader = "",
    footer = true,
    showBack = true,
    showNext = true,
    footerLeftLabel = "annulla",
    footerRightLabel = "salva",
    footerLeftClass = "ntCardFooterBtn ntCardFooterBtn--ghost jsNtCardCancel",
    footerRightClass = "ntCardFooterBtn ntCardFooterBtn--primary jsNtCardSave",
    footerLeftDisabled = true,
    footerRightDisabled = true
  } = {}) {
    return `
      <section class="ntCard" data-card-id="${escapeHtml(id)}">
        <div class="ntCardShell">

          <div class="ntCardTop">
            <header class="ntCardHeader">
              <div class="ntCardHeaderSide ntCardHeaderSide--left">
                ${
                  showBack || showNext
                    ? `
                      <div class="ntCardNav">
                        ${
                          showBack
                            ? `<button type="button" class="ntIconBtn jsNtCardBack" aria-label="Indietro">←</button>`
                            : ``
                        }
                        ${
                          showNext
                            ? `<button type="button" class="ntIconBtn jsNtCardNext" aria-label="Avanti">→</button>`
                            : ``
                        }
                      </div>
                    `
                    : `<span class="ntCardHeaderGhost" aria-hidden="true"></span>`
                }
              </div>

              <div class="ntCardTitleWrap">
                <h2 class="ntCardTitle">${escapeHtml(title)}</h2>
              </div>

              <div class="ntCardHeaderSide ntCardHeaderSide--right">
                <button type="button" class="ntIconBtn jsNtCardClose" aria-label="Chiudi">×</button>
              </div>
            </header>

            ${
              String(subHeader || "").trim()
                ? `<div class="ntCardSubHeader">${subHeader}</div>`
                : ``
            }
          </div>

          <div class="ntCardBody">
            ${body}
          </div>

          ${
            footer
              ? `
                <footer class="ntCardFooter">
                  <div class="ntCardFooterRow">
                    <button
                      type="button"
                      class="${escapeHtml(footerLeftClass)}"
                      ${footerLeftDisabled ? "disabled" : ""}
                    >
                      ${escapeHtml(footerLeftLabel)}
                    </button>

                    <button
                      type="button"
                      class="${escapeHtml(footerRightClass)}"
                      ${footerRightDisabled ? "disabled" : ""}
                    >
                      ${escapeHtml(footerRightLabel)}
                    </button>
                  </div>
                </footer>
              `
              : ``
          }

        </div>
      </section>
    `;
  }

  return { createCard };
})();