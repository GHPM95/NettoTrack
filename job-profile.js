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
    setupMode: "",
    lastUpdatedAt: null
  }
};

const jobProfileWizard = {
  step: 1,
  total: 6
};

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

function loadJobProfileState() {
  const saved = localStorage.getItem("nt_jobProfile");
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    Object.assign(jobProfileState.userProfile, parsed.userProfile || {});
    Object.assign(jobProfileState.addressProfile, parsed.addressProfile || {});
    Object.assign(jobProfileState.jobProfile, parsed.jobProfile || {});
    Object.assign(jobProfileState.payProfile, parsed.payProfile || {});
    Object.assign(jobProfileState.payRules, parsed.payRules || {});
    Object.assign(jobProfileState.legalAcceptance, parsed.legalAcceptance || {});
    Object.assign(jobProfileState.profileMeta, parsed.profileMeta || {});
  } catch (err) {
    console.warn("NettoTrack job profile load error:", err);
  }
}

function saveJobProfile() {
  jobProfileState.profileMeta.lastUpdatedAt = new Date().toISOString();
  localStorage.setItem("nt_jobProfile", JSON.stringify(jobProfileState));
}

function resetWizard() {
  jobProfileWizard.step = 1;
}

function nextWizardStep() {
  jobProfileWizard.step = Math.min(jobProfileWizard.total, jobProfileWizard.step + 1);
  rerenderWizard();
}

function prevWizardStep() {
  jobProfileWizard.step = Math.max(1, jobProfileWizard.step - 1);
  rerenderWizard();
}

function getAvatarVariant() {
  const g = (jobProfileState.userProfile.gender || "").toLowerCase();
  if (g === "uomo") return "avatarMale";
  if (g === "donna") return "avatarFemale";
  return "avatarNeutral";
}

function buildAvatarMarkup() {
  return `
    <div class="jobProfileAvatar ${getAvatarVariant()}">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="white" stroke-width="2"/>
        <path d="M4 20c2-4 6-6 8-6s6 2 8 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
  `;
}

function calcSeniority(hireDate) {
  if (!hireDate) return "";

  const start = new Date(hireDate);
  const now = new Date();

  if (Number.isNaN(start.getTime())) return "";

  const diff = now - start;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 30) return `${days} giorni`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mesi`;

  const years = Math.floor(months / 12);
  const rem = months % 12;

  return rem > 0 ? `${years} anni, ${rem} mesi` : `${years} anni`;
}

function getContractTypesSafe() {
  if (typeof contractTypes !== "undefined" && Array.isArray(contractTypes)) return contractTypes;
  if (Array.isArray(window.contractTypes)) return window.contractTypes;
  return [];
}

function getCCNLListSafe() {
  if (typeof ccnlList !== "undefined" && Array.isArray(ccnlList)) return ccnlList;
  if (Array.isArray(window.ccnlList)) return window.ccnlList;
  return [];
}

function getGeoSafe() {
  if (typeof italyGeoData !== "undefined" && italyGeoData?.regions) return italyGeoData;
  if (window.italyGeoData?.regions) return window.italyGeoData;
  return { regions: {} };
}

function buildOptions(values, selectedValue = "", placeholder = "") {
  let html = "";

  if (placeholder) {
    html += `<option value="">${esc(placeholder)}</option>`;
  }

  values.forEach((value) => {
    const selected = String(value) === String(selectedValue) ? "selected" : "";
    html += `<option value="${esc(value)}" ${selected}>${esc(value)}</option>`;
  });

  return html;
}

/* =========================
   Empty/Profile card
   ========================= */

function buildProfileHTML() {
  const u = jobProfileState.userProfile;
  const j = jobProfileState.jobProfile;

  const summaryName = u.firstName ? `Nome: ${u.firstName}` : "Nome:";
  const summaryLastName = u.lastName ? `Cognome: ${u.lastName}` : "Cognome:";
  const summaryGender = u.gender ? `Sesso: ${u.gender}` : "Sesso:";
  const summaryBirth = u.birthDate ? `Data di nascita: ${u.birthDate}` : "Data di nascita:";
  const summaryCountry = jobProfileState.addressProfile.country
    ? `Paese: ${jobProfileState.addressProfile.country}`
    : "Paese:";
  const summaryRole = j.role ? `Occupazione: ${j.role}` : "Occupazione:";

  return `
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

      <div id="jobProfileEmpty" class="jobProfileContent">
        <div class="jobProfilePreviewCard">
          <div class="jobProfilePreviewAvatarBox">
            ${buildAvatarMarkup()}
          </div>

          <div class="jobProfilePreviewInfo">
            <div class="jobProfilePreviewRow">${esc(summaryName)}</div>
            <div class="jobProfilePreviewRow">${esc(summaryLastName)}</div>
            <div class="jobProfilePreviewRow">${esc(summaryGender)}</div>
            <div class="jobProfilePreviewRow">${esc(summaryBirth)}</div>
            <div class="jobProfilePreviewRow">${esc(summaryCountry)}</div>
            <div class="jobProfilePreviewRow">${esc(summaryRole)}</div>
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
}

