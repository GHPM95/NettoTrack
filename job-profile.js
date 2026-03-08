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
    weeklyHours: null,
    salaryMonths: 13
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
    accepted: false
  },

  profileMeta: {
    setupCompleted: false,
    setupMode: "",
    lastUpdatedAt: null
  }
};

/* =========================
   Wizard State
   ========================= */

const jobProfileWizard = {
  step: 1,
  mode: ""
};

/* =========================
   Storage
   ========================= */

function loadJobProfileState() {
  const saved = localStorage.getItem("nt_jobProfile");
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    Object.assign(jobProfileState, parsed);
  } catch (err) {
    console.warn("NettoTrack job profile load error:", err);
  }
}

function saveJobProfile() {
  jobProfileState.profileMeta.lastUpdatedAt = new Date().toISOString();
  localStorage.setItem("nt_jobProfile", JSON.stringify(jobProfileState));
}

/* =========================
   Helpers
   ========================= */

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

  if (rem > 0) return `${years} anni, ${rem} mesi`;
  return `${years} anni`;
}

function formatBirthText() {
  const u = jobProfileState.userProfile;
  if (!u.birthDate && !u.gender) return "Data di nascita e sesso non configurati";

  const parts = [];
  if (u.birthDate) parts.push(u.birthDate);
  if (u.gender) parts.push(u.gender);

  return parts.join(" • ");
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
  return "🙂";
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRoot() {
  return document.getElementById("jobProfileRoot");
}

function resetWizard() {
  jobProfileWizard.step = 1;
  jobProfileWizard.mode = "";
}

/* =========================
   View HTML
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
            Configura il tuo profilo per permettere a NettoTrack di analizzare il tuo
            lavoro e preparare le stime future.
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

/* =========================
   Wizard HTML
   ========================= */

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

function buildWizardFrame(innerHTML, title, subtitle = "") {
  return `
    <div class="jobWizardCard">
      <div class="jobWizardTop">
        <div>
          <div class="jobWizardTitle">${title}</div>
          ${subtitle ? `<div class="jobWizardSub">${subtitle}</div>` : ""}
        </div>
        <div class="jobWizardBadge">Step ${jobProfileWizard.step}/6</div>
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
  `;
}

function renderWizardLegal() {
  return buildWizardFrame(
    `
      <div class="jobWizardTextBlock">
        <p>
          NettoTrack utilizza i dati inseriti per creare stime e simulazioni.
        </p>
        <p>
          I risultati potrebbero non coincidere con la busta paga reale e non sostituiscono
          consulenza fiscale, contabile o del lavoro.
        </p>
        <p>
          Prima di proseguire conferma di aver letto queste informazioni.
        </p>
      </div>

      <label class="jobWizardCheck">
        <input id="wizardLegalAccept" type="checkbox">
        <span>Ho letto e accetto</span>
      </label>

      <button id="wizardLegalNext" class="menuItemBtn" type="button" disabled>
        Continua
      </button>
    `,
    "Informazioni importanti",
    "Prima di configurare il profilo"
  );
}

function renderWizardMode() {
  return buildWizardFrame(
    `
      <div class="jobWizardActions">
        <button id="wizardModeFast" class="menuItemBtn" type="button">
          Modalità rapida
        </button>

        <button id="wizardModeAdvanced" class="menuItemBtn" type="button">
          Modalità avanzata
        </button>
      </div>

      <div class="jobWizardNote">
        La modalità rapida raccoglie i dati essenziali. La modalità avanzata è pronta
        per essere estesa con più dettagli.
      </div>
    `,
    "Scegli modalità",
    "Puoi modificarla anche in seguito"
  );
}

function renderWizardPersonal() {
  const u = jobProfileState.userProfile;

  return buildWizardFrame(
    `
      <div class="jobWizardFields">
        <input id="wizardFirstName" class="jobWizardInput" placeholder="Nome" value="${esc(u.firstName)}">
        <input id="wizardLastName" class="jobWizardInput" placeholder="Cognome" value="${esc(u.lastName)}">
        <input id="wizardBirthDate" class="jobWizardInput" type="date" value="${esc(u.birthDate)}">

        <select id="wizardGender" class="jobWizardInput">
          <option value="">Sesso</option>
          <option value="uomo" ${u.gender === "uomo" ? "selected" : ""}>Uomo</option>
          <option value="donna" ${u.gender === "donna" ? "selected" : ""}>Donna</option>
          <option value="non specificato" ${u.gender === "non specificato" ? "selected" : ""}>Non specificato</option>
          <option value="altro" ${u.gender === "altro" ? "selected" : ""}>Altro</option>
        </select>
      </div>

      <button id="wizardPersonalNext" class="menuItemBtn" type="button">
        Continua
      </button>
    `,
    "Dati personali",
    "Compila le informazioni base"
  );
}

function renderWizardJob() {
  const j = jobProfileState.jobProfile;

  return buildWizardFrame(
    `
      <div class="jobWizardFields">
        <input id="wizardCompanyName" class="jobWizardInput" placeholder="Azienda" value="${esc(j.companyName)}">
        <input id="wizardRole" class="jobWizardInput" placeholder="Mansione" value="${esc(j.role)}">
        <input id="wizardLevel" class="jobWizardInput" placeholder="Livello" value="${esc(j.level)}">
        <input id="wizardHireDate" class="jobWizardInput" type="date" value="${esc(j.hireDate)}">
      </div>

      <button id="wizardJobNext" class="menuItemBtn" type="button">
        Continua
      </button>
    `,
    "Dati lavoro",
    "Inserisci i dati principali del rapporto di lavoro"
  );
}

function renderWizardSalary() {
  const p = jobProfileState.payProfile;

  return buildWizardFrame(
    `
      <div class="jobWizardFields">
        <input id="wizardHourlyRate" class="jobWizardInput" inputmode="decimal" placeholder="Paga oraria" value="${esc(p.hourlyRate)}">
        <input id="wizardNetMonthly" class="jobWizardInput" inputmode="decimal" placeholder="Netto mensile" value="${esc(p.netMonthly)}">
        <input id="wizardGrossMonthly" class="jobWizardInput" inputmode="decimal" placeholder="Lordo mensile" value="${esc(p.grossMonthly)}">
      </div>

      <div class="jobWizardNote">
        Se compili la paga oraria, gli altri due campi restano disattivati.
        Se compili netto o lordo mensile, la paga oraria si disattiva.
      </div>

      <button id="wizardSalaryNext" class="menuItemBtn" type="button">
        Continua
      </button>
    `,
    "Retribuzione",
    "Inserisci la base economica"
  );
}

function renderWizardReview() {
  const u = jobProfileState.userProfile;
  const j = jobProfileState.jobProfile;
  const p = jobProfileState.payProfile;

  return buildWizardFrame(
    `
      <div class="reviewSection">
        <strong>Dati personali</strong><br>
        ${esc(`${u.firstName} ${u.lastName}`.trim() || "Non configurati")}<br>
        ${esc(u.birthDate || "Data nascita non configurata")}<br>
        ${esc(u.gender || "Sesso non configurato")}
      </div>

      <div class="reviewSection">
        <strong>Dati lavoro</strong><br>
        ${esc(j.companyName || "Azienda non configurata")}<br>
        ${esc(j.role || "Mansione non configurata")}<br>
        ${esc(j.level || "Livello non configurato")}<br>
        ${esc(j.hireDate || "Data assunzione non configurata")}
      </div>

      <div class="reviewSection">
        <strong>Retribuzione</strong><br>
        Paga oraria: ${esc(p.hourlyRate || "-")}<br>
        Netto mensile: ${esc(p.netMonthly || "-")}<br>
        Lordo mensile: ${esc(p.grossMonthly || "-")}
      </div>

      <button id="wizardSaveBtn" class="menuItemBtn" type="button">
        Salva profilo
      </button>
    `,
    "Revisione dati",
    "Controlla prima di salvare"
  );
}

/* =========================
   Expanded View
   ========================= */

function buildExpandedProfileHTML() {
  const u = jobProfileState.userProfile;
  const a = jobProfileState.addressProfile;
  const j = jobProfileState.jobProfile;
  const p = jobProfileState.payProfile;

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
      Comune: ${esc(a.municipality || "-")}<br>
      CAP: ${esc(a.zipCode || "-")}
    </div>

    <div class="reviewSection">
      <strong>Lavoro</strong><br>
      Azienda: ${esc(j.companyName || "-")}<br>
      Mansione: ${esc(j.role || "-")}<br>
      Livello: ${esc(j.level || "-")}<br>
      Data assunzione: ${esc(j.hireDate || "-")}
    </div>

    <div class="reviewSection">
      <strong>Retribuzione</strong><br>
      Paga oraria: ${esc(p.hourlyRate || "-")}<br>
      Netto mensile: ${esc(p.netMonthly || "-")}<br>
      Lordo mensile: ${esc(p.grossMonthly || "-")}
    </div>
  `;
}

/* =========================
   Mount + Render
   ========================= */

function renderProfile() {
  const u = jobProfileState.userProfile;
  const j = jobProfileState.jobProfile;

  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();

  const jpName = document.getElementById("jpName");
  const jpBirth = document.getElementById("jpBirth");
  const jpLocation = document.getElementById("jpLocation");
  const jpCompany = document.getElementById("jpCompany");
  const jpRole = document.getElementById("jpRole");
  const jpLevel = document.getElementById("jpLevel");
  const jpHireDate = document.getElementById("jpHireDate");
  const jpSeniority = document.getElementById("jpSeniority");
  const avatar = document.getElementById("jobProfileAvatar");

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
  const mount = document.getElementById("jobProfileMount");
  if (!mount) return;

  mount.innerHTML = buildProfileHTML();

  if (jobProfileState.profileMeta.setupCompleted) {
    showProfileView();
  } else {
    showEmptyState();
  }
}

function rerenderWizard() {
  const root = getRoot();
  if (!root) return;
  root.innerHTML = renderWizardStep();
  bindWizardEvents();
}

function startJobProfileWizard() {
  resetWizard();
  rerenderWizard();
}

function exitWizardToCard() {
  mountJobProfileCard();
  bindJobProfileButtons();
}

/* =========================
   Bind Main Card
   ========================= */

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
    const box = document.getElementById("jobProfileExpanded");
    if (!box) return;

    const isHidden = box.classList.contains("hidden");

    if (isHidden) {
      box.innerHTML = buildExpandedProfileHTML();
      box.classList.remove("hidden");
      document.getElementById("jobProfileExpandBtn").textContent = "Nascondi dati";
    } else {
      box.classList.add("hidden");
      box.innerHTML = "";
      document.getElementById("jobProfileExpandBtn").textContent = "Visualizza dati";
    }
  });
}

/* =========================
   Bind Wizard
   ========================= */

function bindWizardEvents() {
  document.getElementById("wizardCancelBtn")?.addEventListener("click", () => {
    exitWizardToCard();
  });

  document.getElementById("wizardBackBtn")?.addEventListener("click", () => {
    jobProfileWizard.step = Math.max(1, jobProfileWizard.step - 1);
    rerenderWizard();
  });

  const legalCheck = document.getElementById("wizardLegalAccept");
  const legalNext = document.getElementById("wizardLegalNext");

  if (legalCheck && legalNext) {
    legalCheck.addEventListener("change", () => {
      legalNext.disabled = !legalCheck.checked;
    });

    legalNext.addEventListener("click", () => {
      jobProfileState.legalAcceptance.accepted = legalCheck.checked;
      jobProfileWizard.step = 2;
      rerenderWizard();
    });
  }

  document.getElementById("wizardModeFast")?.addEventListener("click", () => {
    jobProfileWizard.mode = "fast";
    jobProfileState.profileMeta.setupMode = "fast";
    jobProfileWizard.step = 3;
    rerenderWizard();
  });

  document.getElementById("wizardModeAdvanced")?.addEventListener("click", () => {
    jobProfileWizard.mode = "advanced";
    jobProfileState.profileMeta.setupMode = "advanced";
    jobProfileWizard.step = 3;
    rerenderWizard();
  });

  document.getElementById("wizardPersonalNext")?.addEventListener("click", () => {
    jobProfileState.userProfile.firstName = document.getElementById("wizardFirstName")?.value.trim() || "";
    jobProfileState.userProfile.lastName = document.getElementById("wizardLastName")?.value.trim() || "";
    jobProfileState.userProfile.birthDate = document.getElementById("wizardBirthDate")?.value || "";
    jobProfileState.userProfile.gender = document.getElementById("wizardGender")?.value || "";

    saveJobProfile();
    jobProfileWizard.step = 4;
    rerenderWizard();
  });

  document.getElementById("wizardJobNext")?.addEventListener("click", () => {
    jobProfileState.jobProfile.companyName = document.getElementById("wizardCompanyName")?.value.trim() || "";
    jobProfileState.jobProfile.role = document.getElementById("wizardRole")?.value.trim() || "";
    jobProfileState.jobProfile.level = document.getElementById("wizardLevel")?.value.trim() || "";
    jobProfileState.jobProfile.hireDate = document.getElementById("wizardHireDate")?.value || "";

    saveJobProfile();
    jobProfileWizard.step = 5;
    rerenderWizard();
  });

  const hourlyInput = document.getElementById("wizardHourlyRate");
  const netInput = document.getElementById("wizardNetMonthly");
  const grossInput = document.getElementById("wizardGrossMonthly");

  function syncSalaryInputs() {
    if (!hourlyInput || !netInput || !grossInput) return;

    const hourlyHasValue = hourlyInput.value.trim() !== "";
    const monthlyHasValue = netInput.value.trim() !== "" || grossInput.value.trim() !== "";

    if (hourlyHasValue) {
      netInput.disabled = true;
      grossInput.disabled = true;
    } else {
      netInput.disabled = false;
      grossInput.disabled = false;
    }

    if (monthlyHasValue) {
      hourlyInput.disabled = true;
    } else {
      hourlyInput.disabled = false;
    }

    if (!hourlyHasValue && !monthlyHasValue) {
      hourlyInput.disabled = false;
      netInput.disabled = false;
      grossInput.disabled = false;
    }
  }

  if (hourlyInput && netInput && grossInput) {
    hourlyInput.addEventListener("input", syncSalaryInputs);
    netInput.addEventListener("input", syncSalaryInputs);
    grossInput.addEventListener("input", syncSalaryInputs);
    syncSalaryInputs();
  }

  document.getElementById("wizardSalaryNext")?.addEventListener("click", () => {
    jobProfileState.payProfile.hourlyRate = hourlyInput?.value.trim() || "";
    jobProfileState.payProfile.netMonthly = netInput?.value.trim() || "";
    jobProfileState.payProfile.grossMonthly = grossInput?.value.trim() || "";

    if (jobProfileState.payProfile.hourlyRate) {
      jobProfileState.payProfile.inputMode = "hourly";
    } else if (
      jobProfileState.payProfile.netMonthly ||
      jobProfileState.payProfile.grossMonthly
    ) {
      jobProfileState.payProfile.inputMode = "monthly";
    } else {
      jobProfileState.payProfile.inputMode = "";
    }

    saveJobProfile();
    jobProfileWizard.step = 6;
    rerenderWizard();
  });

  document.getElementById("wizardSaveBtn")?.addEventListener("click", () => {
    jobProfileState.profileMeta.setupCompleted = true;
    saveJobProfile();
    exitWizardToCard();
  });
}

/* =========================
   Init
   ========================= */

function initJobProfile() {
  loadJobProfileState();
  mountJobProfileCard();
  bindJobProfileButtons();
}

document.addEventListener("nettotrack:jobProfileOpened", () => {
  requestAnimationFrame(() => {
    initJobProfile();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const mount = document.getElementById("jobProfileMount");
  if (mount) initJobProfile();
});

window.NettoTrackJobProfile = {
  init: initJobProfile,
  save: saveJobProfile,
  state: jobProfileState
};