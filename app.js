let data = JSON.parse(localStorage.getItem("sleepData")) || [];
let current = null;

// START
function startSleep(type) {
  current = {
    start: new Date().toISOString(),
    end: null,
    type,
    pauses: []
  };

  updateUI(type === "night" ? "🌙 nuit..." : "😴 sieste...");
}

// END
function endSleep() {
  if (!current) return;

  current.end = new Date().toISOString();
  data.push(current);

  localStorage.setItem("sleepData", JSON.stringify(data));

  current = null;

  drawTimeline();
  renderList();
}

// AJOUT MANUEL
function addManual() {
  let s = document.getElementById("start").value;
  let e = document.getElementById("end").value;
  let type = document.getElementById("sleepType").value;

  if (!s && !e) {
    alert("Ajoute au moins une heure");
    return;
  }

  let startDate = null;
  let endDate = null;

  if (s) {
    startDate = new Date();
    let [sh, sm] = s.split(":");
    startDate.setHours(sh, sm, 0);
  }

  if (e) {
    endDate = new Date();
    let [eh, em] = e.split(":");
    endDate.setHours(eh, em, 0);
  }

  if (startDate && !endDate) {
    data.push({ start: startDate.toISOString(), end: null, type, pauses: [] });
  }

  else if (!startDate && endDate) {
    let last = data[data.length - 1];
    if (last && !last.end) {
      last.end = endDate.toISOString();
      last.type = type;
    }
  }

  else {
    data.push({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type,
      pauses: []
    });
  }

  localStorage.setItem("sleepData", JSON.stringify(data));

  drawTimeline();
  renderList();
}

// TIMELINE
function drawTimeline() {
  const circle = document.getElementById("circle");

  circle.querySelectorAll(".segment").forEach(e => e.remove());

  const radius = 120;

  data.forEach(sleep => {
    if (!sleep.end) return;

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

      let x = radius * Math.cos((angle - 90) * Math.PI / 180);
      let y = radius * Math.sin((angle - 90) * Math.PI / 180);

      dot.style.position = "absolute";
      dot.style.left = (150 + x) + "px";
      dot.style.top = (150 + y) + "px";

      circle.appendChild(dot);
    }
  });
}

// LISTE
function renderList() {
  let container = document.getElementById("sleepList");
  container.innerHTML = "";

  data.forEach((sleep, i) => {
    let start = new Date(sleep.start);
    let end = sleep.end ? new Date(sleep.end) : null;

    let div = document.createElement("div");

    div.innerHTML = `
      <b>${sleep.type === "night" ? "🌙 Nuit" : "😴 Sieste"}</b><br>
      ${formatTime(start)} → ${end ? formatTime(end) : "..."}
      <br>
      <button onclick="deleteSleep(${i})">🗑️</button>
      <hr>
    `;

    container.appendChild(div);
  });
}

// DELETE
function deleteSleep(i) {
  data.splice(i, 1);
  localStorage.setItem("sleepData", JSON.stringify(data));
  drawTimeline();
  renderList();
}

// UTILS
function formatTime(d) {
  return d.getHours().toString().padStart(2,'0') + ":" +
         d.getMinutes().toString().padStart(2,'0');
}

function updateUI(text) {
  document.getElementById("countdown").innerText = text;
}

// INIT
drawTimeline();
renderList();
