function getWakeWindow() {
  return 120; // sera dynamique ensuite
}

function predictNext() {
  if (data.length < 2) return null;

  let last = data[data.length - 1];
  let prev = data[data.length - 2];

  let lastWake = new Date(last.end);

  // 📊 calcul fenêtre d’éveil réelle
  let prevEnd = new Date(prev.end);
  let wakeWindow = (new Date(last.start) - prevEnd) / 60000;

  // 🧠 moyenne glissante
  let windows = [];

  for (let i = 1; i < data.length; i++) {
    let w = (new Date(data[i].start) - new Date(data[i-1].end)) / 60000;
    if (w > 30 && w < 400) windows.push(w);
  }

  let avgWindow =
    windows.reduce((a,b)=>a+b,0) / windows.length || 120;

  // 📉 ajustement fatigue
  let lastDuration =
    (new Date(last.end) - new Date(last.start)) / 60000;

  if (lastDuration < 45) avgWindow -= 20;
  if (lastDuration > 90) avgWindow += 10;

  // 🎯 prédiction
  let nextStart = new Date(lastWake);
  nextStart.setMinutes(nextStart.getMinutes() + avgWindow);

  let nextEnd = new Date(nextStart);
  nextEnd.setMinutes(nextEnd.getMinutes() + 60);

  return { start: nextStart, end: nextEnd };
}
