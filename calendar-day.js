/* =========================
   NettoTrack Calendar Day
   ========================= */

window.NTCalendarDay = (() => {
  function render(data = {}) {
    const date = normalizeDate(data.date);
    const today = utils.todayISO();

    const isToday = data.isToday ?? (date === today);
    const isSelected = !!data.isSelected;
    const isMuted = !!data.isMuted;
    const isDisabled = !!data.isDisabled;
    const isHoliday = !!data.isHoliday;

    const dayNumber = data.dayNumber || extractDayNumber(date);
    const dots = Array.isArray(data.dots) ? data.dots : [];

    return `
      <button
        type="button"
        class="ntCalendarDay
          ${isToday ? "isToday" : ""}
          ${isSelected ? "isSelected" : ""}
          ${isMuted ? "isMuted" : ""}
          ${isDisabled ? "isDisabled" : ""}
          ${isHoliday ? "isHoliday" : ""}"
        data-nt-calendar-day="${escapeHtml(date)}"
        aria-pressed="${isSelected ? "true" : "false"}"
        ${isDisabled ? "disabled" : ""}
      >
        <span class="ntCalendarDayNumber">${escapeHtml(dayNumber)}</span>
        <div class="ntCalendarDayDots">
          ${renderDots(dots)}
        </div>
      </button>
    `;
  }

  function renderDots(dots) {
    if (!dots.length) return `<div class="ntDots"></div>`;

    const items = dots.map((type) => {
      const cls =
        type === "holiday" ? "ntDotHoliday" :
        type === "overtime" ? "ntDotOvertime" :
        "ntDotBase";

      return `<span class="ntDot ${cls}"></span>`;
    }).join("");

    return `<div class="ntDots">${items}</div>`;
  }

  function bind(root = document, onSelect = null) {
    root.querySelectorAll("[data-nt-calendar-day]").forEach((el) => {
      el.addEventListener("click", () => {
        const date = el.dataset.ntCalendarDay || "";
        if (typeof onSelect === "function") {
          onSelect(date, el);
        }
      });
    });
  }

  function normalizeDate(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    return utils.toISO(d);
  }

  function extractDayNumber(iso) {
    if (!iso) return "";
    const part = String(iso).slice(8, 10);
    return String(Number(part));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const utils = {
    toISO(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },

    todayISO() {
      return this.toISO(new Date());
    }
  };

  return {
    render,
    bind,
    utils
  };
})();