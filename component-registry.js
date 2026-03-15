/* =========================
   NettoTrack Component Registry
   ========================= */

window.NTComponents = (() => {
  function section({ title = "", body = "", glass = false } = {}) {
    return `
      <section class="ntSection ${glass ? "ntSectionGlass" : ""}">
        ${title ? `<h3 class="ntSectionTitle">${escapeHtml(title)}</h3>` : ""}
        ${body ? `<div class="ntSectionText">${body}</div>` : ""}
      </section>
    `;
  }

  function input({
    label = "",
    placeholder = "",
    value = "",
    type = "text",
    name = "",
    disabled = false
  } = {}) {
    return `
      <div class="ntField">
        ${label ? `<label class="ntLabel">${escapeHtml(label)}</label>` : ""}
        <div class="ntInputWrap">
          <input
            class="ntInput"
            type="${escapeAttr(type)}"
            ${name ? `name="${escapeAttr(name)}"` : ""}
            ${placeholder ? `placeholder="${escapeAttr(placeholder)}"` : ""}
            value="${escapeAttr(value)}"
            ${disabled ? "disabled" : ""}
          />
        </div>
      </div>
    `;
  }

  function textarea({
    label = "",
    placeholder = "",
    value = "",
    name = "",
    disabled = false
  } = {}) {
    return `
      <div class="ntField">
        ${label ? `<label class="ntLabel">${escapeHtml(label)}</label>` : ""}
        <div class="ntTextareaWrap">
          <textarea
            class="ntTextarea"
            ${name ? `name="${escapeAttr(name)}"` : ""}
            ${placeholder ? `placeholder="${escapeAttr(placeholder)}"` : ""}
            ${disabled ? "disabled" : ""}
          >${escapeHtml(value)}</textarea>
        </div>
      </div>
    `;
  }

  function select({
    label = "",
    name = "",
    value = "",
    options = [],
    disabled = false
  } = {}) {
    const safeOptions = Array.isArray(options) ? options : [];

    return `
      <div class="ntField">
        ${label ? `<label class="ntLabel">${escapeHtml(label)}</label>` : ""}
        <div class="ntSelectWrap">
          <select
            class="ntSelect"
            ${name ? `name="${escapeAttr(name)}"` : ""}
            ${disabled ? "disabled" : ""}
          >
            ${safeOptions.map((opt) => {
              const item = normalizeOption(opt);
              return `
                <option
                  value="${escapeAttr(item.value)}"
                  ${String(item.value) === String(value) ? "selected" : ""}
                >
                  ${escapeHtml(item.label)}
                </option>
              `;
            }).join("")}
          </select>
        </div>
      </div>
    `;
  }

  function button({
    label = "Button",
    kind = "secondary",
    pressed = false,
    full = true,
    disabled = false
  } = {}) {
    const classes = [
      kind === "primary" ? "ntBtn ntBtnPrimary" : "ntBtn ntBtnSecondary",
      "ntPress"
    ];

    if (pressed) classes.push("isSelected");
    if (!full) classes.push("isAuto");

    return `
      <button
        type="button"
        class="${classes.join(" ")}"
        ${pressed ? 'aria-pressed="true"' : 'aria-pressed="false"'}
        ${disabled ? "disabled" : ""}
      >
        ${escapeHtml(label)}
      </button>
    `;
  }

  function checkbox({
    title = "",
    desc = "",
    checked = false,
    disabled = false
  } = {}) {
    return `
      <label class="ntCheckRow">
        <input
          class="ntCheckInput"
          type="checkbox"
          ${checked ? "checked" : ""}
          ${disabled ? "disabled" : ""}
          hidden
        />
        <span class="ntCheckUi" aria-hidden="true"></span>

        <span class="ntCheckContent">
          ${title ? `<span class="ntCheckTitle">${escapeHtml(title)}</span>` : ""}
          ${desc ? `<span class="ntCheckDesc">${escapeHtml(desc)}</span>` : ""}
        </span>
      </label>
    `;
  }

  function radio({
    title = "",
    desc = "",
    checked = false,
    disabled = false,
    name = "ntRadio"
  } = {}) {
    return `
      <label class="ntRadioRow">
        <input
          class="ntRadioInput"
          type="radio"
          name="${escapeAttr(name)}"
          ${checked ? "checked" : ""}
          ${disabled ? "disabled" : ""}
          hidden
        />
        <span class="ntRadioUi" aria-hidden="true"></span>

        <span class="ntRadioContent">
          ${title ? `<span class="ntRadioTitle">${escapeHtml(title)}</span>` : ""}
          ${desc ? `<span class="ntRadioDesc">${escapeHtml(desc)}</span>` : ""}
        </span>
      </label>
    `;
  }

  function grid2({ left = "", right = "" } = {}) {
    return `
      <div class="ntGrid-2 ntFormRow">
        <div class="ntFormCol">${left}</div>
        <div class="ntFormCol">${right}</div>
      </div>
    `;
  }

  function fieldAction({
    label = "",
    value = "",
    icon = "›"
  } = {}) {
    return `
      <button type="button" class="ntFieldAction ntPress">
        <span class="ntFieldActionLabel">${escapeHtml(label)}</span>
        <span class="ntFieldActionValue">
          ${value ? escapeHtml(value) : escapeHtml(icon)}
        </span>
      </button>
    `;
  }

  function emptyState({
    icon = "○",
    title = "",
    text = ""
  } = {}) {
    return `
      <div class="ntEmptyState">
        <div class="ntEmptyStateIcon">${escapeHtml(icon)}</div>
        ${title ? `<div class="ntEmptyStateTitle">${escapeHtml(title)}</div>` : ""}
        ${text ? `<div class="ntEmptyStateText">${escapeHtml(text)}</div>` : ""}
      </div>
    `;
  }

  function avatar({
    variant = "nothing",
    title = "",
    hint = ""
  } = {}) {
    const icon = variant === "user" ? "👤" : "◌";

    return `
      <div class="ntAvatarBox">
        <div class="ntAvatarMedia" aria-hidden="true">${icon}</div>
        <div class="ntAvatarContent">
          ${title ? `<div class="ntAvatarTitle">${escapeHtml(title)}</div>` : ""}
          ${hint ? `<div class="ntAvatarHint">${escapeHtml(hint)}</div>` : ""}
        </div>
      </div>
    `;
  }

  function divider() {
    return `<hr class="ntDivider" />`;
  }

  function stack(items = [], gap = 12) {
    const cls = gap === 10
      ? "ntStack-10"
      : gap === 16
        ? "ntStack-16"
        : gap === 18
          ? "ntStack-18"
          : "ntStack-12";

    return `<div class="${cls}">${items.join("")}</div>`;
  }

  function cluster(items = [], gap = 10) {
    const cls = gap === 8
      ? "ntCluster-8"
      : gap === 12
        ? "ntCluster-12"
        : "ntCluster-10";

    return `<div class="${cls}">${items.join("")}</div>`;
  }

  function formActions({ left = "", right = "" } = {}) {
    return `
      <div class="ntFormActions">
        <div class="ntFormCol">${left}</div>
        <div class="ntFormCol">${right}</div>
      </div>
    `;
  }

  function normalizeOption(opt) {
    if (typeof opt === "string" || typeof opt === "number") {
      return { value: String(opt), label: String(opt) };
    }

    return {
      value: String(opt?.value ?? ""),
      label: String(opt?.label ?? opt?.value ?? "")
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  return {
    section,
    input,
    textarea,
    select,
    button,
    checkbox,
    radio,
    grid2,
    fieldAction,
    emptyState,
    avatar,
    divider,
    stack,
    cluster,
    formActions
  };
})();