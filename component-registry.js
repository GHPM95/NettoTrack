/* =========================
   NettoTrack Component Registry
   ========================= */

window.NTComponents = (() => {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function attrs(obj = {}) {
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && v !== false && v !== "")
      .map(([k, v]) => {
        if (v === true) return `${k}`;
        return `${k}="${escapeHtml(v)}"`;
      })
      .join(" ");
  }

  function dataAttrs(data = {}) {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [`data-${k}`, v])
    );
  }

  function capitalize(value = "") {
    const v = String(value);
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  function defaultAvatarIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>
      </svg>
    `;
  }

  function input({
    type = "text",
    value = "",
    placeholder = "",
    name = "",
    id = "",
    disabled = false,
    extraClass = "",
    data = {}
  } = {}) {
    return `
      <input
        class="ntFieldInput ${escapeHtml(extraClass)}"
        type="${escapeHtml(type)}"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(placeholder)}"
        ${attrs({
          name,
          id,
          disabled,
          ...dataAttrs(data)
        })}
      >
    `;
  }

  function textarea({
    value = "",
    placeholder = "",
    name = "",
    id = "",
    disabled = false,
    extraClass = "",
    rows = 4,
    data = {}
  } = {}) {
    return `
      <textarea
        class="ntTextarea ${escapeHtml(extraClass)}"
        placeholder="${escapeHtml(placeholder)}"
        rows="${escapeHtml(rows)}"
        ${attrs({
          name,
          id,
          disabled,
          ...dataAttrs(data)
        })}
      >${escapeHtml(value)}</textarea>
    `;
  }

  function button({
    label = "",
    kind = "primary",
    pressed = null,
    disabled = false,
    extraClass = "",
    type = "button",
    data = {}
  } = {}) {
    const classMap = {
      primary: "ntBtnPrimary",
      secondary: "ntBtnSecondary",
      ghost: "ntBtnGhost",
      toggle: "ntToggleBtn"
    };

    const baseClass = classMap[kind] || "ntBtnPrimary";
    const toggleState =
      kind === "toggle"
        ? (pressed ? " isOn" : " isOff")
        : "";

    const ariaPressed =
      kind === "toggle" && pressed !== null
        ? { "aria-pressed": pressed ? "true" : "false" }
        : {};

    return `
      <button
        type="${escapeHtml(type)}"
        class="${baseClass}${toggleState} ntPress ${escapeHtml(extraClass)}"
        ${attrs({
          disabled,
          ...ariaPressed,
          ...dataAttrs(data)
        })}
      >${escapeHtml(label)}</button>
    `;
  }

  function iconButton({
    label = "",
    disabled = false,
    hidden = false,
    extraClass = "",
    type = "button",
    data = {}
  } = {}) {
    return `
      <button
        type="${escapeHtml(type)}"
        class="ntIconBtn ntPress ${hidden ? "isHidden" : ""} ${escapeHtml(extraClass)}"
        ${attrs({
          disabled,
          ...dataAttrs(data)
        })}
      >${escapeHtml(label)}</button>
    `;
  }

  function divider({ extraClass = "" } = {}) {
    return `<div class="ntDivider ${escapeHtml(extraClass)}"></div>`;
  }

  function checkbox({
    title = "",
    desc = "",
    checked = false,
    disabled = false,
    name = "",
    value = "",
    id = "",
    extraClass = "",
    data = {}
  } = {}) {
    return `
      <label class="ntCheckRow ${escapeHtml(extraClass)}">
        <span class="ntCheckWrap">
          <input
            type="checkbox"
            class="ntCheckInput"
            ${attrs({
              checked,
              disabled,
              name,
              value,
              id,
              ...dataAttrs(data)
            })}
          >
          <span class="ntCheckUi"></span>
        </span>

        <span class="ntCheckLabel">
          <span class="ntCheckTitle">${escapeHtml(title)}</span>
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
    name = "",
    value = "",
    id = "",
    extraClass = "",
    data = {}
  } = {}) {
    return `
      <label class="ntRadioRow ${escapeHtml(extraClass)}">
        <span class="ntRadioWrap">
          <input
            type="radio"
            class="ntRadioInput"
            ${attrs({
              checked,
              disabled,
              name,
              value,
              id,
              ...dataAttrs(data)
            })}
          >
          <span class="ntRadioUi"></span>
        </span>

        <span class="ntRadioLabel">
          <span class="ntRadioTitle">${escapeHtml(title)}</span>
          ${desc ? `<span class="ntRadioDesc">${escapeHtml(desc)}</span>` : ""}
        </span>
      </label>
    `;
  }

  function avatar({
    variant = "nothing",
    title = "",
    hint = "",
    extraClass = "",
    icon = defaultAvatarIcon()
  } = {}) {
    const variantClass = {
      male: "ntAvatarMale",
      female: "ntAvatarFemale",
      neutral: "ntAvatarNeutral",
      nothing: "ntAvatarNothing"
    }[variant] || "ntAvatarNothing";

    return `
      <div class="ntAvatarField ${escapeHtml(extraClass)}">
        <div class="ntAvatarBox">
          <div class="ntAvatar ${variantClass}">
            ${icon}
          </div>
        </div>

        ${(title || hint) ? `
          <div class="ntAvatarMeta">
            ${title ? `<div class="ntAvatarTitle">${escapeHtml(title)}</div>` : ""}
            ${hint ? `<div class="ntAvatarHint">${escapeHtml(hint)}</div>` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }

  function dots({
    items = [],
    extraClass = ""
  } = {}) {
    const map = {
      base: "ntDotBase",
      holiday: "ntDotHoliday",
      overtime: "ntDotOvertime"
    };

    return `
      <div class="ntDots ${escapeHtml(extraClass)}">
        ${items.map((item) => `<span class="ntDot ${map[item] || "ntDotBase"}"></span>`).join("")}
      </div>
    `;
  }

  function fieldAction({
    label = "",
    expanded = false,
    disabled = false,
    extraClass = "",
    data = {}
  } = {}) {
    return `
      <button
        type="button"
        class="ntFieldAction ${escapeHtml(extraClass)}"
        ${attrs({
          "aria-expanded": expanded ? "true" : "false",
          disabled,
          ...dataAttrs(data)
        })}
      >
        <span>${escapeHtml(label)}</span>
        <span class="ntFieldChevron"></span>
      </button>
    `;
  }

  function emptyState({
    icon = "○",
    title = "",
    text = "",
    extraClass = ""
  } = {}) {
    return `
      <div class="ntEmptyState ${escapeHtml(extraClass)}">
        <div class="ntEmptyStateIcon" aria-hidden="true">${escapeHtml(icon)}</div>
        <div class="ntEmptyStateTitle">${escapeHtml(title)}</div>
        <div class="ntEmptyStateText">${escapeHtml(text)}</div>
      </div>
    `;
  }

  function skeletonLines({
    lines = ["long", "medium", "short"],
    extraClass = ""
  } = {}) {
    return `
      <div class="${escapeHtml(extraClass)}">
        ${lines.map((size) => `<div class="ntSkeleton ntSkeletonLine is${capitalize(size)}"></div>`).join("")}
      </div>
    `;
  }

  function section({
    title = "",
    body = "",
    glass = false,
    extraClass = ""
  } = {}) {
    return `
      <section class="ntSection ${glass ? "ntSectionGlass" : ""} ${escapeHtml(extraClass)}">
        ${title ? `<div class="ntSectionTitle">${escapeHtml(title)}</div>` : ""}
        ${body}
      </section>
    `;
  }

  function grid2({
    left = "",
    right = "",
    extraClass = ""
  } = {}) {
    return `
      <div class="ntGrid-2 ${escapeHtml(extraClass)}">
        <div>${left}</div>
        <div>${right}</div>
      </div>
    `;
  }

  return {
    input,
    textarea,
    button,
    iconButton,
    divider,
    checkbox,
    radio,
    avatar,
    dots,
    fieldAction,
    emptyState,
    skeletonLines,
    section,
    grid2
  };
})();