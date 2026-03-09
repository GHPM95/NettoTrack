/* =========================
   NettoTrack - Job Profile
   ========================= */

const jobProfileState = {
  userProfile:{
    firstName:"",
    lastName:"",
    birthDate:"",
    gender:""
  },

  addressProfile:{
    country:"",
    region:"",
    province:"",
    municipality:"",
    zipCode:"",
    street:"",
    streetNumber:""
  },

  jobProfile:{
    companyName:"",
    companyAddress:"",
    contractType:"",
    appliedContract:"",
    level:"",
    role:"",
    hireDate:"",
    workType:"",
    weeklyHours:"",
    salaryMonths:"13"
  },

  profileMeta:{
    setupCompleted:false
  }
};

function esc(v){
  return String(v ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function getMount(){
  return document.getElementById("jobProfileMount");
}

function getAvatarSymbol(){
  const g = jobProfileState.userProfile.gender;

  if(g==="uomo") return "👨";
  if(g==="donna") return "👩";
  return "🙂";
}

/* =========================
   CARD HTML
========================= */

function buildProfileHTML(){

  const u = jobProfileState.userProfile;
  const j = jobProfileState.jobProfile;

  const name = u.firstName ? `Nome: ${u.firstName}` : "Nome:";
  const last = u.lastName ? `Cognome: ${u.lastName}` : "Cognome:";
  const sex = u.gender ? `Sesso: ${u.gender}` : "Sesso:";
  const birth = u.birthDate ? `Data di nascita: ${u.birthDate}` : "Data di nascita:";
  const country = jobProfileState.addressProfile.country
      ? `Paese: ${jobProfileState.addressProfile.country}`
      : "Paese:";
  const role = j.role ? `Occupazione: ${j.role}` : "Occupazione:";

  return `
<section class="jobProfileCard">

<header class="jobProfileTopBar">

<div class="jobProfileTopSide"></div>

<div class="jobProfileTopTitleWrap">
<h2 class="jobProfileTopTitle">Profilo utente</h2>
</div>

<button id="jobProfileCloseBtn"
class="jobProfileCloseBtn"
type="button">✕</button>

</header>


<div class="jobProfileContent">

<div class="jobProfilePreviewCard">

<div class="jobProfilePreviewAvatarBox">
<div class="jobProfilePreviewAvatar">${getAvatarSymbol()}</div>
</div>

<div class="jobProfilePreviewInfo">

<div class="jobProfilePreviewRow">${esc(name)}</div>
<div class="jobProfilePreviewRow">${esc(last)}</div>
<div class="jobProfilePreviewRow">${esc(sex)}</div>
<div class="jobProfilePreviewRow">${esc(birth)}</div>
<div class="jobProfilePreviewRow">${esc(country)}</div>
<div class="jobProfilePreviewRow">${esc(role)}</div>

</div>

</div>


<div class="jobProfileEmptyBottom">

<div class="jobProfileEmptyCaption">
Configura il tuo profilo personale e lavorativo.
</div>

<button id="jobProfileSetupBtn"
class="jobProfilePrimaryBtn">
Crea profilo
</button>

</div>

</div>

</section>
`;
}

/* =========================
   INIT
========================= */

function mountJobProfileCard(){

  const mount = getMount();
  if(!mount) return;

  mount.innerHTML = buildProfileHTML();

}

document.addEventListener("nettotrack:jobProfileOpened",()=>{
  mountJobProfileCard();
});