function buildProfileSavedHTML() {
  const u = jobProfileState.userProfile;
  const a = jobProfileState.addressProfile;
  const j = jobProfileState.jobProfile;

  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Profilo configurato";
  const birth = [u.birthDate, u.gender].filter(Boolean).join(" • ") || "Dati anagrafici";
  const location = [a.country, a.region, a.municipality, a.zipCode].filter(Boolean).join(" • ") || "Residenza";
  const company = j.companyName ? `Azienda: ${j.companyName}` : "Azienda";
  const role = j.role ? `Mansione: ${j.role}` : "Mansione";
  const level = j.level ? `Livello: ${j.level}` : "Livello";
  const hire = j.hireDate ? `Data assunzione: ${j.hireDate}` : "Data assunzione";
  const seniority = calcSeniority(j.hireDate);
  const seniorityText = seniority ? `Anzianità: ${seniority}` : "Anzianità";

  return `
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

      <div class="jobProfileSavedContent">
        <div class="jobProfileSavedHero">
          ${buildAvatarMarkup()}

          <div class="jobProfileSavedHint">Tocca per modificare i dati</div>
        </div>

        <div class="jobProfileSavedBlock">
          <div class="jobProfileSavedRow">${esc(name)}</div>
          <div class="jobProfileSavedRow">${esc(birth)}</div>
          <div class="jobProfileSavedRow">${esc(location)}</div>
        </div>

        <div class="menuDivider"></div>

        <div class="jobProfileSavedBlock">
          <div class="jobProfileSavedRow">${esc(company)}</div>
          <div class="jobProfileSavedRow">${esc(role)}</div>
          <div class="jobProfileSavedRow">${esc(level)}</div>
          <div class="jobProfileSavedRow">${esc(hire)}</div>
          <div class="jobProfileSavedRow">${esc(seniorityText)}</div>
        </div>
      </div>
    </section>
  `;
}

function mountJobProfileCard() {
  const mount = getMount();
  if (!mount) return;

  if (jobProfileState.profileMeta.setupCompleted) {
    mount.innerHTML = buildProfileSavedHTML();
  } else {
    mount.innerHTML = buildProfileHTML();
  }

  bindMainCardEvents();
}

function bindMainCardEvents() {
  document.getElementById("jobProfileSetupBtn")?.addEventListener("click", () => {
    startJobProfileWizard();
  });

  document.getElementById("jobProfileCloseBtn")?.addEventListener("click", () => {
    saveJobProfile();
    document.dispatchEvent(new Event("nettotrack:closeJobProfile"));
  });

  document.querySelector(".jobProfileSavedHero .jobProfileAvatar")?.addEventListener("click", () => {
    startJobProfileWizard();
  });
}

/* =========================
   Wizard
   ========================= */

function buildWizardFrame(innerHTML, title, subtitle = "") {
  return `
    <section class="jobProfileCard">
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

      <div class="jobWizardIntro">
        ${subtitle ? `<div class="jobWizardSub">${esc(subtitle)}</div>` : ""}
      </div>

      <div class="jobWizardBody">
        ${innerHTML}
      </div>
    </section>
  `;
}

