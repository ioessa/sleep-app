function startSleep() {
  current = {
    start: new Date().toISOString(),
    pauses: []
  };

  updateUI("😴 sleeping...");
}

function endSleep() {
  current.end = new Date().toISOString();
  data.push(current);

  localStorage.setItem("sleepData", JSON.stringify(data));

  current = null;
  refresh();
}

function pauseSleep() {
  current.pauses.push({
    time: new Date().toISOString()
  });
}

function addManual() {
  let s = start.value;
  let e = end.value;

  let startDate = new Date();
  let endDate = new Date();

  startDate.setHours(...s.split(":"));
  endDate.setHours(...e.split(":"));

  data.push({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    pauses: []
  });

  localStorage.setItem("sleepData", JSON.stringify(data));

  refresh();
}

function refresh() {
  let next = predictNext();

  if (!next) return;

  let diff = (next - new Date()) / 60000;

  updateUI(Math.round(diff) + " min");
}

function updateUI(text) {
  document.getElementById("countdown").innerText = text;
}

refresh();
