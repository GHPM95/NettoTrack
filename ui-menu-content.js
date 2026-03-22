/* ========================= NettoTrack Menu Content ========================= */
window.NTMenuContent = (() => {
  function render() {
    return `
      <div class="ntMenuHeader">
        <h2 class="ntMenuTitle">NettoTrack</h2>
        <div class="ntMenuSub">Menu rapido</div>
      </div>

      <div class="ntMenuBody">
        <section class="ntMenuSection">
          <h3 class="ntMenuSectionTitle">Navigazione</h3>

          <div class="ntMenuList">
            <button type="button" class="ntMenuRow" data-nt-menu-action="go-insert">
              <span class="ntMenuRowLabel">Inserisci</span>
              <span class="ntMenuRowValue">Apri</span>
            </button>

            <button type="button" class="ntMenuRow" data-nt-menu-action="go-calendar">
              <span class="ntMenuRowLabel">Calendario</span>
              <span class="ntMenuRowValue">Apri</span>
            </button>

            <button type="button" class="ntMenuRow" data-nt-menu-action="go-profile">
              <span class="ntMenuRowLabel">Profilo utente</span>
              <span class="ntMenuRowValue">Apri</span>
            </button>
          </div>
        </section>

        <section class="ntMenuSection">
          <h3 class="ntMenuSectionTitle">Gestione</h3>

          <div class="ntMenuList">
            <button type="button" class="ntMenuRow" data-nt-menu-action="history-soon">
              <span class="ntMenuRowLabel">Cronologia</span>
              <span class="ntMenuRowValue">Presto</span>
            </button>

            <button type="button" class="ntMenuRow" data-nt-menu-action="backup-soon">
              <span class="ntMenuRowLabel">Backup dati</span>
              <span class="ntMenuRowValue">Presto</span>
            </button>
          </div>
        </section>

        <section class="ntMenuSection">
          <h3 class="ntMenuSectionTitle">Impostazioni</h3>

          <div class="ntMenuList">
            <button type="button" class="ntMenuRow" data-nt-menu-action="settings-theme">
              <span class="ntMenuRowLabel">Aspetto e tema</span>
              <span class="ntMenuRowValue">Apri</span>
            </button>
          </div>
        </section>

        <section class="ntMenuSection">
          <h3 class="ntMenuSectionTitle">NettoTrack</h3>

          <div class="ntMenuList">
            <div class="ntMenuRow">
              <span class="ntMenuRowLabel">Versione</span>
              <span class="ntMenuRowValue">Nuovo layout</span>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  return { render };
})();