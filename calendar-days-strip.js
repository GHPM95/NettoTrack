/* =========================
   NettoTrack Calendar Days Strip
   ========================= */

(function () {

  const WEEKDAYS = ["DOM","LUN","MAR","MER","GIO","VEN","SAB"]

  function formatDateISO(date){
    const y = date.getFullYear()
    const m = String(date.getMonth()+1).padStart(2,"0")
    const d = String(date.getDate()).padStart(2,"0")
    return `${y}-${m}-${d}`
  }

  function parseISO(iso){
    const [y,m,d] = iso.split("-").map(Number)
    return new Date(y,m-1,d)
  }

  function build7DaysFromDate(date,opts={}){

    const selectedDate = opts.selectedDate || formatDateISO(date)
    const hasDataMap = opts.hasDataMap || {}

    const start = new Date(date)
    start.setDate(start.getDate()-3)

    const days=[]

    for(let i=0;i<7;i++){

      const d = new Date(start)
      d.setDate(start.getDate()+i)

      const iso = formatDateISO(d)

      days.push({
        date:d,
        iso,
        weekday:WEEKDAYS[d.getDay()],
        day:d.getDate(),
        isToday: iso===formatDateISO(new Date()),
        isSelected: iso===selectedDate,
        hasData: !!hasDataMap[iso]
      })

    }

    return days

  }

  function createStore(opts){

    const mount = opts.mount
    let days = opts.days || []
    let selectedDate = opts.selectedDate
    const onChange = opts.onChange || function(){}

    if(!mount) return

    mount.innerHTML=""

    const strip = document.createElement("div")
    strip.className="ntDaysStrip"

    const scroll = document.createElement("div")
    scroll.className="ntDaysStripScroll"

    const track = document.createElement("div")
    track.className="ntDaysStripTrack"

    scroll.appendChild(track)
    strip.appendChild(scroll)
    mount.appendChild(strip)

    function render(){

      track.innerHTML=""

      days.forEach(day=>{

        const btn=document.createElement("button")

        btn.className="ntDayChip"
        if(day.isSelected) btn.classList.add("isSelected")
        if(day.isToday) btn.classList.add("isToday")
        if(day.hasData) btn.classList.add("hasData")

        btn.dataset.date=day.iso

        const weekday=document.createElement("span")
        weekday.className="ntDayChipWeekday"
        weekday.textContent=day.weekday

        const date=document.createElement("span")
        date.className="ntDayChipDate"
        date.textContent=day.day

        btn.appendChild(weekday)
        btn.appendChild(date)

        btn.addEventListener("click",()=>{

          selectedDate=day.iso

          days=days.map(d=>{
            return {...d,isSelected:d.iso===selectedDate}
          })

          render()

          onChange(selectedDate)

        })

        track.appendChild(btn)

      })

    }

    render()

    return {

      setDays(newDays){
        days=newDays
        render()
      },

      setSelected(iso){
        selectedDate=iso
        days=days.map(d=>({...d,isSelected:d.iso===iso}))
        render()
      },

      getSelected(){
        return selectedDate
      }

    }

  }

  window.NTCalendarDaysStrip={
    build7DaysFromDate,
    createStore,
    formatDateISO,
    parseISO
  }

})()