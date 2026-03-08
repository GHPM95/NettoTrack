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
    country: "Italia",
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

/* =========================
   Wizard state
   ========================= */

const jobProfileWizard = {
  step: 1,
  total: 7
};

/* =========================
   Storage
   ========================= */

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

  localStorage.setItem(
    "nt_jobProfile",
    JSON.stringify(jobProfileState)
  );
}

/* =========================
   Helpers
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

function getRoot() {
  return document.getElementById("jobProfileRoot");
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
  const remMonths = months % 12;

  if (remMonths > 0) return `${years} anni, ${remMonths} mesi`;
  return `${years} anni`;
}

function formatBirthText() {
  const u = jobProfileState.userProfile;
  const parts = [];

  if (u.birthDate) parts.push(u.birthDate);
  if (u.gender) parts.push(u.gender);

  return parts.length ? parts.join(" • ") : "Data di nascita e sesso non configurati";
}

function formatLocationText() {
  const a = jobProfileState.addressProfile;
  const parts = [];

  if (a.country) parts.push(a.country);
  if (a.region) parts.push(a.region);
  if (a.municipality) parts.push(a.municipality);
  if (a.zipCode) parts.push(a.zipCode);

  return parts.length ? parts.join(" • ") : "Residenza non configurata";
}

function getAvatarSymbol() {
  const gender = (jobProfileState.userProfile.gender || "").toLowerCase();

  if (gender === "uomo") return "👨";
  if (gender === "donna") return "👩";
  if (gender === "altro") return "🧑";
  if (gender === "non specificato") return "🙂";
  return "🙂";
}

function getContractTypesSafe() {
  return Array.isArray(window.contractTypes) ? window.contractTypes : [];
}

function getCCNLListSafe() {
  return Array.isArray(window.ccnlList) ? window.ccnlList : [];
}

function getGeoSafe() {
  return window.italyGeoData && window.italyGeoData.regions
    ? window.italyGeoData
    : { regions: {} };
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
   Main card
   ========================= */

