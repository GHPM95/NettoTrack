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
    const safeId = escapeHtml(id);
    const safeTitle = escapeHtml(title);
    const hasSubHeader = String(subHeader || "").trim().length > 0;

    return `
      <section class="ntCard" data-card-id="${safeId}">
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
                            ? `
                              <button
                                type="button"
                                class="ntIconBtn jsNtCardBack"
                                data-nt-action="back"
                                aria-label="Indietro"
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
                                class="ntIconBtn jsNtCardNext"
                                data-nt-action="next"
                                aria-label="Avanti"
                              >
                                →
                              </button>
                            `
                            : ``
                        }
                      </div>
                    `
                    : `<span class="ntCardHeaderGhost" aria-hidden="true"></span>`
                }
              </div>

              <div class="ntCardTitleWrap">
                <h2 class="ntCardTitle">${safeTitle}</h2>
              </div>

              <div class="ntCardHeaderSide ntCardHeaderSide--right">
                <button
                  type="button"
                  class="ntIconBtn jsNtCardClose"
                  data-nt-action="close"
                  aria-label="Chiudi"
                >
                  ×
                </button>
              </div>
            </header>

            ${
              hasSubHeader
                ? `
                  <div class="ntCardSubHeader">
                    ${subHeader}
                  </div>
                `
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
                      data-nt-action="cancel"
                      aria-label="${escapeHtml(footerLeftLabel)}"
                      ${footerLeftDisabled ? "disabled" : ""}
                    >
                      ${escapeHtml(footerLeftLabel)}
                    </button>

                    <button
                      type="button"
                      class="${escapeHtml(footerRightClass)}"
                      data-nt-action="save"
                      aria-label="${escapeHtml(footerRightLabel)}"
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