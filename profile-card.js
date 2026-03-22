window.NTProfileCard = (() => {

  const STORAGE_KEY = "ntUserProfileData";
  const CTX_KEY = "ntProfileWizardContext";

  function getData(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }catch{
      return {};
    }
  }

  function hasData(d){
    return Object.values(d || {}).some(v => String(v || "").trim());
  }

  function openWizard(){
    sessionStorage.setItem(CTX_KEY, JSON.stringify({
      profile: getData()
    }));

    window.NTCards.openCard("profileWizard");
  }

  function render(){

    const d = getData();

    return window.NTCardTemplate.createCard({
      id: "profile",
      title: "Profilo utente",
      showBack: false,
      showNext: false,
      footer: true,

      // 🔴 NON USIAMO CANCEL → LO NASCONDIAMO DOPO
      body: `
        <div class="ntProfileHero">

          <div class="ntProfileAvatarBox">
            ○
          </div>

          <div class="ntProfileInfo">
            <div>Nome: ${d.firstName || "—"}</div>
            <div>Cognome: ${d.lastName || "—"}</div>
            <div>Sesso: ${d.gender || "—"}</div>
            <div>Data: ${d.birthDate || "—"}</div>
          </div>

        </div>
      `
    });
  }

  function onOpen(root){

    const cancel = root.querySelector(".jsNtCardCancel");
    const save = root.querySelector(".jsNtCardSave");
    const row = root.querySelector(".ntCardFooterRow");

    // 🔴 layout a destra
    if(row){
      row.style.display = "flex";
      row.style.justifyContent = "flex-end";
    }

    // 🔴 nascondo annulla
    if(cancel){
      cancel.remove();
    }

    if(save){

      // 🔴 FORZA ATTIVO DOPO IL SISTEMA
      setTimeout(() => {

        save.disabled = false;
        save.classList.remove("isBlocked");

        save.textContent = hasData(getData())
          ? "Modifica i dati"
          : "Inserisci i dati";

        save.onclick = openWizard;

      }, 0);
    }
  }

  function register(){
    window.NTCards.registerCard({
      id:"profile",
      render,
      onOpen
    });
  }

  return { register };

})();