function buildProfileHTML() {
  return `
    <section id="jobProfileRoot" class="jobProfileCard">
      <header class="jobProfileHeader">
        <h2 class="jobProfileTitle">Profilo utente</h2>
        <p class="jobProfileSub">
          Dati personali e lavorativi utilizzati da NettoTrack per le stime.
        </p>
      </header>

      <div class="jobProfileContent">
        <div id="jobProfileEmpty" class="jobProfileEmpty hidden">
          <p class="jobProfileIntro">
            Configura il tuo profilo per permettere a NettoTrack di analizzare il tuo lavoro
            e preparare le stime future.
          </p>

          <button id="jobProfileSetupBtn" class="menuItemBtn" type="button">
            Configura profilo
          </button>

          <button id="jobProfileImportBtn" class="menuItemBtn" type="button">
            Importa contratto da fotocamera
          </button>
        </div>

        <div id="jobProfileView" class="jobProfileView hidden">
          <div class="jobProfileAvatarBox">
            <div id="jobProfileAvatar" class="jobProfileAvatar">${getAvatarSymbol()}</div>
            <div class="jobProfileAvatarHint">Tocca per modificare i dati</div>
          </div>

          <div class="jobProfileMainInfo">
            <div class="jobProfileRow" id="jpName"></div>
            <div class="jobProfileRow" id="jpBirth"></div>
            <div class="jobProfileRow" id="jpLocation"></div>
          </div>

          <div class="menuDivider"></div>

          <div class="jobProfileWorkInfo">
            <div class="jobProfileRow" id="jpCompany"></div>
            <div class="jobProfileRow" id="jpRole"></div>
            <div class="jobProfileRow" id="jpLevel"></div>
            <div class="jobProfileRow" id="jpHireDate"></div>
            <div class="jobProfileRow" id="jpSeniority"></div>
          </div>

          <button id="jobProfileExpandBtn" class="menuItemBtn" type="button">
            Visualizza dati
          </button>

          <div id="jobProfileExpanded" class="jobProfileExpanded hidden"></div>

          <div class="jobProfileImportBox">
            <button id="jobProfileImportNew" class="menuItemBtn" type="button">
              Importa nuovo contratto
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildExpandedProfileHTML() {
  const u = jobProfileState.userProfile;
  const a = jobProfileState.addressProfile;
  const j = jobProfileState.jobProfile;
  const p = jobProfileState.payProfile;
  const r = jobProfileState.payRules;

  return `
    <div class="reviewSection">
      <strong>Dati personali</strong><br>
      Nome: ${esc(u.firstName || "-")}<br>
      Cognome: ${esc(u.lastName || "-")}<br>
      Data di nascita: ${esc(u.birthDate || "-")}<br>
      Sesso: ${esc(u.gender || "-")}
    </div>

    <div class="reviewSection">
      <strong>Residenza</strong><br>
      Paese: ${esc(a.country || "-")}<br>
      Regione: ${esc(a.region || "-")}<br>
      Provincia: ${esc(a.province || "-")}<br>
      Comune: ${esc(a.municipality || "-")}<br>
      CAP: ${esc(a.zipCode || "-")}<br>
      Via/Piazza: ${esc(a.street || "-")}<br>
      Numero civico: ${esc(a.streetNumber || "-")}
    </div>

    <div class="reviewSection">
      <strong>Lavoro</strong><br>
      Azienda: ${esc(j.companyName || "-")}<br>
      Sede azienda: ${esc(j.companyAddress || "-")}<br>
      Tipo contratto: ${esc(j.contractType || "-")}<br>
      CCNL / Contratto applicato: ${esc(j.appliedContract || "-")}<br>
      Livello: ${esc(j.level || "-")}<br>
      Mansione: ${esc(j.role || "-")}<br>
      Data assunzione: ${esc(j.hireDate || "-")}<br>
      Full/Part time: ${esc(j.workType || "-")}<br>
      Ore settimanali: ${esc(j.weeklyHours || "-")}<br>
      Mensilità: ${esc(j.salaryMonths || "-")}
    </div>

    <div class="reviewSection">
      <strong>Retribuzione</strong><br>
      Paga oraria: ${esc(p.hourlyRate || "-")}<br>
      Netto mensile: ${esc(p.netMonthly || "-")}<br>
      Lordo mensile: ${esc(p.grossMonthly || "-")}
    </div>

    <div class="reviewSection">
      <strong>Maggiorazioni</strong><br>
      Festivo: ${r.holidayEnabled ? esc(r.holidayValue || "attivo") : "non attivo"}<br>
      Domenicale: ${r.sundayEnabled ? esc(r.sundayValue || "attivo") : "non attivo"}<br>
      Notturno: ${r.nightEnabled ? esc(r.nightValue || "attivo") : "non attivo"}
    </div>
  `;
}

function renderProfile() {
  const u = jobProfileState.userProfile;
  const j = jobProfileState.jobProfile;

  const jpName = document.getElementById("jpName");
  const jpBirth = document.getElementById("jpBirth");
  const jpLocation = document.getElementById("jpLocation");
  const jpCompany = document.getElementById("jpCompany");
  const jpRole = document.getElementById("jpRole");
  const jpLevel = document.getElementById("jpLevel");
  const jpHireDate = document.getElementById("jpHireDate");
  const jpSeniority = document.getElementById("jpSeniority");
  const avatar = document.getElementById("jobProfileAvatar");

  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();

  if (avatar) avatar.textContent = getAvatarSymbol();
  if (jpName) jpName.textContent = name || "Nome e cognome non configurati";
  if (jpBirth) jpBirth.textContent = formatBirthText();
  if (jpLocation) jpLocation.textContent = formatLocationText();

  if (jpCompany) {
    jpCompany.textContent = j.companyName
      ? `Azienda: ${j.companyName}`
      : "Azienda non configurata";
  }

  if (jpRole) {
    jpRole.textContent = j.role
      ? `Mansione: ${j.role}`
      : "Mansione non configurata";
  }

  if (jpLevel) {
    jpLevel.textContent = j.level
      ? `Livello: ${j.level}`
      : "Livello non configurato";
  }

  if (jpHireDate) {
    jpHireDate.textContent = j.hireDate
      ? `Data assunzione: ${j.hireDate}`
      : "Data assunzione non configurata";
  }

  if (jpSeniority) {
    const seniority = calcSeniority(j.hireDate);
    jpSeniority.textContent = seniority
      ? `Anzianità: ${seniority}`
      : "Anzianità non disponibile";
  }
}

function showEmptyState() {
  document.getElementById("jobProfileEmpty")?.classList.remove("hidden");
  document.getElementById("jobProfileView")?.classList.add("hidden");
}

function showProfileView() {
  document.getElementById("jobProfileEmpty")?.classList.add("hidden");
  document.getElementById("jobProfileView")?.classList.remove("hidden");
  renderProfile();
}

function mountJobProfileCard() {
  const mount = getMount();
  if (!mount) return;

  mount.innerHTML = buildProfileHTML();

  if (jobProfileState.profileMeta.setupCompleted) {
    showProfileView();
  } else {
    showEmptyState();
  }

  bindJobProfileButtons();
}

function toggleExpandedProfile() {
  const box = document.getElementById("jobProfileExpanded");
  const btn = document.getElementById("jobProfileExpandBtn");
  if (!box || !btn) return;

  const hidden = box.classList.contains("hidden");

  if (hidden) {
    box.innerHTML = buildExpandedProfileHTML();
    box.classList.remove("hidden");
    btn.textContent = "Nascondi dati";
  } else {
    box.classList.add("hidden");
    box.innerHTML = "";
    btn.textContent = "Visualizza dati";
  }
}

function bindJobProfileButtons() {
  document.getElementById("jobProfileSetupBtn")?.addEventListener("click", () => {
    startJobProfileWizard();
  });

  document.getElementById("jobProfileImportBtn")?.addEventListener("click", () => {
    alert("Importa contratto da fotocamera: prossimo step.");
  });

  document.getElementById("jobProfileImportNew")?.addEventListener("click", () => {
    alert("Importa nuovo contratto: prossimo step.");
  });

  document.getElementById("jobProfileAvatar")?.addEventListener("click", () => {
    startJobProfileWizard();
  });

  document.getElementById("jobProfileExpandBtn")?.addEventListener("click", () => {
    toggleExpandedProfile();
  });
}

/* =========================
   Wizard rendering
   ========================= */

function buildWizardFrame(innerHTML, title, subtitle = "") {
  return `
    <section id="jobProfileRoot" class="jobProfileCard">
      <div class="jobWizardCard">
        <div class="jobWizardTop">
          <div>
            <div class="jobWizardTitle">${title}</div>
            ${subtitle ? `<div class="jobWizardSub">${subtitle}</div>` : ""}
          </div>
          <div class="jobWizardBadge">Step ${jobProfileWizard.step}/${jobProfileWizard.total}</div>
        </div>

        <div class="jobWizardBody">
          ${innerHTML}
        </div>

        <div class="jobWizardNav">
          ${
            jobProfileWizard.step > 1
              ? `<button id="wizardBackBtn" class="jobWizardGhostBtn" type="button">Indietro</button>`
              : `<div></div>`
          }
          <button id="wizardCancelBtn" class="jobWizardGhostBtn" type="button">Chiudi</button>
        </div>
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

      <button id="wizardLegalNext" class="menuItemBtn" type="button" disabled>
        Continua
      </button>
    `,
    "Informazioni importanti",
    "Leggi tutto prima di proseguire"
  );
}

function renderWizardMode() {
  const currentMode = jobProfileState.profileMeta.setupMode || "";

  return buildWizardFrame(
    `
      <div class="jobWizardActions">
        <button id="wizardModeFast" class="menuItemBtn ${currentMode === "fast" ? "isSelectedWizardChoice" : ""}" type="button">
          Modalità rapida
        </button>

        <button id="wizardModeAdvanced" class="menuItemBtn ${currentMode === "advanced" ? "isSelectedWizardChoice" : ""}" type="button">
          Modalità avanzata
        </button>

        <button id="wizardModeCamera" class="menuItemBtn" type="button">
          Importa contratto da fotocamera
        </button>
      </div>

      <div class="jobWizardNote">
        La modalità rapida raccoglie i dati principali. La modalità avanzata consente di inserire più dettagli.
      </div>
    `,
    "Scegli modalità",
    "Puoi cambiarla in seguito"
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
          ${buildOptions(
            ["uomo", "donna", "non specificato", "altro"],
            u.gender,
            "Sesso"
          )}
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

      <button id="wizardPersonalNext" class="menuItemBtn" type="button">
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
  const ccnl = getCCNLListSafe();

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

      <button id="wizardJobNext" class="menuItemBtn" type="button">
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

      <div class="jobWizardNote">
        Se compili la paga oraria, netto e lordo si disattivano. Se compili netto o lordo, la paga oraria si disattiva.
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

      <button id="wizardSalaryNext" class="menuItemBtn" type="button">
        Continua
      </button>
    `,
    "Retribuzione",
    mode === "advanced"
      ? "Base economica e maggiorazioni"
      : "Base economica"
  );
}

