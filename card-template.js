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
    return `
<section class="ntCard" data-card="${id}">
  <div class="ntCardShell">

    <header class="ntCardHeader">
      <div class="ntCardNav">
        <button
          class="ntIconBtn ntPress ntCardBack"
          data-nt-action="back"
          ${showBack ? "" : "disabled"}>←</button>

        <button
          class="ntIconBtn ntPress ntCardNext"
          data-nt-action="next"
          ${showNext ? "" : "disabled"}>→</button>
      </div>

      <div class="ntCardTitleWrap">
        <h1 class="ntCardTitle">${escapeHtml(title)}</h1>
      </div>

      <div class="ntCardHeaderSide">
        <button class="ntIconBtn ntPress ntCardClose" data-nt-action="close">×</button>
      </div>
    </header>

    ${subHeader ? `
      <div class="ntCardSubHeader">
        <div class="ntCardSubHeaderContent">
          ${subHeader}
        </div>
      </div>
    ` : ""}

    <div class="ntCardBody ntScrollY">
      ${body}
    </div>

    ${footer ? `
      <footer class="ntCardFooter">
        <div class="ntCardFooterRow">
          <button class="ntBtnSecondary ntPress ntCardCancel" data-nt-action="cancel">annulla</button>
          <button class="ntBtnPrimary ntPress ntCardSave" data-nt-action="save">salva</button>
        </div>
      </footer>
    ` : ""}

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