function renderWizardLegal() {
  const legal = jobProfileState.legalAcceptance;

  return buildWizardFrame(
    `
      <div id="wizardLegalScroll" class="jobWizardLegalBox">
        <div class="jobWizardTextBlock">
          <h3 class="jobWizardSmallTitle">FAQ</h3>
          <p>NettoTrack utilizza i dati inseriti dall’utente per creare stime e simulazioni.</p>
          <p>I risultati possono essere indicativi e potrebbero non coincidere con la busta paga reale.</p>

          <h3 class="jobWizardSmallTitle">Disclaimer</h3>
          <p>L'app non sostituisce consulenza fiscale, contabile, del lavoro o professionale.</p>
          <p>L’utente resta responsabile della verifica dei dati inseriti e dei risultati ottenuti.</p>

          <h3 class="jobWizardSmallTitle">Termini di utilizzo</h3>
          <p>Proseguendo accetti di utilizzare NettoTrack solo a scopo informativo e personale.</p>
          <p>Per continuare devi leggere tutto il testo, scorrere fino in fondo e confermare ogni voce.</p>
        </div>
      </div>

      <label class="jobWizardCheck">
        <input id="wizardFaqCheck" type="checkbox" ${legal.faq ? "checked" : ""}>
        <span>Ho letto le FAQ</span>
      </label>

      <label class="jobWizardCheck">
        <input id="wizardDisclaimerCheck" type="checkbox" ${legal.disclaimer ? "checked" : ""}>
        <span>Ho letto il disclaimer</span>
      </label>

      <label class="jobWizardCheck">
        <input id="wizardTermsCheck" type="checkbox" ${legal.terms ? "checked" : ""}>
        <span>Accetto i termini di utilizzo</span>
      </label>

      <button id="wizardLegalNext" class="jobProfilePrimaryBtn wizardMainBtn" type="button" disabled>
        Continua
      </button>
    `,
    "Profilo utente",
    "Leggi tutto prima di proseguire"
  );
}

function renderWizardMode() {
  const currentMode = jobProfileState.profileMeta.setupMode || "";

  return buildWizardFrame(
    `
      <div class="jobWizardFields">
        <button id="wizardModeFast" class="wizardChoiceBtn ${currentMode === "fast" ? "isSelectedWizardChoice" : ""}" type="button">
          Modalità rapida
        </button>

        <button id="wizardModeAdvanced" class="wizardChoiceBtn ${currentMode === "advanced" ? "isSelectedWizardChoice" : ""}" type="button">
          Modalità avanzata
        </button>
      </div>
    `,
    "Crea profilo",
    "Scegli come vuoi configurarlo"
  );
}

function renderWizardPersonal() {
  const u = jobProfileState.userProfile;
  const a = jobProfileState.addressProfile;
  const geo = getGeoSafe();

  const regions = Object.keys(geo.regions || {});
  const provinces = a.region && geo.regions[a.region]
    ? Object.keys(geo.regions[a.region].provinces || {})
    : [];

  const municipalities = a.region && a.province && geo.regions[a.region]?.provinces[a.province]
    ? geo.regions[a.region].provinces[a.province].map((item) => item[0])
    : [];

  return buildWizardFrame(
    `
      <div class="jobWizardFields">
        <input id="wizardFirstName" class="jobWizardInput" placeholder="Nome" value="${esc(u.firstName)}">
        <input id="wizardLastName" class="jobWizardInput" placeholder="Cognome" value="${esc(u.lastName)}">
        <input id="wizardBirthDate" class="jobWizardInput" type="date" value="${esc(u.birthDate)}">

        <select id="wizardGender" class="jobWizardInput">
          ${buildOptions(["uomo", "donna", "non specificato", "altro"], u.gender, "Sesso")}
        </select>

        <select id="wizardCountry" class="jobWizardInput">
          <option value="Italia" selected>Italia</option>
        </select>

        <select id="wizardRegion" class="jobWizardInput">
          ${buildOptions(regions, a.region, "Regione")}
        </select>

        <select id="wizardProvince" class="jobWizardInput" ${a.region ? "" : "disabled"}>
          ${buildOptions(provinces, a.province, "Provincia")}
        </select>

        <select id="wizardMunicipality" class="jobWizardInput" ${a.province ? "" : "disabled"}>
          ${buildOptions(municipalities, a.municipality, "Comune")}
        </select>

        <input id="wizardZipCode" class="jobWizardInput" placeholder="CAP" value="${esc(a.zipCode)}" readonly>
        <input id="wizardStreet" class="jobWizardInput" placeholder="Via / Piazza" value="${esc(a.street)}">
        <input id="wizardStreetNumber" class="jobWizardInput" placeholder="Numero civico" value="${esc(a.streetNumber)}">
      </div>

      <button id="wizardPersonalNext" class="jobProfilePrimaryBtn wizardMainBtn" type="button">
        Continua
      </button>
    `,
    "Dati personali",
    "Anagrafica e residenza"
  );
}

