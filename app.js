// ===== DATA =====
let data = JSON.parse(localStorage.getItem("sleepData")) || [];
let current = null;

// ===== START =====
function startSleep(type) {
  current = {
    start: new Date().toISOString(),
    end: null,
    type,
    pauses: []
  };

  updateUI("😴 en cours...");
  drawTimeline();
}

// ===== END =====
function endSleep() {
  if (!current) return alert("Aucun sommeil en cours");

  current.end = new Date().toISOString();
  data.push(current);

  save();
  current = null;
}

// ===== MANUEL + DATE =====
function addManual() {
  let date = document.getElementById("date").value;
  let s = document.getElementById("start").value;
  let e = document.getElementById("end").value;
  let type = document.getElementById("sleepType").value;

  // 👉 défaut = aujourd’hui
  if (!date) {
    date = new Date().toISOString().split("T")[0];
  }

  if (!s && !e) return alert("Ajoute une heure");

  let startDate = s ? combine(date, s) : null;
  let endDate = e ? combine(date, e) : null;

  if (startDate && !endDate) {
    data.push({ start: startDate, end: null, type });
  }

  else if (!startDate && endDate) {
    let last = data[data.length - 1];
    if (last && !last.end) last.end = endDate;
  }

  else {
    data.push({ start: startDate, end: endDate, type });
  }
  
// si nuit et heure fin < début → lendemain
if (startDate && endDate && type === "night") {
  let sD = new Date(startDate);
  let eD = new Date(endDate);

  if (eD < sD) {
    eD.setDate(eD.getDate() + 1);
    endDate = eD.toISOString();
  }
}
  
  save();
}

// ===== EDIT =====
function editSleep(i) {
  let s = data[i];

  let startDateObj = new Date(s.start);
  let endDateObj = s.end ? new Date(s.end) : null;

  // valeurs actuelles
  let startDate = startDateObj.toISOString().split("T")[0];
  let startTime = formatTime(s.start);

  let endDate = endDateObj
    ? endDateObj.toISOString().split("T")[0]
    : startDate;

  let endTime = s.end ? formatTime(s.end) : "";

  // prompts séparés (PROPRE)
  let newStartDate = prompt("Date début (YYYY-MM-DD)", startDate);
  let newStartTime = prompt("Heure début (HH:MM)", startTime);

  let newEndDate = prompt("Date fin (YYYY-MM-DD)", endDate);
  let newEndTime = prompt("Heure fin (HH:MM)", endTime);

  let newType = prompt("Type (nap/night)", s.type);

  // validation
  if (newStartDate && newStartTime) {
    s.start = combine(newStartDate, newStartTime);
  }

  if (newEndDate && newEndTime) {
    s.end = combine(newEndDate, newEndTime);
  }

  if (newType === "nap" || newType === "night") {
    s.type = newType;
  }

  save();
}

// ===== DELETE =====
function deleteSleep(i) {
  data.splice(i,1);
  save();
}

// ===== SAVE =====
function save() {
  localStorage.setItem("sleepData", JSON.stringify(data));
  drawTimeline();
  renderList();
  predictNext();
}

// ===== TIMELINE =====
function drawTimeline() {
  const circle = document.getElementById("circle");
  if (!circle) return;

  circle.querySelectorAll(".segment").forEach(e => e.remove());

  const radius = 120;

  data.forEach(s => {
    if (!s.end) return;
    drawSegment(s, radius);
  });

  if (current) {
    drawSegment({
      start: current.start,
      end: new Date().toISOString(),
      type: current.type
    }, radius, true);
  }
}

function drawSegment(sleep, radius, live = false) {
  let start = new Date(sleep.start);
  let end = new Date(sleep.end);

  let startMin = start.getHours()*60 + start.getMinutes();
  let endMin = end.getHours()*60 + end.getMinutes();

  let duration = endMin - startMin;
  if (duration < 0) duration += 1440;

  for (let i = 0; i < duration; i += 5) {
    let angle = ((startMin + i) / 1440) * 360;

    let dot = document.createElement("div");
    dot.className = "segment";

    dot.style.width = "6px";
    dot.style.height = "6px";
    dot.style.borderRadius = "50%";

    dot.style.background =
      sleep.type === "night" ? "#ffb86c" : "#7c8cff";

    if (live) dot.style.boxShadow = "0 0 10px #fff";

    let x = radius * Math.cos((angle - 90) * Math.PI / 180);
    let y = radius * Math.sin((angle - 90) * Math.PI / 180);

    dot.style.position = "absolute";
    dot.style.left = (150 + x) + "px";
    dot.style.top = (150 + y) + "px";

    document.getElementById("circle").appendChild(dot);
  }
}

// ===== LISTE (AVEC EDIT) =====
function renderList() {
  let el = document.getElementById("sleepList");
  if (!el) return;

  el.innerHTML = "";

  data.forEach((s,i) => {
    let startDate = new Date(s.start).toLocaleDateString();
    let endDate = s.end ? new Date(s.end).toLocaleDateString() : "";

    el.innerHTML += `
      <div class="item">
        <b>${s.type === "night" ? "🌙 Nuit" : "😴 Sieste"}</b><br>
        📅 ${date}<br>
        ${formatTime(s.start)} → ${s.end ? formatTime(s.end) : "..."}
        <br><br>
        <button onclick="editSleep(${i})">✏️ Modifier</button>
        <button onclick="deleteSleep(${i})">❌</button>
      </div>
    `;
  });
}

// ===== PREDICTION =====
function predictNext() {
  if (data.length < 2) return;

  let windows = [];

  for (let i = 1; i < data.length; i++) {
    let w = (new Date(data[i].start) - new Date(data[i-1].end)) / 60000;
    if (w > 30 && w < 400) windows.push(w);
  }

  let avg = windows.reduce((a,b)=>a+b,0)/windows.length || 120;

  let last = data[data.length - 1];
  let next = new Date(last.end);
  next.setMinutes(next.getMinutes() + avg);

  let txt = formatTime(next);

  let el = document.getElementById("nextTime");
  if (el) el.innerText = txt;

  let countdown = Math.round((next - new Date())/60000);
  updateUI(countdown + " min");
}

// ===== UTILS =====
function combine(date, time) {
  let d = new Date(date + "T" + time);
  return d.toISOString();
}

function parseTime(t) {
  let d = new Date();
  let [h,m] = t.split(":");
  d.setHours(h,m,0);
  return d.toISOString();
}

function formatTime(d) {
  d = new Date(d);
  return d.getHours().toString().padStart(2,'0') + ":" +
         d.getMinutes().toString().padStart(2,'0');
}

function updateUI(text) {
  let el = document.getElementById("countdown");
  if (el) el.innerText = text;
}

// ===== INIT =====
drawTimeline();
renderList();
predictNext();
