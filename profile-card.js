window.NTProfileCard = (() => {
  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";
  const WIZARD_CARD_ID = "profileWizard";

  function safe(v){ return String(v ?? "").trim(); }

  function readStored(){
    try{
      const r = localStorage.getItem(STORAGE_KEY);
      return r ? JSON.parse(r) : null;
    }catch{ return null; }
  }

  function readCtx(){
    try{
      const r = sessionStorage.getItem(CTX_KEY);
      return r ? JSON.parse(r) : null;
    }catch{ return null; }
  }

  function getData(){
    const ctx = readCtx();
    return ctx?.profile || readStored();
  }

  function hasData(d){
    if(!d) return false;
    return Object.values(d).some(v => safe(v));
  }

  function avatarClass(g){
    if(g==="Uomo") return "ntAvatar--male";
    if(g==="Donna") return "ntAvatar--female";
    return "ntAvatar--gradient";
  }

  function openWizard(){
    const data = getData();
    sessionStorage.setItem(CTX_KEY, JSON.stringify({
      profile:data,
      mode: hasData(data) ? "edit":"create"
    }));

    window.NTCards.openCard("profileWizard");
  }

  function render(){
    const d = getData() || {};

    return NTCardTemplate.createCard({
      id:"profile",
      title:"Profilo utente",
      body:`
        <div class="ntProfileHero">
          <div class="ntProfileAvatarBox ${avatarClass(d.gender)}" data-avatar>
            ○
          </div>

          <div class="ntProfileInfo">
            <div>Nome: <span data-k="firstName">${safe(d.firstName)||"—"}</span></div>
            <div>Cognome: <span data-k="lastName">${safe(d.lastName)||"—"}</span></div>
            <div>Sesso: <span data-k="gender">${safe(d.gender)||"—"}</span></div>
            <div>Data: <span data-k="birthDate">${safe(d.birthDate)||"—"}</span></div>
          </div>
        </div>
      `,
      footer:true
    });
  }

  function fixFooter(root){
    const cancel = root.querySelector(".jsNtCardCancel");
    const save = root.querySelector(".jsNtCardSave");
    const row = root.querySelector(".ntCardFooterRow");

    if(row){
      row.style.justifyContent="flex-end";
    }

    if(cancel){
      cancel.style.display="none";
      cancel.hidden=true;
    }

    if(save){
      save.textContent = hasData(readStored()) ? "Modifica i dati" : "Inserisci i dati";
      save.setAttribute("data-nt-action","profile-open");
    }
  }

  function refreshLive(d){
    const root = window.NTCards.getCardRoot("profile");
    if(!root) return;

    root.querySelector("[data-avatar]")
      .className = "ntProfileAvatarBox "+avatarClass(d.gender);

    Object.entries(d).forEach(([k,v])=>{
      const el = root.querySelector(`[data-k="${k}"]`);
      if(el) el.textContent = safe(v)||"—";
    });

    fixFooter(root);
  }

  function register(){
    NTCards.registerCard({
      id:"profile",
      render,
      onOpen(){
        const root = NTCards.getCardRoot("profile");
        fixFooter(root);
      }
    });
  }

  return { register, refreshLive };
})();