function renderWizardJob() {
  const j = jobProfileState.jobProfile;
  const contracts = getContractTypesSafe();

  return buildWizardFrame(
    `
      <div class="jobWizardFields">
        <input id="wizardCompanyName" class="jobWizardInput" placeholder="Nome azienda" value="${esc(j.companyName)}">
        <input id="wizardCompanyAddress" class="jobWizardInput" placeholder="Sede azienda (opzionale)" value="${esc(j.companyAddress)}">

        <select id="wizardContractType" class="jobWizardInput">
          ${buildOptions(contracts, j.contractType, "Tipo di contratto")}
        </select>

        <div class="jobWizardSuggestionWrap">
          <input id="wizardAppliedContract" class="jobWizardInput" placeholder="CCNL / Contratto applicato" value="${esc(j.appliedContract)}" autocomplete="off">
          <div id="wizardCCNLSuggestions" class="jobWizardSuggestions hidden"></div>
        </div>

        <input id="wizardLevel" class="jobWizardInput" placeholder="Livello" value="${esc(j.level)}">
        <input id="wizardRole" class="jobWizardInput" placeholder="Mansione" value="${esc(j.role)}">
        <input id="wizardHireDate" class="jobWizardInput" type="date" value="${esc(j.hireDate)}">

        <select id="wizardWorkType" class="jobWizardInput">
          ${buildOptions(["Full time", "Part time"], j.workType, "Full / Part time")}
        </select>

        <input id="wizardWeeklyHours" class="jobWizardInput" inputmode="numeric" placeholder="Ore settimanali" value="${esc(j.weeklyHours)}">

        <select id="wizardSalaryMonths" class="jobWizardInput">
          ${buildOptions(["12", "13", "14"], j.salaryMonths, "Mensilità")}
        </select>
      </div>

      <button id="wizardJobNext" class="jobProfilePrimaryBtn wizardMainBtn" type="button">
        Continua
      </button>
    `,
    "Dati lavoro",
    "Contratto, azienda e organizzazione"
  );
}

