function startSleep() {
  current = {
    start: new Date().toISOString(),
    pauses: [],
    type: isNight() ? "night" : "nap"
  };

  updateUI("😴 en cours...");
}

function endSleep() {
  current.end = new Date().toISOString();
  data.push(current);
  drawTimeline();

  localStorage.setItem("sleepData", JSON.stringify(data));

  current = null;
  refresh();
}

function isNight() {
  let h = new Date().getHours();
  return (h >= 19 || h <= 6);
}

function pauseSleep() {
  current.pauses.push({
    time: new Date().toISOString()
  });
}

function addManual() {
  let s = document.getElementById("start").value;
  let e = document.getElementById("end").value;

  if (!s && !e) {
    alert("Ajoute au moins une heure");
    return;
  }

  let now = new Date();

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

  // 🔥 CAS 1 : début seul → sieste ouverte
  if (startDate && !endDate) {
    data.push({
      start: startDate.toISOString(),
      end: null,
      type: isNight() ? "night" : "nap",
      pauses: []
    });
  }

  // 🔥 CAS 2 : fin seule → compléter dernière sieste
  else if (!startDate && endDate) {
    let last = data[data.length - 1];
    if (last && !last.end) {
      last.end = endDate.toISOString();
    } else {
      alert("Aucune sieste en cours à compléter");
      return;
    }
  }

  // 🔥 CAS 3 : start + end → sieste complète
  else {
    data.push({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: isNight() ? "night" : "nap",
      pauses: []
    });
  }

  localStorage.setItem("sleepData", JSON.stringify(data));

  drawTimeline();
  refresh();
  renderList();
}
function refresh() {
  let next = predictNext();
  if (!next) return;

  let diff = (next.start - new Date()) / 60000;

  document.getElementById("countdown").innerHTML =
    `${Math.max(0, Math.round(diff))} min<br>
     <small>${formatTime(next.start)} → ${formatTime(next.end)}</small>`;
}

function formatTime(date) {
  return date.getHours().toString().padStart(2,'0') + ":" +
         date.getMinutes().toString().padStart(2,'0');
}

function updateUI(text) {
  document.getElementById("countdown").innerText = text;
}

refresh();

function drawTimeline() {
  const circle = document.getElementById("circle");

  if (!circle) return;

  // reset
  circle.querySelectorAll(".segment").forEach(e => e.remove());

  const radius = 120;

  data.forEach(sleep => {
    if (!sleep.end) return;

    let start = new Date(sleep.start);
    let end = new Date(sleep.end);

    let startMin = start.getHours() * 60 + start.getMinutes();
    let endMin = end.getHours() * 60 + end.getMinutes();

    let duration = endMin - startMin;
    if (duration < 0) duration += 1440;

    for (let i = 0; i < duration; i += 5) {
      let angle = ((startMin + i) / 1440) * 360;

      let dot = document.createElement("div");
      dot.className = "segment";

      dot.style.width = "6px";
      dot.style.height = "6px";
      dot.style.borderRadius = "50%";
      dot.style.background = sleep.type === "night" ? "#ffb86c" : "#7c8cff";

      let x = radius * Math.cos((angle - 90) * Math.PI / 180);
      let y = radius * Math.sin((angle - 90) * Math.PI / 180);

      dot.style.position = "absolute";
      dot.style.left = (150 + x) + "px";
      dot.style.top = (150 + y) + "px";

      circle.appendChild(dot);
    }
  });
}
