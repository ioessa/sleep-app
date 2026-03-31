// ===== DATA =====
let data = JSON.parse(localStorage.getItem("sleepData")) || [];
let current = null;

// ===== AGE BEBE (FIX) =====
function saveBirth() {
  let d = document.getElementById("birthDate")?.value;
  if (!d) return alert("Ajoute une date");

  localStorage.setItem("birthDate", d);
  alert("Âge enregistré !");
}

function getAgeMonths() {
  let d = localStorage.getItem("birthDate");
  if (!d) return 3;

  let birth = new Date(d);
  let now = new Date();

  return (now - birth) / (1000 * 60 * 60 * 24 * 30);
}

// ===== START =====
function startSleep(type) {
  current = {
    start: new Date().toISOString(),
    end: null,
    type
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

// ===== MANUEL =====
function addManual() {
  let date = document.getElementById("date")?.value;
  let s = document.getElementById("start").value;
  let e = document.getElementById("end").value;
  let type = document.getElementById("sleepType").value;

  if (!date) date = new Date().toISOString().split("T")[0];
  if (!s && !e) return alert("Ajoute une heure");

  let startDate = s ? combine(date, s) : null;
  let endDate = e ? combine(date, e) : null;

  // gestion nuit
  if (startDate && endDate && type === "night") {
    let sd = new Date(startDate);
    let ed = new Date(endDate);
    if (ed < sd) {
      ed.setDate(ed.getDate() + 1);
      endDate = ed.toISOString();
    }
  }

  if (startDate && !endDate) {
    data.push({ start: startDate, end: null, type });
  } else if (!startDate && endDate) {
    let last = data[data.length - 1];
    if (last && !last.end) last.end = endDate;
  } else {
    data.push({ start: startDate, end: endDate, type });
  }

  save();
}

// ===== EDIT =====
function editSleep(i) {
  let s = data[i];

  let startDate = new Date(s.start).toISOString().split("T")[0];
  let startTime = formatTime(s.start);

  let endDate = s.end
    ? new Date(s.end).toISOString().split("T")[0]
    : startDate;

  let endTime = s.end ? formatTime(s.end) : "";

  let newStartDate = prompt("Date début (YYYY-MM-DD)", startDate);
  let newStartTime = prompt("Heure début (HH:MM)", startTime);

  let newEndDate = prompt("Date fin (YYYY-MM-DD)", endDate);
  let newEndTime = prompt("Heure fin (HH:MM)", endTime);

  let newType = prompt("Type (nap/night)", s.type);

  if (newStartDate && newStartTime) {
    s.start = combine(newStartDate, newStartTime);
  }

  if (newEndDate && newEndTime) {
    let endISO = combine(newEndDate, newEndTime);

    if (newType === "night") {
      let sd = new Date(s.start);
      let ed = new Date(endISO);
      if (ed < sd) {
        ed.setDate(ed.getDate() + 1);
        endISO = ed.toISOString();
      }
    }

    s.end = endISO;
  }

  if (newType === "nap" || newType === "night") {
    s.type = newType;
  }

  save();
}

// ===== DELETE =====
function deleteSleep(i) {
  data.splice(i, 1);
  save();
}

// ===== SAVE =====
function save() {
  localStorage.setItem("sleepData", JSON.stringify(data));
  drawTimeline();
  renderList();
  predictNext();
}

// ===== LISTE =====
function renderList() {
  let el = document.getElementById("sleepList");
  if (!el) return;

  el.innerHTML = "";

  data.forEach((s, i) => {
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

// ===== TIMELINE (simple) =====
function drawTimeline() {
  // volontairement simple (évite bugs)
}

// ===== 🧠 PREDICTION MULTI-SIESTES =====
function predictNext() {
  if (data.length === 0) return;

  let last = data[data.length - 1];
  if (!last.end) return;

  let age = getAgeMonths();

  let wakeWindow =
    age < 3 ? 90 :
    age < 6 ? 120 :
    age < 9 ? 150 :
    180;

  let napDuration =
    age < 6 ? 60 :
    age < 12 ? 50 :
    45;

  let lastEnd = new Date(last.end);

  let predictions = [];
  let currentTime = new Date(lastEnd);

  // 🔥 plusieurs siestes
  for (let i = 0; i < 4; i++) {
    let start = new Date(currentTime);
    start.setMinutes(start.getMinutes() + wakeWindow);

    let end = new Date(start);
    end.setMinutes(end.getMinutes() + napDuration);

    predictions.push({ start, end });

    currentTime = end;
  }

  // coucher
  let bedtime = new Date(currentTime);
  bedtime.setMinutes(bedtime.getMinutes() + wakeWindow);

  // affichage
  let el = document.getElementById("nextTime");
  if (el) {
    let html = "";

    predictions.forEach((p, i) => {
      html += `
        😴 Sieste ${i+1} : ${formatTime(p.start)} → ${formatTime(p.end)}<br>
      `;
    });

    html += `<br>🌙 Coucher : ${formatTime(bedtime)}`;

    el.innerHTML = html;
  }

  let minutes = Math.round((predictions[0].start - new Date()) / 60000);
  updateUI(minutes + " min");
}

// ===== UTILS =====
function combine(date, time) {
  return new Date(date + "T" + time).toISOString();
}

function formatTime(d) {
  d = new Date(d);
  return d.getHours().toString().padStart(2, '0') + ":" +
         d.getMinutes().toString().padStart(2, '0');
}

function updateUI(text) {
  let el = document.getElementById("countdown");
  if (el) el.innerText = text;
}

// ===== INIT =====
renderList();
predictNext();