function renderWizardSalary() {
  const p = jobProfileState.payProfile;
  const mode = jobProfileState.profileMeta.setupMode;

  return buildWizardFrame(
    `
      <div class="jobWizardFields">
        <input id="wizardHourlyRate" class="jobWizardInput" inputmode="decimal" placeholder="Paga oraria" value="${esc(p.hourlyRate)}">
        <input id="wizardNetMonthly" class="jobWizardInput" inputmode="decimal" placeholder="Netto mensile" value="${esc(p.netMonthly)}">
        <input id="wizardGrossMonthly" class="jobWizardInput" inputmode="decimal" placeholder="Lordo mensile" value="${esc(p.grossMonthly)}">
      </div>

      ${
        mode === "advanced"
          ? `
          <div class="jobWizardFields jobWizardExtraGroup">
            <label class="jobWizardSwitchRow">
              <span>Lavoro festivo</span>
              <input id="wizardHolidayEnabled" type="checkbox" ${jobProfileState.payRules.holidayEnabled ? "checked" : ""}>
            </label>
            <input id="wizardHolidayValue" class="jobWizardInput ${jobProfileState.payRules.holidayEnabled ? "" : "hidden"}" inputmode="decimal" placeholder="Prezzo festivo" value="${esc(jobProfileState.payRules.holidayValue)}">

            <label class="jobWizardSwitchRow">
              <span>Lavoro domenicale</span>
              <input id="wizardSundayEnabled" type="checkbox" ${jobProfileState.payRules.sundayEnabled ? "checked" : ""}>
            </label>
            <input id="wizardSundayValue" class="jobWizardInput ${jobProfileState.payRules.sundayEnabled ? "" : "hidden"}" inputmode="decimal" placeholder="Prezzo domenicale" value="${esc(jobProfileState.payRules.sundayValue)}">

            <label class="jobWizardSwitchRow">
              <span>Lavoro notturno</span>
              <input id="wizardNightEnabled" type="checkbox" ${jobProfileState.payRules.nightEnabled ? "checked" : ""}>
            </label>
            <input id="wizardNightValue" class="jobWizardInput ${jobProfileState.payRules.nightEnabled ? "" : "hidden"}" inputmode="decimal" placeholder="Prezzo notturno" value="${esc(jobProfileState.payRules.nightValue)}">
          </div>
          `
          : ""
      }

      <button id="wizardSalaryNext" class="jobProfilePrimaryBtn wizardMainBtn" type="button">
        Continua
      </button>
    `,
    "Retribuzione",
    "Base economica"
  );
}

function renderWizardReview() {
  const u = jobProfileState.userProfile;
  const a = jobProfileState.addressProfile;
  const j = jobProfileState.jobProfile;
  const p = jobProfileState.payProfile;

  return buildWizardFrame(
    `
      <div class="reviewSection">
        <strong>Dati personali</strong><br>
        ${esc(`${u.firstName} ${u.lastName}`.trim() || "Non configurati")}<br>
        ${esc(u.birthDate || "-")}<br>
        ${esc(u.gender || "-")}
      </div>

      <div class="reviewSection">
        <strong>Residenza</strong><br>
        ${esc(a.country || "-")}<br>
        ${esc(a.region || "-")}<br>
        ${esc(a.province || "-")}<br>
        ${esc(a.municipality || "-")}<br>
        ${esc(a.zipCode || "-")}
      </div>

      <div class="reviewSection">
        <strong>Lavoro</strong><br>
        ${esc(j.companyName || "-")}<br>
        ${esc(j.role || "-")}<br>
        ${esc(j.level || "-")}
      </div>

      <div class="reviewSection">
        <strong>Retribuzione</strong><br>
        Paga oraria: ${esc(p.hourlyRate || "-")}<br>
        Netto mensile: ${esc(p.netMonthly || "-")}<br>
        Lordo mensile: ${esc(p.grossMonthly || "-")}
      </div>

      <button id="wizardSaveBtn" class="jobProfilePrimaryBtn wizardMainBtn" type="button">
        Salva profilo
      </button>
    `,
    "Revisione dati",
    "Controlla tutto prima di salvare"
  );
}

function renderWizardStep() {
  switch (jobProfileWizard.step) {
    case 1: return renderWizardLegal();
    case 2: return renderWizardMode();
    case 3: return renderWizardPersonal();
    case 4: return renderWizardJob();
    case 5: return renderWizardSalary();
    case 6: return renderWizardReview();
    default: return renderWizardLegal();
  }
}

function rerenderWizard() {
  const mount = getMount();
  if (!mount) return;

  mount.innerHTML = renderWizardStep();
  bindWizardEvents();
}

function updateLegalNextState() {
  const nextBtn = document.getElementById("wizardLegalNext");
  const faq = document.getElementById("wizardFaqCheck")?.checked;
  const disclaimer = document.getElementById("wizardDisclaimerCheck")?.checked;
  const terms = document.getElementById("wizardTermsCheck")?.checked;
  const scrollReached = jobProfileState.legalAcceptance.scroll;

  if (nextBtn) {
    nextBtn.disabled = !(faq && disclaimer && terms && scrollReached);
  }
}

