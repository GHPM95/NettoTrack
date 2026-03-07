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
 country:"Italia",
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
 weeklyHours:null,
 salaryMonths:13
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
 setupMode:"",
 lastUpdatedAt:null
}

}

/* =========================
   Init
   ========================= */

function initJobProfile(){

const saved = localStorage.getItem("nt_jobProfile")

if(saved){
 Object.assign(jobProfileState, JSON.parse(saved))
}

if(jobProfileState.profileMeta.setupCompleted){
 showProfileView()
}else{
 showEmptyState()
}

}

/* ========================= */

function showEmptyState(){

document.getElementById("jobProfileEmpty").classList.remove("hidden")
document.getElementById("jobProfileView").classList.add("hidden")

}

function showProfileView(){

document.getElementById("jobProfileEmpty").classList.add("hidden")
document.getElementById("jobProfileView").classList.remove("hidden")

renderProfile()

}

/* ========================= */

function renderProfile(){

const u = jobProfileState.userProfile
const a = jobProfileState.addressProfile
const j = jobProfileState.jobProfile

document.getElementById("jpName").textContent =
`${u.firstName} ${u.lastName}`

document.getElementById("jpBirth").textContent =
`${u.birthDate} • ${u.gender}`

document.getElementById("jpLocation").textContent =
`${a.municipality}, ${a.region} (${a.zipCode})`

document.getElementById("jpCompany").textContent = j.companyName
document.getElementById("jpRole").textContent = j.role
document.getElementById("jpLevel").textContent = `Livello ${j.level}`
document.getElementById("jpHireDate").textContent = `Assunto il ${j.hireDate}`
document.getElementById("jpSeniority").textContent = calcSeniority(j.hireDate)

}

/* ========================= */

function calcSeniority(hireDate){

if(!hireDate) return ""

const start = new Date(hireDate)
const now = new Date()

const diff = now - start
const days = Math.floor(diff/(1000*60*60*24))

if(days < 30) return `${days} giorni`

const months = Math.floor(days/30)

if(months < 12) return `${months} mesi`

const years = Math.floor(months/12)
const rem = months % 12

return `${years} anni, ${rem} mesi`

}

/* ========================= */

function saveJobProfile(){

jobProfileState.profileMeta.lastUpdatedAt = new Date()

localStorage.setItem(
 "nt_jobProfile",
 JSON.stringify(jobProfileState)
)

}

/* ========================= */

initJobProfile()