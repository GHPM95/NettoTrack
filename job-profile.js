/* =========================
   NettoTrack - Job Profile
   ========================= */

const jobProfileState = {
  userProfile: {
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: ""
  },

  addressProfile: {
    country: "",
    region: "",
    province: "",
    municipality: "",
    zipCode: "",
    street: "",
    streetNumber: ""
  },

  jobProfile: {
    companyName: "",
    companyAddress: "",
    contractType: "",
    appliedContract: "",
    level: "",
    role: "",
    hireDate: "",
    workType: "",
    weeklyHours: "",
    salaryMonths: "13"
  },

  payProfile: {
    netMonthly: "",
    grossMonthly: "",
    hourlyRate: "",
    inputMode: ""
  },

  payRules: {
    holidayEnabled: false,
    holidayValue: "",
    sundayEnabled: false,
    sundayValue: "",
    nightEnabled: false,
    nightValue: ""
  },

  legalAcceptance: {
    faq: false,
    disclaimer: false,
    terms: false,
    scroll: false
  },

  profileMeta: {
    setupCompleted: false,
    lastUpdatedAt: null
  }
};

const jobProfileWizard = {
  step: 1,
  total: 5
};

/* =========================
   Utils
   ========================= */

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMount() {
  return document.getElementById("jobProfileMount");
}

function saveJobProfile() {
  jobProfileState.profileMeta.lastUpdatedAt = new Date().toISOString();
  localStorage.setItem("nt_jobProfile", JSON.stringify(jobProfileState));
}

function loadJobProfile() {
  const raw = localStorage.getItem("nt_jobProfile");
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);

    if (parsed.userProfile) Object.assign(jobProfileState.userProfile, parsed.userProfile);
    if (parsed.addressProfile) Object.assign(jobProfileState.addressProfile, parsed.addressProfile);
    if (parsed.jobProfile) Object.assign(jobProfileState.jobProfile, parsed.jobProfile);
    if (parsed.payProfile) Object.assign(jobProfileState.payProfile, parsed.payProfile);
    if (parsed.payRules) Object.assign(jobProfileState.payRules, parsed.payRules);
    if (parsed.legalAcceptance) Object.assign(jobProfileState.legalAcceptance, parsed.legalAcceptance);
    if (parsed.profileMeta) Object.assign(jobProfileState.profileMeta, parsed.profileMeta);
  } catch (error) {
    console.warn("NettoTrack job profile load error:", error);
  }
}

function resetWizard() {
  jobProfileWizard.step = 1;
}

function nextWizard() {
  jobProfileWizard.step = Math.min(jobProfileWizard.total, jobProfileWizard.step + 1);
  renderWizard();
}

function prevWizard() {
  jobProfileWizard.step = Math.max(1, jobProfileWizard.step - 1);
  renderWizard();
}

function getAvatarVariant() {
  const g = (jobProfileState.userProfile.gender || "").toLowerCase();

  if (g === "uomo") return "avatarMale";
  if (g === "donna") return "avatarFemale";

  return "avatarNeutral";
}

function buildAvatarMarkup() {
  return `
    <div id="jobProfileAvatarPreview" class="jobProfileAvatar ${getAvatarVariant()}">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="white" stroke-width="2"/>
        <path d="M4 20c2-4 6-6 8-6s6 2 8 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
  `;
}

/* =========================
   Main card
   ========================= */

