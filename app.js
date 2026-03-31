// ===== DATA =====
let data = JSON.parse(localStorage.getItem("sleepData")) || [];
let current = null;

// ===== START =====
function startSleep(type) {
  current = {
    start: new Date().toISOString(),
    end: null,
    type: type,
    pauses: []
  };

  updateUI("😴 en cours...");
  drawTimeline();
}

// ===== END =====
function endSleep() {
  if (!current) {
    alert("Aucun sommeil en cours");
    return;
  }

  current.end = new Date().toISOString();
  data.push(current);

  save();

  current = null;
}

// ===== MANUEL =====
function addManual() {
  let s = document.getElementById("start").value;
  let e = document.getElementById("end").value;
  let type = document.getElementById("sleepType").value;

  if (!s && !e) {
    alert("Ajoute au moins une heure");
    return;
  }

  let startDate = s ? parseTime(s) : null;
  let endDate = e ? parseTime(e) : null;

  if (startDate && !endDate) {
    data.push({ start: startDate, end: null, type });
  }

  else if (!startDate && endDate) {
    let last = data[data.length - 1];
    if (last && !last.end) {
      last.end = endDate;
    } else {
      alert("Pas de sieste en cours");
      return;
    }
  }

  else {
    data.push({ start: startDate, end: endDate, type });
  }

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

  // historique
  data.forEach(sleep => {
    if (!sleep.end) return;
    drawSegment(sleep, radius);
  });

  // courant
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

    if (live) {
      dot.style.boxShadow = "0 0 10px #fff";
    }

    let x = radius * Math.cos((angle - 90) * Math.PI / 180);
    let y = radius * Math.sin((angle - 90) * Math.PI / 180);

    dot.style.position = "absolute";
    dot.style.left = (150 + x) + "px";
    dot.style.top = (150 + y) + "px";

    document.getElementById("circle").appendChild(dot);
  }
}

// ===== LISTE =====
function renderList() {
  let el = document.getElementById("sleepList");
  if (!el) return;

  el.innerHTML = "";

  data.forEach((s,i) => {
    el.innerHTML += `
      <div class="item">
        ${s.type === "night" ? "🌙 Nuit" : "😴 Sieste"}<br>
        ${formatTime(s.start)} → ${s.end ? formatTime(s.end) : "..."}
        <br>
        <button onclick="deleteSleep(${i})">❌</button>
      </div>
    `;
  });
}

// ===== DELETE =====
function deleteSleep(i) {
  data.splice(i,1);
  save();
}

// ===== PREDICTION =====
function predictNext() {
  if (data.length < 2) return;

  let windows = [];

  for (let i = 1; i < data.length; i++) {
    let prevEnd = new Date(data[i-1].end);
    let start = new Date(data[i].start);

    let w = (start - prevEnd) / 60000;
    if (w > 30 && w < 400) windows.push(w);
  }

  let avg = windows.reduce((a,b)=>a+b,0)/windows.length || 120;

  let last = data[data.length - 1];
  let next = new Date(last.end);
  next.setMinutes(next.getMinutes() + avg);

  // affichage
  let txt = formatTime(next);

  let el = document.getElementById("nextTime");
  if (el) el.innerText = txt;

  let countdown = Math.round((next - new Date())/60000);
  updateUI(countdown + " min");

  scheduleNotification(next);
}

// ===== NOTIF =====
function scheduleNotification(date) {
  if (!("Notification" in window)) return;

  Notification.requestPermission().then(p => {
    if (p !== "granted") return;

    let delay = date - new Date();

    if (delay > 0 && delay < 86400000) {
      setTimeout(() => {
        new Notification("😴 Prochaine sieste !");
      }, delay);
    }
  });
}

// ===== UTILS =====
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
