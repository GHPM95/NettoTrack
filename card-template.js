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

          <!-- HEADER -->
          <div class="ntCardTop">

            <div class="ntCardNav">
              ${
                showBack
                  ? `<button class="ntIconBtn jsNtCardBack" data-nt-action="back" disabled>←</button>`
                  : ""
              }

              ${
                showNext
                  ? `<button class="ntIconBtn jsNtCardNext" data-nt-action="next" disabled>→</button>`
                  : ""
              }
            </div>

            <div class="ntCardTitleWrap">
              <h2 class="ntCardTitle">${safeTitle}</h2>
              ${hasSubHeader ? `<div class="ntCardSubHeader">${subHeader}</div>` : ``}
            </div>

            <button class="ntIconBtn jsNtCardClose" data-nt-action="close">×</button>

          </div>

          <!-- BODY -->
          <div class="ntCardBody">
            ${body}
          </div>

          <!-- FOOTER -->
          ${
            footer
              ? `
                <div class="ntCardFooter">
                  <div class="ntCardFooterRow">

                    <button
                      class="ntCardFooterBtn ntCardFooterBtn--ghost jsNtCardCancel"
                      data-nt-action="cancel"
                      disabled
                    >
                      annulla
                    </button>

                    <button
                      class="ntCardFooterBtn ntCardFooterBtn--primary jsNtCardSave"
                      data-nt-action="save"
                      disabled
                    >
                      salva
                    </button>

                  </div>
                </div>
              `
              : ""
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