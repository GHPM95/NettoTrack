/* =========================
   NettoTrack Menu
   ========================= */

(function(){

  const menu = document.getElementById("menu");
  const menuBtn = document.getElementById("menuBtn");
  const closeBtn = document.getElementById("menuClose");

  const items = document.querySelectorAll(".menuItem");

  /* =========================
     OPEN MENU
  ========================= */

  function openMenu(){
    menu.classList.add("open");
  }

  /* =========================
     CLOSE MENU
  ========================= */

  function closeMenu(){
    menu.classList.remove("open");
  }

  menuBtn?.addEventListener("click", openMenu);
  closeBtn?.addEventListener("click", closeMenu);

  /* =========================
     MENU NAVIGATION
  ========================= */

  items.forEach(item=>{

    item.addEventListener("click", ()=>{

      const page = item.dataset.page;

      switch(page){

        case "calendarInsert":
          document.getElementById("calendarInsert")?.scrollIntoView({behavior:"smooth"});
        break;

        case "calendarView":
          document.getElementById("calendarView")?.scrollIntoView({behavior:"smooth"});
        break;

        case "profile":
          document.getElementById("jobProfileRoot")?.scrollIntoView({behavior:"smooth"});
        break;

        case "settings":
          document.getElementById("settingsRoot")?.scrollIntoView({behavior:"smooth"});
        break;

      }

      closeMenu();

    });

  });

})();