Menu.js

document.addEventListener("DOMContentLoaded", () => {

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const menuDrawer = $("#menuDrawer");

  function injectMenuStyles() {
    if (document.getElementById("menu-inline-style")) return;

    const s = document.createElement("style");
    s.id = "menu-inline-style";
    s.textContent = `
      .menuPad{ padding: 14px 12px; }
      .menuSectionTitle{
        font-weight: 1000;
        letter-spacing: .2px;
        margin: 6px 0 10px;
      }
      .menuItemBtn{
        width: 100%;
        height: 46px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,.14);
        background:
          radial-gradient(140% 220% at 25% 0%, rgba(255,255,255,.10), transparent 55%),
          linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05));
        color: var(--text);
        font-weight: 1000;
        text-align:left;
        padding: 0 12px;
        transition: transform .12s ease, filter .12s ease;
      }
      .menuItemBtn:active{
        transform: scale(.98);
        filter: brightness(1.07);
      }
      .menuHint{
        color: var(--muted);
        font-weight: 850;
        font-size: 12px;
        line-height: 1.35;
        margin-top: 12px;
      }
      .menuDivider{
        height:1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent);
        margin: 14px 0;
      }
    `;
    document.head.appendChild(s);
  }

  function renderMenu() {
    if (!menuDrawer) return;

    menuDrawer.innerHTML = `
      <div class="menuPad">
        <div style="height: 8px;"></div>

        <div class="menuSectionTitle">Calendario</div>

        <button class="menuItemBtn" id="mCalInsert" type="button">
          Inserisci dati
        </button>

        <div style="height: 10px;"></div>

        <button class="menuItemBtn" id="mCalView" type="button">
          Visualizza calendario
        </button>

        <div class="menuDivider"></div>

        <div class="menuHint">
          (Placeholder) Altre voci le aggiungiamo dopo.
        </div>
      </div>
    `;

    $("#mCalInsert", menuDrawer)?.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:openCalendarInsert"));
      $("#menuBtn")?.click(); // chiudi menu
    });

    $("#mCalView", menuDrawer)?.addEventListener("click", () => {
      document.dispatchEvent(new Event("nettotrack:openCalendarView"));
      $("#menuBtn")?.click();
    });
  }

  injectMenuStyles();
  renderMenu();

  document.addEventListener("nettotrack:refreshMenu", renderMenu);
})();

});