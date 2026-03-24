function getWakeWindow() {
  return 120; // sera dynamique ensuite
}

function predictNext() {
  if (data.length === 0) return null;

  let last = data[data.length - 1];
  let wake = new Date(last.end);

  let next = new Date(wake);
  next.setMinutes(next.getMinutes() + getWakeWindow());

  return next;
}
