// ===== DATA =====
let data = JSON.parse(localStorage.getItem("sleepData")) || [];
let current = null;

// ===== AGE BEBE (FIX PERSISTANT) =====
function saveBirth() {
  let d = document.getElementById("birthDate")?.value;
  if (!d) return alert("Ajoute une date");

  localStorage.setItem("birthDate", d);
  alert("Âge enregistré !");
}

function loadBirth() {
  let d = localStorage.getItem("birthDate");
  if (d) {
    document.getElementById("birthDate").value = d;
  }
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

// ===== AJOUT MANUEL =====
function addManual() {
  let dateInput = document.getElementById("date");
  let date = dateInput.value;

  let s = document.getElementById("start").value;
  let e = document.getElementById("end").value;
  let type = document.getElementById("sleepType").value;

  if (!date) date = new Date().toISOString().split("T")[0];

  let startDate = s ? combine(date, s) : null;
  let endDate = e ? combine(date, e) : null;

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

// ===== SAVE =====
function save() {
  localStorage.setItem("sleepData", JSON.stringify(data));
  renderList();
  drawTimeline();
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
        <button onclick="deleteSleep(${i})">❌ Supprimer</button>
      </div>
    `;
  });
}

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

// ===== 🎯 TIMELINE CERCLE =====
function drawTimeline() {
  const circle = document.getElementById("circle");
  if (!circle) return;

  circle.innerHTML = "";

  const radius = 120;

  data.forEach(s => {
    if (!s.end) return;

    let start = new Date(s.start);
    let end = new Date(s.end);

    let startMin = start.getHours() * 60 + start.getMinutes();
    let endMin = end.getHours() * 60 + end.getMinutes();

    let duration = endMin - startMin;
    if (duration < 0) duration += 1440;

    for (let i = 0; i < duration; i += 5) {
      let angle = ((startMin + i) / 1440) * 360;

      let dot = document.createElement("div");
      dot.style.width = "5px";
      dot.style.height = "5px";
      dot.style.borderRadius = "50%";
      dot.style.position = "absolute";

      dot.style.background =
        s.type === "night" ? "#ffb86c" : "#7c8cff";

      let x = radius * Math.cos((angle - 90) * Math.PI / 180);
      let y = radius * Math.sin((angle - 90) * Math.PI / 180);

      dot.style.left = (150 + x) + "px";
      dot.style.top = (150 + y) + "px";

      circle.appendChild(dot);
    }
  });
}

// ===== 🧠 PREDICTION =====
function predictNext() {
  if (data.length === 0) return;

  let age = getAgeMonths();

  let napsPerDay =
    age < 3 ? 5 :
    age < 6 ? 4 :
    age < 9 ? 3 :
    2;

  let wakeWindow =
    age < 3 ? 90 :
    age < 6 ? 120 :
    age < 9 ? 150 :
    180;

  let napDuration =
    age < 6 ? 60 :
    age < 12 ? 50 :
    45;

  let today = new Date().toISOString().split("T")[0];

  let napsDone = data.filter(s =>
    s.type === "nap" && s.start.startsWith(today)
  ).length;

  let last = data[data.length - 1];
  if (!last.end) return;

  let currentTime = new Date(last.end);
  let remaining = napsPerDay - napsDone;
  if (remaining < 0) remaining = 0;

  let predictions = [];

  for (let i = 0; i < remaining; i++) {
    let start = new Date(currentTime);
    start.setMinutes(start.getMinutes() + wakeWindow);

    if (start.getHours() >= 20) break;

    let end = new Date(start);
    end.setMinutes(end.getMinutes() + napDuration);

    predictions.push({ start, end });
    currentTime = end;
  }

  let bedtime = new Date(currentTime);
  bedtime.setMinutes(bedtime.getMinutes() + wakeWindow);

  if (bedtime.getHours() >= 21) {
    bedtime.setHours(21);
    bedtime.setMinutes(30);
  }

  let el = document.getElementById("nextTime");

  if (el) {
    let html = "";

    predictions.forEach((p, i) => {
      html += `😴 Sieste ${napsDone + i + 1} : ${formatTime(p.start)} → ${formatTime(p.end)}<br>`;
    });

    html += `<br>🌙 Coucher : ${formatTime(bedtime)}`;
    el.innerHTML = html;
  }
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
window.onload = () => {
  // 📅 date du jour auto
  let today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;

  loadBirth();
  renderList();
  drawTimeline();
  predictNext();
};
