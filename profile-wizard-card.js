window.NTProfileWizardCard = (() => {
  const STORAGE_KEY="ntUserProfileData";
  const CTX_KEY="ntProfileWizardContext";

  function safe(v){ return String(v ?? "").trim(); }

  function ctx(){
    try{
      return JSON.parse(sessionStorage.getItem(CTX_KEY)||"{}");
    }catch{return {};}
  }

  function saveCtx(d){
    sessionStorage.setItem(CTX_KEY, JSON.stringify(d));
  }

  function persist(d){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  }

  function avatarClass(g){
    if(g==="Uomo") return "ntAvatar--male";
    if(g==="Donna") return "ntAvatar--female";
    return "ntAvatar--gradient";
  }

  function getDraft(){
    return {
      firstName: safe(document.getElementById("name")?.value),
      lastName: safe(document.getElementById("last")?.value),
      gender: safe(document.getElementById("gender")?.value),
      birthDate: safe(document.getElementById("birth")?.value)
    };
  }

  function updateAvatar(){
    const g = document.getElementById("gender")?.value;
    const box = document.getElementById("avatar");

    if(!box) return;

    box.className = "ntProfileAvatarBox "+avatarClass(g);
  }

  function syncAll(){
    const d = getDraft();
    saveCtx({profile:d});
    updateAvatar();
    window.NTProfileCard?.refreshLive(d);
  }

  function render(){
    const d = ctx().profile || {};

    return NTCardTemplate.createCard({
      id:"profileWizard",
      title:"Dati anagrafici",
      subHeader:`
        <div class="ntProgress">
          <div class="bar"><div class="fill" style="width:25%"></div></div>
          <span>1/4</span>
        </div>
      `,
      body:`
        <div class="ntWizard">
          <div id="avatar" class="ntProfileAvatarBox ${avatarClass(d.gender)}">○</div>

          <label>Nome</label>
          <input id="name" class="ntInput" value="${safe(d.firstName)}">

          <label>Cognome</label>
          <input id="last" class="ntInput" value="${safe(d.lastName)}">

          <label>Sesso</label>
          <select id="gender" class="ntSelect jsNtSelect">
            <option></option>
            <option ${d.gender==="Uomo"?"selected":""}>Uomo</option>
            <option ${d.gender==="Donna"?"selected":""}>Donna</option>
            <option ${d.gender==="Preferisco non specificare"?"selected":""}>Preferisco non specificare</option>
          </select>

          <label>Data</label>
          <input id="birth" class="ntInput" placeholder="GG/MM/AAAA" value="${safe(d.birthDate)}">
        </div>
      `,
      footer:true
    });
  }

  function fixFooter(root){
    const cancel=root.querySelector(".jsNtCardCancel");
    const save=root.querySelector(".jsNtCardSave");
    const row=root.querySelector(".ntCardFooterRow");

    if(row) row.style.justifyContent="flex-end";

    if(cancel){
      cancel.style.display="none";
      cancel.hidden=true;
    }

    if(save){
      save.textContent="avanti";
      save.setAttribute("data-nt-action","next");
    }
  }

  function bind(){
    const root=document.getElementById("profileWizard");

    if(window.NTSelect) NTSelect.hydrate(root);

    root.addEventListener("input", syncAll);
    root.addEventListener("change", syncAll);

    requestAnimationFrame(syncAll);
  }

  function register(){
    NTCards.registerCard({
      id:"profileWizard",
      render,
      onOpen(){
        const root=NTCards.getCardRoot("profileWizard");
        fixFooter(root);
        bind();
      },
      onNext(){
        const d=getDraft();

        if(!d.birthDate || d.birthDate.length<10){
          const root=NTCards.getCardRoot("profileWizard");
          root.querySelector(".ntCardFooter").style.display="none";
          alert("Data non valida");
          return;
        }

        persist(d);
        sessionStorage.removeItem(CTX_KEY);
        NTCards.closeCard("profileWizard");
      }
    });
  }

  return { register };
})();