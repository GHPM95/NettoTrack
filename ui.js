(() => {

  const $ = (sel, root=document) => root.querySelector(sel);
  const body = document.body;
  const root = document.documentElement;

  /* =====================================================
     MENU
     ===================================================== */

  const menuBtn      = $("#menuBtn");
  const menuDrawer   = $("#menuDrawer");
  const menuOverlay  = $("#menuOverlay");
  const menuCloseBtn = $("#menuCloseBtn");

  function syncMenuWidthVar() {
    if (!menuDrawer) return;
    const w = menuDrawer.getBoundingClientRect().width || 0;
    root.style.setProperty("--menuW", `${Math.round(w)}px`);
  }

  function openMenu() {
    body.classList.add("isMenuOpen");
    menuDrawer?.setAttribute("aria-hidden", "false");
    menuOverlay?.setAttribute("aria-hidden", "false");
    syncMenuWidthVar();
    document.dispatchEvent(new Event("nettotrack:refreshMenu"));
  }

  function closeMenu() {
    body.classList.remove("isMenuOpen");
    menuDrawer?.setAttribute("aria-hidden", "true");
    menuOverlay?.setAttribute("aria-hidden", "true");
  }

  menuBtn?.addEventListener("click", () => {
    body.classList.contains("isMenuOpen") ? closeMenu() : openMenu();
  });
  menuCloseBtn?.addEventListener("click", closeMenu);
  menuOverlay?.addEventListener("click", closeMenu);

  /* =====================================================
     CARDS
     ===================================================== */

  const cardsViewport = $("#cardsViewport");
  const cardsTrack    = $("#cardsTrack");
  const dotsPill      = $("#dotsPill");

  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  let activeIndex = 0;
  let gapPx = 18;

  function getSlides(){
    return Array.from(cardsTrack.querySelectorAll(".slide"));
  }

  function getSlideIndexById(id){
    return getSlides().findIndex(s=>s.dataset.slideId===id);
  }

  function ensureSlide({ id, title }) {
    const idx = getSlideIndexById(id);
    if (idx >= 0) return getSlides()[idx];

    const art = document.createElement("article");
    art.className = "card slide";
    art.dataset.slideId = id;
    art.dataset.title = title || id;

    const inner = document.createElement("div");
    inner.className = "cardInner";

    const mount = document.createElement("div");
    mount.className = "cardMount";
    mount.id = `${id}Mount`;

    inner.appendChild(mount);
    art.appendChild(inner);
    cardsTrack.appendChild(art);

    renderDots();
    return art;
  }

  function removeSlide(id){
    const s = getSlides().find(x=>x.dataset.slideId===id);
    if (s && id!=="home") s.remove();
  }

  function computeGap(){
    const cs = getComputedStyle(cardsTrack);
    const g = parseFloat(cs.columnGap||cs.gap||"18");
    if(!Number.isNaN(g)) gapPx=g;
  }

  function slideWidth(){
    return cardsViewport.getBoundingClientRect().width;
  }

  function trackXForIndex(i){
    return -(i*(slideWidth()+gapPx));
  }

  function applyTrackX(x,anim=true){
    cardsTrack.style.transition = anim
      ? "transform .28s cubic-bezier(.2,.8,.2,1)"
      : "none";
    cardsTrack.style.transform = `translate3d(${x}px,0,0)`;
  }

  function setActiveIndex(i){
    const slides=getSlides();
    activeIndex=clamp(i,0,slides.length-1);
    slides.forEach((s,idx)=>s.classList.toggle("isActive",idx===activeIndex));
    Array.from(dotsPill.children).forEach((d,idx)=>
      d.classList.toggle("isActive",idx===activeIndex)
    );
  }

  function goTo(i){
    computeGap();
    setActiveIndex(i);
    applyTrackX(trackXForIndex(activeIndex),true);
  }

  function renderDots(){
    dotsPill.innerHTML="";
    getSlides().forEach((s,i)=>{
      const d=document.createElement("div");
      d.className="dot"+(i===activeIndex?" isActive":"");
      d.addEventListener("click",()=>goTo(i));
      dotsPill.appendChild(d);
    });
  }

  /* =====================================================
     EVENTI MENU → CARD
     ===================================================== */

  document.addEventListener("nettotrack:openCalendarInsert", () => {
    ensureSlide({ id:"calInsert", title:"Calendario" });
    goTo(getSlideIndexById("calInsert"));
    document.dispatchEvent(new Event("nettotrack:calendarInsertOpened"));
  });

  document.addEventListener("nettotrack:openCalendarView", () => {
    ensureSlide({ id:"calView", title:"Agenda" });
    goTo(getSlideIndexById("calView"));
    document.dispatchEvent(new Event("nettotrack:calendarViewOpened"));
  });

  /* =====================================================
     API PUBBLICA
     ===================================================== */

  window.NettoTrackUI = {
    openDayEditor:(key)=>{
      ensureSlide({ id:"dayEditor", title:"Turni" });
      goTo(getSlideIndexById("dayEditor"));
      document.dispatchEvent(
        new CustomEvent("nettotrack:dayEditorOpened",{ detail:{ dateKey:key } })
      );
    }
  };

  /* =====================================================
     INIT
     ===================================================== */

  computeGap();
  renderDots();
  applyTrackX(0,false);
  syncMenuWidthVar();

})();
