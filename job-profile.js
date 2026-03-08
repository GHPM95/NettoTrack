/* =========================
   NettoTrack - Job Profile
   ========================= */

const jobProfileState = {
  userProfile: {
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "",
  },

  addressProfile: {
    country: "Italia",
    region: "",
    province: "",
    municipality: "",
    zipCode: "",
    street: "",
    streetNumber: "",
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
    salaryMonths: 13,
  },

  payProfile: {
    netMonthly: "",
    grossMonthly: "",
    hourlyRate: "",
    inputMode: "",
  },

  payRules: {
    holidayEnabled: false,
    holidayValue: "",
    sundayEnabled: false,
    sundayValue: "",
    nightEnabled: false,
    nightValue: "",
  },

  legalAcceptance: {
    faq: false,
    disclaimer: false,
    terms: false,
    scroll: false,
  },

  profileMeta: {
    setupCompleted: false,
    setupMode: "",
    lastUpdatedAt: null,
  },
};

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

function bindJobProfileButtons() {
  const setupBtn = document.getElementById("jobProfileSetupBtn");
  const importBtn = document.getElementById("jobProfileImportBtn");
  const importNewBtn = document.getElementById("jobProfileImportNew");
  const expandBtn = document.getElementById("jobProfileExpandBtn");
  const avatar = document.getElementById("jobProfileAvatar");

  setupBtn?.addEventListener("click", () => {
    alert("Wizard Profilo utente: prossimo step.");
  });

  importBtn?.addEventListener("click", () => {
    alert("Importa contratto da fotocamera: prossimo step.");
  });

  importNewBtn?.addEventListener("click", () => {
    alert("Importa nuovo contratto: prossimo step.");
  });

  expandBtn?.addEventListener("click", () => {
    alert("Espansione dati profilo: prossimo step.");
  });

  avatar?.addEventListener("click", () => {
    alert("Modifica profilo utente: prossimo step.");
  });
}

function renderProfile() {
  const u = jobProfileState.userProfile;
  const a = jobProfileState.addressProfile;
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
    jpRole.textContent = j.role ? `Mansione: ${j.role}` : "Mansione non configurata";
  }

  if (jpLevel) {
    jpLevel.textContent = j.level ? `Livello: ${j.level}` : "Livello non configurato";
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
  bindJobProfileButtons();

  if (jobProfileState.profileMeta.setupCompleted) {
    showProfileView();
  } else {
    showEmptyState();
  }
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
  const mount = document.getElementById("jobProfileMount");
  if (mount) initJobProfile();
});

window.NettoTrackJobProfile = {
  init: initJobProfile,
  save: saveJobProfile,
  state: jobProfileState,
};