function renderWizardReview() {
  const u = jobProfileState.userProfile;
  const a = jobProfileState.addressProfile;
  const j = jobProfileState.jobProfile;
  const p = jobProfileState.payProfile;
  const r = jobProfileState.payRules;

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
        ${esc(a.zipCode || "-")}<br>
        ${esc(a.street || "-")} ${esc(a.streetNumber || "")}
      </div>

      <div class="reviewSection">
        <strong>Lavoro</strong><br>
        ${esc(j.companyName || "-")}<br>
        ${esc(j.companyAddress || "-")}<br>
        ${esc(j.contractType || "-")}<br>
        ${esc(j.appliedContract || "-")}<br>
        ${esc(j.level || "-")}<br>
        ${esc(j.role || "-")}<br>
        ${esc(j.hireDate || "-")}<br>
        ${esc(j.workType || "-")}<br>
        ${esc(j.weeklyHours || "-")} ore<br>
        ${esc(j.salaryMonths || "-")} mensilità
      </div>

      <div class="reviewSection">
        <strong>Retribuzione</strong><br>
        Paga oraria: ${esc(p.hourlyRate || "-")}<br>
        Netto mensile: ${esc(p.netMonthly || "-")}<br>
        Lordo mensile: ${esc(p.grossMonthly || "-")}
      </div>

      <div class="reviewSection">
        <strong>Maggiorazioni</strong><br>
        Festivo: ${r.holidayEnabled ? esc(r.holidayValue || "attivo") : "non attivo"}<br>
        Domenicale: ${r.sundayEnabled ? esc(r.sundayValue || "attivo") : "non attivo"}<br>
        Notturno: ${r.nightEnabled ? esc(r.nightValue || "attivo") : "non attivo"}
      </div>

      <button id="wizardSaveBtn" class="menuItemBtn" type="button">
        Salva profilo
      </button>
    `,
    "Revisione dati",
    "Controlla tutto prima di salvare"
  );
}

function renderWizardStep() {
  switch (jobProfileWizard.step) {
    case 1:
      return renderWizardLegal();
    case 2:
      return renderWizardMode();
    case 3:
      return renderWizardPersonal();
    case 4:
      return renderWizardJob();
    case 5:
      return renderWizardSalary();
    case 6:
      return renderWizardReview();
    default:
      return renderWizardLegal();
  }
}

function rerenderWizard() {
  const mount = getMount();
  if (!mount) return;

  mount.innerHTML = renderWizardStep();
  bindWizardEvents();
}

function startJobProfileWizard() {
  resetWizard();
  rerenderWizard();
}

/* =========================
   Wizard logic
   ========================= */

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

  document.getElementById("wizardModeCamera")?.addEventListener("click", () => {
    alert("Importa contratto da fotocamera: prossimo step.");
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
  document.getElementById("wizardCancelBtn")?.addEventListener("click", () => {
    mountJobProfileCard();
  });

  document.getElementById("wizardBackBtn")?.addEventListener("click", () => {
    prevWizardStep();
  });

  switch (jobProfileWizard.step) {
    case 1:
      setupLegalStep();
      break;
    case 2:
      setupModeStep();
      break;
    case 3:
      setupPersonalStep();
      break;
    case 4:
      setupJobStep();
      break;
    case 5:
      setupSalaryStep();
      break;
    case 6:
      setupReviewStep();
      break;
  }
}

/* =========================
   Init
   ========================= */

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