function renderMainCard() {
  const mount = getMount();
  if (!mount) return;

  const u = jobProfileState.userProfile;
  const a = jobProfileState.addressProfile;
  const j = jobProfileState.jobProfile;

  const name = u.firstName ? `Nome: ${u.firstName}` : "Nome:";
  const lastName = u.lastName ? `Cognome: ${u.lastName}` : "Cognome:";
  const gender = u.gender ? `Sesso: ${u.gender}` : "Sesso:";
  const birthDate = u.birthDate ? `Data di nascita: ${u.birthDate}` : "Data di nascita:";
  const country = a.country ? `Paese: ${a.country}` : "Paese:";
  const role = j.role ? `Occupazione: ${j.role}` : "Occupazione:";

  mount.innerHTML = `
    <section class="jobProfileCard">
      <header class="jobProfileTopBar">
        <div class="jobProfileTopSide"></div>

        <div class="jobProfileTopTitleWrap">
          <h2 class="jobProfileTopTitle">Profilo utente</h2>
        </div>

        <button id="jobProfileCloseBtn" class="jobProfileCloseBtn" type="button" aria-label="Chiudi">
          ✕
        </button>
      </header>

      <div class="jobProfileContent">
        <div class="jobProfilePreviewCard">
          <div class="jobProfilePreviewAvatarBox">
            ${buildAvatarMarkup()}
          </div>

          <div class="jobProfilePreviewInfo">
            <div class="jobProfilePreviewRow">${esc(name)}</div>
            <div class="jobProfilePreviewRow">${esc(lastName)}</div>
            <div class="jobProfilePreviewRow">${esc(gender)}</div>
            <div class="jobProfilePreviewRow">${esc(birthDate)}</div>
            <div class="jobProfilePreviewRow">${esc(country)}</div>
            <div class="jobProfilePreviewRow">${esc(role)}</div>
          </div>
        </div>

        <div class="jobProfileEmptyBottom">
          <div class="jobProfileEmptyCaption">
            Configura il tuo profilo personale e lavorativo.
          </div>

          <button id="jobProfileSetupBtn" class="jobProfilePrimaryBtn" type="button">
            Crea profilo
          </button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("jobProfileSetupBtn")?.addEventListener("click", startWizard);
  document.getElementById("jobProfileCloseBtn")?.addEventListener("click", () => {
    saveJobProfile();
    document.dispatchEvent(new Event("nettotrack:closeJobProfile"));
  });
}

/* =========================
   Wizard shell
   ========================= */

function wizardFrame(title, inner, bottomBar = "") {
  return `
    <section class="jobProfileCard jobWizardShell">
      <header class="jobProfileTopBar">
        <button id="wizardBackBtn" class="jobProfileCloseBtn ${jobProfileWizard.step === 1 ? "isHiddenBtn" : ""}" type="button" aria-label="Indietro">
          ‹
        </button>

        <div class="jobProfileTopTitleWrap">
          <h2 class="jobProfileTopTitle">${esc(title)}</h2>
        </div>

        <button id="wizardCloseBtn" class="jobProfileCloseBtn" type="button" aria-label="Chiudi">
          ✕
        </button>
      </header>

      <div class="jobWizardStepBar">
        <div class="jobWizardStepFill" style="width:${(jobProfileWizard.step / jobProfileWizard.total) * 100}%"></div>
      </div>

      <div class="jobWizardBody">
        ${inner}
      </div>

      ${bottomBar ? `<div class="jobWizardBottomBar">${bottomBar}</div>` : ""}
    </section>
  `;
}

/* =========================
   Step 1 - Legal
   ========================= */

function stepLegal() {
  const legal = jobProfileState.legalAcceptance;

  return wizardFrame(
    "Profilo utente",
    `
      <div class="jobWizardIntro">
        <div class="jobWizardSub">Leggi tutto prima di proseguire</div>
      </div>

      <div id="wizardLegalScroll" class="jobWizardLegalBox">
        <div class="jobWizardTextBlock">
          <h3 class="jobWizardSmallTitle">FAQ</h3>
          <p>NettoTrack utilizza i dati inseriti dall’utente per creare stime e simulazioni.</p>
          <p>I risultati possono essere indicativi e potrebbero non coincidere con la busta paga reale.</p>

          <h3 class="jobWizardSmallTitle">Disclaimer</h3>
          <p>L'app non sostituisce consulenza fiscale, contabile o del lavoro.</p>
          <p>L’utente deve sempre verificare i dati inseriti e i risultati ottenuti.</p>

          <h3 class="jobWizardSmallTitle">Termini di utilizzo</h3>
          <p>Proseguendo confermi di aver letto le informazioni legali e di utilizzare NettoTrack come strumento informativo personale.</p>
        </div>
      </div>

      <div class="jobWizardLegalChecks">
        <label class="jobWizardLegalRow">
          <span class="jobWizardCheckWrap">
            <input id="faqCheck" class="jobWizardHiddenCheck" type="checkbox" ${legal.faq ? "checked" : ""}>
            <span class="jobWizardCheckUi"></span>
          </span>

          <span class="jobWizardLegalText">
            <span class="jobWizardLegalTitle">FAQ</span>
            <span class="jobWizardLegalDesc">Ho letto le FAQ.</span>
          </span>
        </label>

        <label class="jobWizardLegalRow">
          <span class="jobWizardCheckWrap">
            <input id="discCheck" class="jobWizardHiddenCheck" type="checkbox" ${legal.disclaimer ? "checked" : ""}>
            <span class="jobWizardCheckUi"></span>
          </span>

          <span class="jobWizardLegalText">
            <span class="jobWizardLegalTitle">Disclaimer</span>
            <span class="jobWizardLegalDesc">Ho letto il disclaimer.</span>
          </span>
        </label>

        <label class="jobWizardLegalRow">
          <span class="jobWizardCheckWrap">
            <input id="termCheck" class="jobWizardHiddenCheck" type="checkbox" ${legal.terms ? "checked" : ""}>
            <span class="jobWizardCheckUi"></span>
          </span>

          <span class="jobWizardLegalText">
            <span class="jobWizardLegalTitle">Termini di utilizzo</span>
            <span class="jobWizardLegalDesc">Accetto i termini di utilizzo.</span>
          </span>
        </label>
      </div>
    `,
    `
      <button id="wizardNextBtn" class="jobProfilePrimaryBtn wizardMainBtn" type="button" disabled>
        Continua
      </button>
    `
  );
}

/* =========================
   Step 2 - Personal data
   ========================= */

function stepPersonal() {
  const u = jobProfileState.userProfile;

  return wizardFrame(
    "Dati personali",
    `
      <div class="jobWizardFields">
        <div class="jobWizardRowTwo">
          <input
            id="firstName"
            class="jobWizardInput"
            type="text"
            placeholder="Nome"
            value="${esc(u.firstName)}"
            autocomplete="given-name"
          >

          <input
            id="lastName"
            class="jobWizardInput"
            type="text"
            placeholder="Cognome"
            value="${esc(u.lastName)}"
            autocomplete="family-name"
          >
        </div>

        <div class="jobWizardCompactWrap">
          <input
            id="birthDate"
            class="jobWizardInput jobWizardCompactInput"
            type="date"
            value="${esc(u.birthDate)}"
          >
        </div>

        <div class="jobWizardCompactWrap">
          <select id="gender" class="jobWizardInput jobWizardCompactInput">
            <option value="">Sesso</option>
            <option value="uomo" ${u.gender === "uomo" ? "selected" : ""}>Uomo</option>
            <option value="donna" ${u.gender === "donna" ? "selected" : ""}>Donna</option>
          </select>
        </div>

        <div class="jobWizardAvatarLiveBox">
          ${buildAvatarMarkup()}
        </div>
      </div>
    `,
    `
      <button id="wizardNextBtn" class="jobProfilePrimaryBtn wizardMainBtn" type="button" disabled>
        Continua
      </button>
    `
  );
}

/* =========================
   Step 3-5 placeholders
   ========================= */

function stepWork() {
  return wizardFrame(
    "Dati lavoro",
    `
      <div class="jobWizardIntro">
        <div class="jobWizardSub">Prossimo step: struttura dati lavoro.</div>
      </div>
    `,
    `
      <button id="wizardNextBtn" class="jobProfilePrimaryBtn wizardMainBtn" type="button">
        Continua
      </button>
    `
  );
}

function stepPay() {
  return wizardFrame(
    "Retribuzione",
    `
      <div class="jobWizardIntro">
        <div class="jobWizardSub">Prossimo step: struttura retribuzione.</div>
      </div>
    `,
    `
      <button id="wizardNextBtn" class="jobProfilePrimaryBtn wizardMainBtn" type="button">
        Continua
      </button>
    `
  );
}

function stepReview() {
  return wizardFrame(
    "Revisione",
    `
      <div class="reviewSection">
        <strong>Dati personali</strong><br>
        Nome: ${esc(jobProfileState.userProfile.firstName || "-")}<br>
        Cognome: ${esc(jobProfileState.userProfile.lastName || "-")}<br>
        Data di nascita: ${esc(jobProfileState.userProfile.birthDate || "-")}<br>
        Sesso: ${esc(jobProfileState.userProfile.gender || "-")}
      </div>
    `,
    `
      <button id="wizardSaveBtn" class="jobProfilePrimaryBtn wizardMainBtn" type="button">
        Salva profilo
      </button>
    `
  );
}

/* =========================
   Render wizard
   ========================= */

function renderWizard() {
  const mount = getMount();
  if (!mount) return;

  if (jobProfileWizard.step === 1) mount.innerHTML = stepLegal();
  if (jobProfileWizard.step === 2) mount.innerHTML = stepPersonal();
  if (jobProfileWizard.step === 3) mount.innerHTML = stepWork();
  if (jobProfileWizard.step === 4) mount.innerHTML = stepPay();
  if (jobProfileWizard.step === 5) mount.innerHTML = stepReview();

  bindWizardEvents();
}

/* =========================
   Wizard events
   ========================= */

function updateLegalButtonState() {
  const faq = document.getElementById("faqCheck");
  const disc = document.getElementById("discCheck");
  const term = document.getElementById("termCheck");
  const btn = document.getElementById("wizardNextBtn");

  if (!faq || !disc || !term || !btn) return;

  btn.disabled = !(faq.checked && disc.checked && term.checked);
}

function updatePersonalButtonState() {
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const birthDate = document.getElementById("birthDate");
  const gender = document.getElementById("gender");
  const btn = document.getElementById("wizardNextBtn");

  if (!firstName || !lastName || !birthDate || !gender || !btn) return;

  btn.disabled = !(
    firstName.value.trim() &&
    lastName.value.trim() &&
    birthDate.value &&
    gender.value
  );
}

function updateLiveAvatar() {
  const gender = document.getElementById("gender");
  const avatar = document.getElementById("jobProfileAvatarPreview");
  if (!gender || !avatar) return;

  avatar.classList.remove("avatarMale", "avatarFemale", "avatarNeutral");

  if (gender.value === "uomo") {
    avatar.classList.add("avatarMale");
    return;
  }

  if (gender.value === "donna") {
    avatar.classList.add("avatarFemale");
    return;
  }

  avatar.classList.add("avatarNeutral");
}

function bindWizardEvents() {
  document.getElementById("wizardCloseBtn")?.addEventListener("click", () => {
    saveJobProfile();
    document.dispatchEvent(new Event("nettotrack:closeJobProfile"));
  });

  document.getElementById("wizardBackBtn")?.addEventListener("click", () => {
    prevWizard();
  });

  if (jobProfileWizard.step === 1) {
    const faq = document.getElementById("faqCheck");
    const disc = document.getElementById("discCheck");
    const term = document.getElementById("termCheck");
    const btn = document.getElementById("wizardNextBtn");

    [faq, disc, term].forEach((el) => {
      el?.addEventListener("change", () => {
        jobProfileState.legalAcceptance.faq = !!faq?.checked;
        jobProfileState.legalAcceptance.disclaimer = !!disc?.checked;
        jobProfileState.legalAcceptance.terms = !!term?.checked;
        updateLegalButtonState();
      });
    });

    updateLegalButtonState();

    btn?.addEventListener("click", () => {
      saveJobProfile();
      nextWizard();
    });
  }

  if (jobProfileWizard.step === 2) {
    const firstName = document.getElementById("firstName");
    const lastName = document.getElementById("lastName");
    const birthDate = document.getElementById("birthDate");
    const gender = document.getElementById("gender");
    const btn = document.getElementById("wizardNextBtn");

    [firstName, lastName, birthDate].forEach((el) => {
      el?.addEventListener("input", updatePersonalButtonState);
      el?.addEventListener("change", updatePersonalButtonState);
    });

    gender?.addEventListener("change", () => {
      updatePersonalButtonState();
      updateLiveAvatar();
    });

    updatePersonalButtonState();
    updateLiveAvatar();

    btn?.addEventListener("click", () => {
      jobProfileState.userProfile.firstName = firstName?.value.trim() || "";
      jobProfileState.userProfile.lastName = lastName?.value.trim() || "";
      jobProfileState.userProfile.birthDate = birthDate?.value || "";
      jobProfileState.userProfile.gender = gender?.value || "";

      saveJobProfile();
      nextWizard();
    });
  }

  if (jobProfileWizard.step === 3 || jobProfileWizard.step === 4) {
    document.getElementById("wizardNextBtn")?.addEventListener("click", () => {
      nextWizard();
    });
  }

  if (jobProfileWizard.step === 5) {
    document.getElementById("wizardSaveBtn")?.addEventListener("click", () => {
      jobProfileState.profileMeta.setupCompleted = true;
      saveJobProfile();
      renderMainCard();
    });
  }
}

/* =========================
   Start / init
   ========================= */

function startWizard() {
  resetWizard();
  renderWizard();
}

function initJobProfile() {
  loadJobProfile();
  renderMainCard();
}

document.addEventListener("nettotrack:jobProfileOpened", () => {
  initJobProfile();
});