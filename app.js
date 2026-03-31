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
    
    📅 ${startDate} ${formatTime(s.start)}
    ${s.end ? "→ " + endDate + " " + formatTime(s.end) : ""}
    
    <br><br>
    <button onclick="editSleep(${i})">✏️ Modifier</button>
    <button onclick="deleteSleep(${i})">❌</button>
  </div>
`;
  });
}

// ===== PREDICTION =====
function predictNext() {
  if (data.length === 0) return;

  let last = data[data.length - 1];
  if (!last.end) return;

  let lastEnd = new Date(last.end);

  // 🧠 calcul fenêtre d'éveil moyenne
  let windows = [];

  for (let i = 1; i < data.length; i++) {
    if (!data[i-1].end) continue;

    let w = (new Date(data[i].start) - new Date(data[i-1].end)) / 60000;

    if (w > 30 && w < 300) windows.push(w);
  }

  let wakeWindow = windows.reduce((a,b)=>a+b,0)/windows.length || 120;

  // 🧠 durée sieste moyenne
  let naps = data.filter(s => s.type === "nap" && s.end);

  let napDurations = naps.map(n =>
    (new Date(n.end) - new Date(n.start)) / 60000
  );

  let avgNap = napDurations.reduce((a,b)=>a+b,0)/napDurations.length || 60;

  // 🧠 générer planning
  let predictions = [];

  let currentTime = new Date(lastEnd);

  for (let i = 0; i < 4; i++) {
    let napStart = new Date(currentTime);
    napStart.setMinutes(napStart.getMinutes() + wakeWindow);

    let napEnd = new Date(napStart);
    napEnd.setMinutes(napEnd.getMinutes() + avgNap);

    predictions.push({
      type: "nap",
      start: napStart,
      end: napEnd
    });

    currentTime = napEnd;
  }

  // 🌙 coucher nuit
  let bedtime = new Date(currentTime);
  bedtime.setMinutes(bedtime.getMinutes() + wakeWindow);

  // ===== UI =====
  displayPredictions(predictions, bedtime);

  // countdown = prochaine sieste
  let next = predictions[0].start;
  let minutes = Math.round((next - new Date())/60000);
  updateUI(minutes + " min");
}

function displayPredictions(predictions, bedtime) {
  let el = document.getElementById("nextTime");
  if (!el) return;

  let html = "";

  predictions.forEach((p, i) => {
    html += `
      <div style="margin-bottom:8px">
        😴 Sieste ${i+1} :
        ${formatTime(p.start)} → ${formatTime(p.end)}
      </div>
    `;
  });

  html += `
    <div style="margin-top:10px">
      🌙 Coucher estimé : ${formatTime(bedtime)}
    </div>
  `;

  el.innerHTML = html;
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