function setupLegalStep() {
  const scrollBox = document.getElementById("wizardLegalScroll");
  const faq = document.getElementById("wizardFaqCheck");
  const disclaimer = document.getElementById("wizardDisclaimerCheck");
  const terms = document.getElementById("wizardTermsCheck");
  const nextBtn = document.getElementById("wizardLegalNext");

  if (scrollBox) {
    scrollBox.addEventListener("scroll", () => {
      const reached = scrollBox.scrollTop + scrollBox.clientHeight >= scrollBox.scrollHeight - 4;
      if (reached) {
        jobProfileState.legalAcceptance.scroll = true;
        updateLegalNextState();
      }
    });
  }

  [faq, disclaimer, terms].forEach((el) => {
    el?.addEventListener("change", () => {
      jobProfileState.legalAcceptance.faq = !!faq?.checked;
      jobProfileState.legalAcceptance.disclaimer = !!disclaimer?.checked;
      jobProfileState.legalAcceptance.terms = !!terms?.checked;
      updateLegalNextState();
    });
  });

  nextBtn?.addEventListener("click", () => {
    saveJobProfile();
    nextWizardStep();
  });

  updateLegalNextState();
}

function populateProvinceSelect(regionValue) {
  const province = document.getElementById("wizardProvince");
  const municipality = document.getElementById("wizardMunicipality");
  const zip = document.getElementById("wizardZipCode");
  const geo = getGeoSafe();

  if (!province || !municipality || !zip) return;

  if (!regionValue || !geo.regions[regionValue]) {
    province.innerHTML = buildOptions([], "", "Provincia");
    province.disabled = true;
    municipality.innerHTML = buildOptions([], "", "Comune");
    municipality.disabled = true;
    zip.value = "";
    return;
  }

  const provinces = Object.keys(geo.regions[regionValue].provinces || {});
  province.innerHTML = buildOptions(provinces, "", "Provincia");
  province.disabled = false;

  municipality.innerHTML = buildOptions([], "", "Comune");
  municipality.disabled = true;
  zip.value = "";
}

function populateMunicipalitySelect(regionValue, provinceValue) {
  const municipality = document.getElementById("wizardMunicipality");
  const zip = document.getElementById("wizardZipCode");
  const geo = getGeoSafe();

  if (!municipality || !zip) return;

  const list = geo.regions[regionValue]?.provinces?.[provinceValue] || [];
  const names = list.map((item) => item[0]);

  municipality.innerHTML = buildOptions(names, "", "Comune");
  municipality.disabled = names.length === 0;
  zip.value = "";
}

function applyZipFromSelection(regionValue, provinceValue, municipalityValue) {
  const zip = document.getElementById("wizardZipCode");
  const geo = getGeoSafe();

  if (!zip) return;

  const list = geo.regions[regionValue]?.provinces?.[provinceValue] || [];
  const found = list.find((item) => item[0] === municipalityValue);

  zip.value = found ? found[1] : "";
}

function setupPersonalStep() {
  const region = document.getElementById("wizardRegion");
  const province = document.getElementById("wizardProvince");
  const municipality = document.getElementById("wizardMunicipality");

  region?.addEventListener("change", () => {
    populateProvinceSelect(region.value);
  });

  province?.addEventListener("change", () => {
    populateMunicipalitySelect(region?.value || "", province.value);
  });

  municipality?.addEventListener("change", () => {
    applyZipFromSelection(region?.value || "", province?.value || "", municipality.value);
  });

  document.getElementById("wizardPersonalNext")?.addEventListener("click", () => {
    jobProfileState.userProfile.firstName = document.getElementById("wizardFirstName")?.value.trim() || "";
    jobProfileState.userProfile.lastName = document.getElementById("wizardLastName")?.value.trim() || "";
    jobProfileState.userProfile.birthDate = document.getElementById("wizardBirthDate")?.value || "";
    jobProfileState.userProfile.gender = document.getElementById("wizardGender")?.value || "";

    jobProfileState.addressProfile.country = "Italia";
    jobProfileState.addressProfile.region = document.getElementById("wizardRegion")?.value || "";
    jobProfileState.addressProfile.province = document.getElementById("wizardProvince")?.value || "";
    jobProfileState.addressProfile.municipality = document.getElementById("wizardMunicipality")?.value || "";
    jobProfileState.addressProfile.zipCode = document.getElementById("wizardZipCode")?.value || "";
    jobProfileState.addressProfile.street = document.getElementById("wizardStreet")?.value.trim() || "";
    jobProfileState.addressProfile.streetNumber = document.getElementById("wizardStreetNumber")?.value.trim() || "";

    saveJobProfile();
    nextWizardStep();
  });
}

