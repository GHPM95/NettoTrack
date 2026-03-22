/* ========================= NettoTrack Card Template ========================= */
window.NTCardTemplate = (() => {
  function createCard({
    id = "",
    title = "",
    body = "",
    footer = true,
    subHeader = "",
    showBack = true,
    showNext = true,
    footerLeftLabel = "annulla",
    footerRightLabel = "salva",
    footerLeftClass = "ntCardFooterBtn ntCardFooterBtn--ghost jsNtCardCancel",
    footerRightClass = "ntCardFooterBtn ntCardFooterBtn--primary jsNtCardSave",
    footerLeftAction = "cancel",
    footerRightAction = "save",
    footerLeftDisabled = true,
    footerRightDisabled = true
  } = {}) {
    const safeId = escapeHtml(id);
    const safeTitle = escapeHtml(title);
    const hasSubHeader = String(subHeader || "").trim().length > 0;

    const leftNavHtml = (showBack || showNext)
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
                  ${footerLeftDisabled ? "disabled" : ""}
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
                  ${footerRightDisabled ? "disabled" : ""}
                >
                  →
                </button>
              `
              : ``
          }
        </div>
      `
      : `
        <span class="ntCardHeaderGhost" aria-hidden="true"></span>
      `;

    return `
      <section class="ntCard" data-card-id="${safeId}">
        <div class="ntCardShell">

          <div class="ntCardTop">
            <header class="ntCardHeader">
              <div class="ntCardHeaderSide ntCardHeaderSide--left">
                ${leftNavHtml}
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
                      class="${escapeAttr(footerLeftClass)}"
                      data-nt-action="${escapeAttr(footerLeftAction)}"
                      aria-label="${escapeAttr(footerLeftLabel)}"
                      ${footerLeftDisabled ? "disabled" : ""}
                    >
                      ${escapeHtml(footerLeftLabel)}
                    </button>

                    <button
                      type="button"
                      class="${escapeAttr(footerRightClass)}"
                      data-nt-action="${escapeAttr(footerRightAction)}"
                      aria-label="${escapeAttr(footerRightLabel)}"
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  return { createCard };
})();