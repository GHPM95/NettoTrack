/* =========================
   NettoTrack Menu Content
   ========================= */

window.NTMenuContent = (() => {
  function render() {
    return `
      <div class="ntMenuHeader">
        <h2 class="ntMenuTitle">Menu</h2>
        <div class="ntMenuSub">Strumenti, impostazioni e sezioni rapide.</div>
      </div>

      <div class="ntMenuBody">
        <section class="ntMenuSection">
          <h3 class="ntMenuSectionTitle">Navigazione</h3>

          <div class="ntMenuList">
            <button type="button" class="ntMenuRow ntPress" data-nt-menu-action="go-insert">
              <span class="ntMenuRowLabel">Inserisci</span>
              <span class="ntMenuRowValue">Apri</span>
            </button>

            <button type="button" class="ntMenuRow ntPress" data-nt-menu-action="go-calendar">
              <span class="ntMenuRowLabel">Calendario</span>
              <span class="ntMenuRowValue">Apri</span>
            </button>

            <button type="button" class="ntMenuRow ntPress" data-nt-menu-action="go-profile">
              <span class="ntMenuRowLabel">Profilo</span>
              <span class="ntMenuRowValue">Apri</span>
            </button>
          </div>
        </section>

        <section class="ntMenuSection">
          <h3 class="ntMenuSectionTitle">Gestione</h3>

          <div class="ntMenuGroup">
            <button type="button" class="ntMenuRow ntPress" data-nt-menu-action="history">
              <span class="ntMenuRowLabel">Cronologia</span>
              <span class="ntMenuRowValue">Presto</span>
            </button>

            <button type="button" class="ntMenuRow ntPress" data-nt-menu-action="backup">
              <span class="ntMenuRowLabel">Backup dati</span>
              <span class="ntMenuRowValue">Presto</span>
            </button>

            <button type="button" class="ntMenuRow ntPress" data-nt-menu-action="settings">
              <span class="ntMenuRowLabel">Impostazioni</span>
              <span class="ntMenuRowValue">Presto</span>
            </button>
          </div>
        </section>

        <section class="ntMenuSection">
          <h3 class="ntMenuSectionTitle">NettoTrack</h3>

          <div class="ntMenuGroup">
            <div class="ntMenuRow">
              <span class="ntMenuRowLabel">Versione</span>
              <span class="ntMenuRowValue">Nuovo layout</span>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  return {
    render
  };
})();