function renderCCNLSuggestions(query) {
  const box = document.getElementById("wizardCCNLSuggestions");
  const list = getCCNLListSafe();

  if (!box) return;

  const q = (query || "").trim().toLowerCase();

  if (!q) {
    box.innerHTML = "";
    box.classList.add("hidden");
    return;
  }

  const results = list.filter((item) => item.toLowerCase().includes(q)).slice(0, 8);

  if (!results.length) {
    box.innerHTML = "";
    box.classList.add("hidden");
    return;
  }

  box.innerHTML = results
    .map((item) => `<button class="jobWizardSuggestionItem" type="button" data-ccnl="${esc(item)}">${esc(item)}</button>`)
    .join("");

  box.classList.remove("hidden");

  Array.from(box.querySelectorAll(".jobWizardSuggestionItem")).forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById("wizardAppliedContract");
      if (!input) return;
      input.value = btn.dataset.ccnl || "";
      box.innerHTML = "";
      box.classList.add("hidden");
    });
  });
}

function setupJobStep() {
  const applied = document.getElementById("wizardAppliedContract");

  applied?.addEventListener("input", () => {
    renderCCNLSuggestions(applied.value);
  });

  document.getElementById("wizardJobNext")?.addEventListener("click", () => {
    jobProfileState.jobProfile.companyName = document.getElementById("wizardCompanyName")?.value.trim() || "";
    jobProfileState.jobProfile.companyAddress = document.getElementById("wizardCompanyAddress")?.value.trim() || "";
    jobProfileState.jobProfile.contractType = document.getElementById("wizardContractType")?.value || "";
    jobProfileState.jobProfile.appliedContract = document.getElementById("wizardAppliedContract")?.value.trim() || "";
    jobProfileState.jobProfile.level = document.getElementById("wizardLevel")?.value.trim() || "";
    jobProfileState.jobProfile.role = document.getElementById("wizardRole")?.value.trim() || "";
    jobProfileState.jobProfile.hireDate = document.getElementById("wizardHireDate")?.value || "";
    jobProfileState.jobProfile.workType = document.getElementById("wizardWorkType")?.value || "";
    jobProfileState.jobProfile.weeklyHours = document.getElementById("wizardWeeklyHours")?.value.trim() || "";
    jobProfileState.jobProfile.salaryMonths = document.getElementById("wizardSalaryMonths")?.value || "13";

    saveJobProfile();
    nextWizardStep();
  });
}

function syncSalaryInputState() {
  const hourly = document.getElementById("wizardHourlyRate");
  const net = document.getElementById("wizardNetMonthly");
  const gross = document.getElementById("wizardGrossMonthly");

  if (!hourly || !net || !gross) return;

  const hourlyHasValue = hourly.value.trim() !== "";
  const monthlyHasValue = net.value.trim() !== "" || gross.value.trim() !== "";

  if (!hourlyHasValue && !monthlyHasValue) {
    hourly.disabled = false;
    net.disabled = false;
    gross.disabled = false;
    return;
  }

  if (hourlyHasValue) {
    net.disabled = true;
    gross.disabled = true;
    hourly.disabled = false;
    return;
  }

  hourly.disabled = true;
  net.disabled = false;
  gross.disabled = false;
}

function bindToggleField(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);

  if (!toggle || !input) return;

  function apply() {
    input.classList.toggle("hidden", !toggle.checked);
    if (!toggle.checked) input.value = "";
  }

  toggle.addEventListener("change", apply);
  apply();
}

