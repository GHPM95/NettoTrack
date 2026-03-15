/* =========================
   NettoTrack Component Registry
   ========================= */

window.NTComponents = {

  /* =========================
     SECTION
     ========================= */

  section({ title="", body="" }={}){

    if(!title && !body) return "";

    return `
      <div class="ntSection">
        ${title ? `<div class="ntSectionTitle">${title}</div>` : ""}
        ${body ? `<div class="ntSectionBody">${body}</div>` : ""}
      </div>
    `;

  },

  /* =========================
     GRID 2
     ========================= */

  grid2({ left="", right="" }={}){

    if(!left && !right) return "";

    return `
      <div class="ntGrid-2">
        ${left || ""}
        ${right || ""}
      </div>
    `;

  },

  /* =========================
     INPUT
     ========================= */

  input({ placeholder="", value="" }={}){

    return `
      <div class="ntInputWrap">
        <input
          class="ntInput"
          type="text"
          placeholder="${placeholder}"
          value="${value}"
        />
      </div>
    `;

  },

  /* =========================
     TEXTAREA
     ========================= */

  textarea({ placeholder="", value="" }={}){

    return `
      <div class="ntTextareaWrap">
        <textarea
          class="ntTextarea"
          placeholder="${placeholder}"
        >${value}</textarea>
      </div>
    `;

  },

  /* =========================
     FIELD ACTION
     ========================= */

  fieldAction({ label="", value="" }={}){

    if(!label && !value) return "";

    return `
      <div class="ntFieldAction">
        <div class="ntFieldActionLabel">${label}</div>
        ${value ? `<div class="ntFieldActionValue">${value}</div>` : ""}
      </div>
    `;

  },

  /* =========================
     BUTTON
     ========================= */

  button({ label="", kind="primary", pressed=false }={}){

    if(!label) return "";

    return `
      <button class="ntBtn ntBtn-${kind} ${pressed ? "isSelected":""}">
        ${label}
      </button>
    `;

  },

  /* =========================
     CHECKBOX
     ========================= */

  checkbox({ title="", desc="" }={}){

    if(!title && !desc) return "";

    return `
      <label class="ntCheckRow">
        <input type="checkbox"/>
        <div class="ntCheckContent">
          ${title ? `<div class="ntCheckTitle">${title}</div>`:""}
          ${desc ? `<div class="ntCheckDesc">${desc}</div>`:""}
        </div>
      </label>
    `;

  },

  /* =========================
     RADIO
     ========================= */

  radio({ title="", desc="" }={}){

    if(!title && !desc) return "";

    return `
      <label class="ntRadioRow">
        <input type="radio"/>
        <div class="ntRadioContent">
          ${title ? `<div class="ntRadioTitle">${title}</div>`:""}
          ${desc ? `<div class="ntRadioDesc">${desc}</div>`:""}
        </div>
      </label>
    `;

  },

  /* =========================
     AVATAR
     ========================= */

  avatar({ variant="nothing", title="", hint="" }={}){

    if(!title && !hint) return "";

    return `
      <div class="ntAvatarBox">

        <div class="ntAvatarMedia ntAvatar-${variant}">
          <div class="ntAvatarIcon"></div>
        </div>

        <div class="ntAvatarContent">
          ${title ? `<div class="ntAvatarTitle">${title}</div>`:""}
          ${hint ? `<div class="ntAvatarHint">${hint}</div>`:""}
        </div>

      </div>
    `;

  },

  /* =========================
     EMPTY STATE
     ========================= */

  emptyState({ icon="", title="", text="" }={}){

    if(!title && !text) return "";

    return `
      <div class="ntEmptyState">

        ${icon ? `<div class="ntEmptyStateIcon">${icon}</div>`:""}
        ${title ? `<div class="ntEmptyStateTitle">${title}</div>`:""}
        ${text ? `<div class="ntEmptyStateText">${text}</div>`:""}

      </div>
    `;

  },

  /* =========================
     DIVIDER
     ========================= */

  divider(){

    return `<div class="ntDivider"></div>`;

  }

};