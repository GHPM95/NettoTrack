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

  payProfile:{
    netMonthly:"",
    grossMonthly:"",
    hourlyRate:"",
    inputMode:""
  },

  payRules:{
    holidayEnabled:false,
    holidayValue:"",
    sundayEnabled:false,
    sundayValue:"",
    nightEnabled:false,
    nightValue:""
  },

  legalAcceptance:{
    faq:false,
    disclaimer:false,
    terms:false,
    scroll:false
  },

  profileMeta:{
    setupCompleted:false,
    lastUpdatedAt:null
  }

};


const jobProfileWizard = {
  step:1,
  total:5
};


/* =========================
   utils
========================= */

function esc(v){
  return String(v ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function getMount(){
  return document.getElementById("jobProfileMount");
}

function saveJobProfile(){
  jobProfileState.profileMeta.lastUpdatedAt=new Date().toISOString();
  localStorage.setItem("nt_jobProfile",JSON.stringify(jobProfileState));
}

function loadJobProfile(){

  const raw=localStorage.getItem("nt_jobProfile");
  if(!raw) return;

  try{

    const parsed=JSON.parse(raw);

    Object.assign(jobProfileState,parsed);

  }catch(e){
    console.warn("job profile load error");
  }

}


function resetWizard(){
  jobProfileWizard.step=1;
}


function nextWizard(){
  jobProfileWizard.step++;
  renderWizard();
}

function prevWizard(){
  jobProfileWizard.step--;
  renderWizard();
}


/* =========================
   avatar
========================= */

function avatarClass(){

  const g=jobProfileState.userProfile.gender;

  if(g==="uomo") return "avatarMale";
  if(g==="donna") return "avatarFemale";

  return "avatarNeutral";

}


/* =========================
   main card
========================= */

function renderMainCard(){

  const mount=getMount();
  if(!mount) return;

  mount.innerHTML=`

<section class="jobProfileCard">

<header class="jobProfileTopBar">

<div class="jobProfileTopSide"></div>

<div class="jobProfileTopTitleWrap">
<h2 class="jobProfileTopTitle">Profilo utente</h2>
</div>

<button id="jobProfileCloseBtn"
class="jobProfileCloseBtn">✕</button>

</header>


<div class="jobProfileContent">

<div class="jobProfilePreviewCard">

<div class="jobProfilePreviewAvatarBox">

<div class="jobProfileAvatar ${avatarClass()}">

<svg viewBox="0 0 24 24">

<circle cx="12" cy="8" r="4"
stroke="white"
stroke-width="2"
fill="none"/>

<path d="M4 20c2-4 6-6 8-6s6 2 8 6"
stroke="white"
stroke-width="2"
stroke-linecap="round"
fill="none"/>

</svg>

</div>

</div>


<div class="jobProfilePreviewInfo">

<div class="jobProfilePreviewRow">Nome:</div>
<div class="jobProfilePreviewRow">Cognome:</div>
<div class="jobProfilePreviewRow">Sesso:</div>
<div class="jobProfilePreviewRow">Data di nascita:</div>
<div class="jobProfilePreviewRow">Paese:</div>
<div class="jobProfilePreviewRow">Occupazione:</div>

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

document
.getElementById("jobProfileSetupBtn")
.addEventListener("click",startWizard);

}


/* =========================
   wizard frame
========================= */

function wizardFrame(inner,title){

return `

<section class="jobProfileCard">

<header class="jobProfileTopBar">

<button id="wizardBackBtn"
class="jobProfileCloseBtn
${jobProfileWizard.step===1?"isHiddenBtn":""}">
‹
</button>

<div class="jobProfileTopTitleWrap">
<h2 class="jobProfileTopTitle">${title}</h2>
</div>

<button id="wizardCloseBtn"
class="jobProfileCloseBtn">✕</button>

</header>


<div class="jobWizardStepBar">

<div class="jobWizardStepFill"
style="width:${jobProfileWizard.step/jobProfileWizard.total*100}%">
</div>

</div>


<div class="jobWizardBody">

${inner}

</div>

</section>

`;

}


/* =========================
   step 1 legal
========================= */

function stepLegal(){

return wizardFrame(`

<div id="wizardLegalScroll"
class="jobWizardLegalBox">

<p>NettoTrack fornisce stime e simulazioni informative.</p>
<p>I risultati possono differire dai dati ufficiali della busta paga.</p>

<p>L'app non sostituisce consulenza fiscale o del lavoro.</p>

<p>Verifica sempre i dati inseriti prima di utilizzarli.</p>

</div>


<div class="jobWizardLegalChecks">

<label class="jobWizardLegalRow">

<input id="faqCheck"
type="checkbox">

<span>Ho letto le FAQ</span>

</label>

<label class="jobWizardLegalRow">

<input id="discCheck"
type="checkbox">

<span>Ho letto il disclaimer</span>

</label>

<label class="jobWizardLegalRow">

<input id="termCheck"
type="checkbox">

<span>Accetto i termini</span>

</label>

</div>


<button id="wizardNextBtn"
class="jobProfilePrimaryBtn"
disabled>

Continua

</button>

`,"Profilo utente");

}


/* =========================
   step 2 personal data
========================= */

function stepPersonal(){

return wizardFrame(`

<div class="jobWizardFields">

<input id="firstName"
class="jobWizardInput"
placeholder="Nome">

<input id="lastName"
class="jobWizardInput"
placeholder="Cognome">

<input id="birthDate"
class="jobWizardInput"
type="date">

<select id="gender"
class="jobWizardInput">

<option value="">Sesso</option>
<option value="uomo">Uomo</option>
<option value="donna">Donna</option>

</select>

</div>


<button id="wizardNextBtn"
class="jobProfilePrimaryBtn"
disabled>

Continua

</button>

`,"Dati personali");

}


/* =========================
   wizard render
========================= */

function renderWizard(){

const mount=getMount();

if(!mount) return;

if(jobProfileWizard.step===1)
mount.innerHTML=stepLegal();

if(jobProfileWizard.step===2)
mount.innerHTML=stepPersonal();

bindWizardEvents();

}


/* =========================
   events
========================= */

function bindWizardEvents(){

document
.getElementById("wizardCloseBtn")
?.addEventListener("click",renderMainCard);

document
.getElementById("wizardBackBtn")
?.addEventListener("click",prevWizard);

if(jobProfileWizard.step===1){

const faq=document.getElementById("faqCheck");
const dis=document.getElementById("discCheck");
const ter=document.getElementById("termCheck");
const btn=document.getElementById("wizardNextBtn");

function check(){

btn.disabled=!(
faq.checked &&
dis.checked &&
ter.checked
);

}

faq.onchange=check;
dis.onchange=check;
ter.onchange=check;

btn.onclick=nextWizard;

}


if(jobProfileWizard.step===2){

const name=document.getElementById("firstName");
const last=document.getElementById("lastName");
const birth=document.getElementById("birthDate");
const gender=document.getElementById("gender");

const btn=document.getElementById("wizardNextBtn");

function check(){

btn.disabled=!(
name.value &&
last.value &&
birth.value &&
gender.value
);

}

name.oninput=check;
last.oninput=check;
birth.oninput=check;
gender.onchange=check;

btn.onclick=()=>{

jobProfileState.userProfile.firstName=name.value;
jobProfileState.userProfile.lastName=last.value;
jobProfileState.userProfile.birthDate=birth.value;
jobProfileState.userProfile.gender=gender.value;

saveJobProfile();

nextWizard();

};

}

}


/* =========================
   start wizard
========================= */

function startWizard(){

resetWizard();
renderWizard();

}


/* =========================
   init
========================= */

document.addEventListener("nettotrack:jobProfileOpened",()=>{

loadJobProfile();
renderMainCard();

});