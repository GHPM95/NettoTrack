/* =========================
   NettoTrack Calendar Days Strip
   ========================= */

window.NTCalendarDaysStrip = (() => {
  const DAY_NAMES_IT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  function createStore({
    mount,
    onSelect = null,
    days = [],
    selectedDate = null
  } = {}) {
    if (!mount) {
      throw new Error("NTCalendarDaysStrip: mount richiesto");
    }

    const state = {
      mount,
      onSelect,
      days: Array.isArray(days) ? [...days] : [],
      selectedDate: selectedDate || null
    };

    function setDays(newDays = []) {
      state.days = Array.isArray(newDays) ? [...newDays] : [];
      render();
    }

    function setSelectedDate(value) {
      state.selectedDate = value || null;
      render();
      centerSelected();
    }

    function selectDate(value) {
      state.selectedDate = value;
      render();
      centerSelected();

      if (typeof state.onSelect === "function") {
        state.onSelect(value, getDayByDate(value));
      }
    }

    function getDayByDate(value) {
      return state.days.find((d) => d.date === value) || null;
    }

    function render() {
      const html = `
        <div class="ntDaysStrip">
          <div class="ntDaysStripScroll">
            <div class="ntDaysStripTrack">
              ${state.days.map(renderDayChip).join("")}
            </div>
          </div>
        </div>
      `;

      state.mount.innerHTML = html;
      bind();
    }

    function bind() {
      state.mount.querySelectorAll("[data-nt-day-date]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const value = btn.dataset.ntDayDate;
          if (!value) return;
          selectDate(value);
        });
      });
    }

    function centerSelected() {
      const scroll = state.mount.querySelector(".ntDaysStripScroll");
      const selected = state.mount.querySelector(".ntDayChip.isSelected");
      const track = state.mount.querySelector(".ntDaysStripTrack");

      if (!scroll || !selected) return;

      const target =
        selected.offsetLeft -
        (scroll.clientWidth / 2) +
        (selected.clientWidth / 2);

      scroll.scrollTo({
        left: Math.max(0, target),
        behavior: "smooth"
      });

      if (track) {
        track.classList.remove("isRefocus");
        void track.offsetWidth;
        track.classList.add("isRefocus");
      }
    }

    function renderDayChip(day) {
      const date = normalizeDate(day.date);
      const d = new Date(`${date}T12:00:00`);
      const weekday = day.weekdayLabel || DAY_NAMES_IT[d.getDay()];
      const number = day.dayNumber || String(d.getDate());
      const isSelected = state.selectedDate === date;
      const isToday = !!day.isToday;
      const hasData = !!day.hasData;
      const isDisabled = !!day.isDisabled;

      return `
        <button
          type="button"
          class="ntDayChip
            ${isSelected ? "isSelected" : ""}
            ${isToday ? "isToday" : ""}
            ${hasData ? "hasData" : ""}
            ${isDisabled ? "isDisabled" : ""}"
          data-nt-day-date="${date}"
          aria-pressed="${isSelected ? "true" : "false"}"
          ${isDisabled ? "disabled" : ""}
        >
          <span class="ntDayChipWeekday">${escapeHtml(weekday)}</span>
          <span class="ntDayChipDate">${escapeHtml(number)}</span>
        </button>
      `;
    }

    render();
    queueMicrotask(centerSelected);

    return {
      setDays,
      setSelectedDate,
      selectDate,
      getState: () => ({ ...state })
    };
  }

  function build7DaysFromDate(baseDate = new Date(), options = {}) {
    const {
      selectedDate = null,
      hasDataMap = {},
      disabledDates = []
    } = options;

    const base = new Date(baseDate);
    const out = [];

    for (let i = 0; i < 7; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      const iso = formatDateISO(d);
      const today = formatDateISO(new Date());

      out.push({
        date: iso,
        weekdayLabel: DAY_NAMES_IT[d.getDay()],
        dayNumber: String(d.getDate()),
        isToday: iso === today,
        hasData: !!hasDataMap[iso],
        isDisabled: disabledDates.includes(iso),
        isSelected: selectedDate === iso
      });
    }

    return out;
  }

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function normalizeDate(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return formatDateISO(d);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return {
    createStore,
    build7DaysFromDate,
    formatDateISO
  };
})();