function setupSalaryStep() {
  const hourly = document.getElementById("wizardHourlyRate");
  const net = document.getElementById("wizardNetMonthly");
  const gross = document.getElementById("wizardGrossMonthly");

  [hourly, net, gross].forEach((el) => {
    el?.addEventListener("input", syncSalaryInputState);
  });

  syncSalaryInputState();

  bindToggleField("wizardHolidayEnabled", "wizardHolidayValue");
  bindToggleField("wizardSundayEnabled", "wizardSundayValue");
  bindToggleField("wizardNightEnabled", "wizardNightValue");

  document.getElementById("wizardSalaryNext")?.addEventListener("click", () => {
    jobProfileState.payProfile.hourlyRate = hourly?.value.trim() || "";
    jobProfileState.payProfile.netMonthly = net?.value.trim() || "";
    jobProfileState.payProfile.grossMonthly = gross?.value.trim() || "";

    if (jobProfileState.payProfile.hourlyRate) {
      jobProfileState.payProfile.inputMode = "hourly";
    } else if (jobProfileState.payProfile.netMonthly || jobProfileState.payProfile.grossMonthly) {
      jobProfileState.payProfile.inputMode = "monthly";
    } else {
      jobProfileState.payProfile.inputMode = "";
    }

    const holidayEnabled = document.getElementById("wizardHolidayEnabled");
    const holidayValue = document.getElementById("wizardHolidayValue");
    const sundayEnabled = document.getElementById("wizardSundayEnabled");
    const sundayValue = document.getElementById("wizardSundayValue");
    const nightEnabled = document.getElementById("wizardNightEnabled");
    const nightValue = document.getElementById("wizardNightValue");

    jobProfileState.payRules.holidayEnabled = !!holidayEnabled?.checked;
    jobProfileState.payRules.holidayValue = holidayValue?.value.trim() || "";
    jobProfileState.payRules.sundayEnabled = !!sundayEnabled?.checked;
    jobProfileState.payRules.sundayValue = sundayValue?.value.trim() || "";
    jobProfileState.payRules.nightEnabled = !!nightEnabled?.checked;
    jobProfileState.payRules.nightValue = nightValue?.value.trim() || "";

    saveJobProfile();
    nextWizardStep();
  });
}

function setupModeStep() {
  document.getElementById("wizardModeFast")?.addEventListener("click", () => {
    jobProfileState.profileMeta.setupMode = "fast";
    saveJobProfile();
    nextWizardStep();
  });

  document.getElementById("wizardModeAdvanced")?.addEventListener("click", () => {
    jobProfileState.profileMeta.setupMode = "advanced";
    saveJobProfile();
    nextWizardStep();
  });
}

function setupReviewStep() {
  document.getElementById("wizardSaveBtn")?.addEventListener("click", () => {
    jobProfileState.profileMeta.setupCompleted = true;
    saveJobProfile();
    mountJobProfileCard();
  });
}

function bindWizardEvents() {
  document.getElementById("wizardCloseBtn")?.addEventListener("click", () => {
    saveJobProfile();
    document.dispatchEvent(new Event("nettotrack:closeJobProfile"));
  });

  document.getElementById("wizardBackBtn")?.addEventListener("click", () => {
    prevWizardStep();
  });

  switch (jobProfileWizard.step) {
    case 1: setupLegalStep(); break;
    case 2: setupModeStep(); break;
    case 3: setupPersonalStep(); break;
    case 4: setupJobStep(); break;
    case 5: setupSalaryStep(); break;
    case 6: setupReviewStep(); break;
  }
}

function startJobProfileWizard() {
  resetWizard();
  rerenderWizard();
}

function initJobProfile() {
  loadJobProfileState();
  mountJobProfileCard();
}

document.addEventListener("nettotrack:jobProfileOpened", () => {
  requestAnimationFrame(() => {
    initJobProfile();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  if (getMount()) initJobProfile();
});

window.NettoTrackJobProfile = {
  init: initJobProfile,
  save: saveJobProfile,
  state: jobProfileState
};