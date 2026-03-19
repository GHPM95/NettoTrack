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
        
        <div class="ntCardShell">

          <!-- ================= HEADER ================= -->
          <div class="ntCardTop">

            <header class="ntCardHeader">

              <!-- LEFT (FRECCE) -->
              <div class="ntCardHeaderSide ntCardHeaderSide--left">
                <div class="ntCardNav">

                  ${
                    showBack
                      ? `
                        <button
                          type="button"
                          class="ntIconBtn jsNtCardBack"
                          data-nt-action="back"
                          aria-label="Indietro"
                          disabled
                        >
                          ←
                        </button>
                      `
                      : `<span class="ntCardHeaderGhost"></span>`
                  }

                  ${
                    showNext
                      ? `
                        <button
                          type="button"
                          class="ntIconBtn jsNtCardNext"
                          data-nt-action="next"
                          aria-label="Avanti"
                          disabled
                        >
                          →
                        </button>
                      `
                      : `<span class="ntCardHeaderGhost"></span>`
                  }

                </div>
              </div>

              <!-- CENTER (TITOLO) -->
              <div class="ntCardTitleWrap">
                <h2 class="ntCardTitle">${safeTitle}</h2>
              </div>

              <!-- RIGHT (X) -->
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

          <!-- ================= BODY ================= -->
          <div class="ntCardBody">
            ${body}
          </div>

          <!-- ================= FOOTER ================= -->
          ${
            footer
              ? `
                <footer class="ntCardFooter">

                  <div class="ntCardFooterRow">

                    <button
                      type="button"
                      class="ntCardFooterBtn ntCardFooterBtn--ghost jsNtCardCancel"
                      data-nt-action="cancel"
                      aria-label="Annulla"
                      disabled
                    >
                      annulla
                    </button>

                    <button
                      type="button"
                      class="ntCardFooterBtn ntCardFooterBtn--primary jsNtCardSave"
                      data-nt-action="save"
                      aria-label="Salva"
                      disabled
                    >
                      salva
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

  return { createCard };

})();