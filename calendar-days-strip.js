/* =========================
   NettoTrack Calendar Days Strip
   ========================= */

.ntDaysStrip{
  width:100%;
  min-width:0;
  display:flex;
  align-items:center;
}

.ntDaysStripScroll{
  width:100%;
  min-width:0;
  overflow-x:auto;
  overflow-y:hidden;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
  touch-action:pan-x pan-y;
}

.ntDaysStripScroll::-webkit-scrollbar{
  display:none;
}

.ntDaysStripTrack{
  display:flex;
  align-items:center;
  gap:10px;
  min-width:max-content;
  padding:2px 2px 4px;
}

/* =========================
   Day chip
   ========================= */

.ntDayChip{
  position:relative;
  flex:0 0 auto;
  width:64px;
  min-width:64px;
  height:96px;
  border-radius:22px;
  border:1px solid rgba(255,255,255,.14);
  background:
    radial-gradient(140% 220% at 25% 0%, rgba(255,255,255,.10), transparent 55%),
    linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    0 10px 24px rgba(0,0,0,.18);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:4px;
  padding:10px 6px;
  color:var(--nt-text);
  text-align:center;
  transition:
    transform .14s ease,
    filter .14s ease,
    background .14s ease,
    border-color .14s ease,
    box-shadow .14s ease;
}

.ntDayChip:active{
  transform:scale(.97);
  filter:brightness(1.03);
}

.ntDayChipWeekday{
  display:block;
  font-size:11px;
  line-height:1;
  font-weight:900;
  letter-spacing:.35px;
  text-transform:uppercase;
  color:var(--nt-text-muted);
}

.ntDayChipDate{
  display:block;
  font-size:17px;
  line-height:1;
  font-weight:1000;
  letter-spacing:.1px;
  color:var(--nt-text);
}

/* =========================
   Selected
   ========================= */

.ntDayChip.isSelected{
  border:1px solid transparent;
  background:
    linear-gradient(var(--nt-accent-fill), var(--nt-accent-fill)) padding-box,
    var(--nt-accent-border-gradient) border-box,
    radial-gradient(140% 220% at 25% 0%, rgba(255,255,255,.12), transparent 55%) border-box;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    0 12px 28px rgba(0,0,0,.22);
}

.ntDayChip.isSelected .ntDayChipWeekday,
.ntDayChip.isSelected .ntDayChipDate{
  color:var(--nt-text);
}

/* =========================
   Today
   ========================= */

.ntDayChip.isToday:not(.isSelected){
  border-color:rgba(255,255,255,.22);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.12),
    0 10px 24px rgba(0,0,0,.18);
}

/* =========================
   Has data
   ========================= */

.ntDayChip.hasData::after{
  content:"";
  position:absolute;
  left:50%;
  bottom:8px;
  transform:translateX(-50%);
  width:7px;
  height:7px;
  border-radius:999px;
  background:linear-gradient(90deg,#32c5ff 0%, #756bff 45%, #ff4fd8 100%);
  box-shadow:0 0 10px rgba(117,107,255,.28);
}

/* =========================
   Disabled
   ========================= */

.ntDayChip.isDisabled,
.ntDayChip:disabled{
  opacity:.42;
  filter:saturate(.75);
  pointer-events:none;
}

/* =========================
   Compact screens
   ========================= */

@media (max-width:390px){
  .ntDaysStripTrack{
    gap:8px;
  }

  .ntDayChip{
    width:58px;
    min-width:58px;
    height:90px;
    border-radius:20px;
    padding:9px 5px;
  }

  .ntDayChipWeekday{
    font-size:10px;
  }

  .ntDayChipDate{
    font-size:16px;
  }
}

/* =========================
   Larger screens
   ========================= */

@media (min-width:600px){
  .ntDaysStripTrack{
    gap:12px;
  }

  .ntDayChip{
    width:68px;
    min-width:68px;
    height:100px;
    border-radius:24px;
  }

  .ntDayChipWeekday{
    font-size:12px;
  }

  .ntDayChipDate{
    font-size:18px;
  }
}