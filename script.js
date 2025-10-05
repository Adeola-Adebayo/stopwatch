// ---------- 1) Elements from the page ----------
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const msEl = document.getElementById('milliseconds');

const startStopBtn = document.getElementById('startStopBtn');
const resetBtn = document.getElementById('resetBtn');
const lapBtn = document.getElementById('lapBtn');

const lapsList = document.getElementById('lapsList');
const themeToggle = document.getElementById('themeToggle');
const yearEl = document.getElementById('year');


// ---------- 2) Stopwatch state ----------
let isRunning = false;     // Are we currently counting?
let startTime = 0;         // When the current run started (in ms, from Date.now())
let elapsedMs = 0;         // Total elapsed milliseconds (includes pauses)
let intervalId = null;     // setInterval ID so we can stop it later
let lapCount = 0;          // How many laps recorded


// ---------- 3) Helpers (formatting numbers) ----------

function pad2(n) {
  return n.toString().padStart(2, '0');
}

// Pads 0..999 -> "000".."999"
function pad3(n) {
  return n.toString().padStart(3, '0');
}

// Convert elapsed milliseconds to H:M:S:ms parts and update the DOM spans
function renderTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const milli = ms % 1000;

  hoursEl.textContent = pad2(h);
  minutesEl.textContent = pad2(m);
  secondsEl.textContent = pad2(s);
  msEl.textContent = pad3(milli);
}


// ---------- 4) Core timer logic ----------
// used Date.now() so the stopwatch stays accurate even if the tab stutters.
// On each tick,  computed: elapsed = (now - startTime) + previously elapsed.
function startTimer() {
  if (isRunning) return; // prevent multiple intervals

  // If resuming after a pause, keep previous elapsedMs and shift startTime back
  startTime = Date.now() - elapsedMs;
  isRunning = true;

  // Update ~every 10ms (good balance for showing milliseconds without heavy CPU)
  intervalId = setInterval(() => {
    elapsedMs = Date.now() - startTime;
    renderTime(elapsedMs);
  }, 10);

  // Update button label to show current action
  startStopBtn.textContent = 'stop';
}

function stopTimer() {
  if (!isRunning) return;

  isRunning = false;
  clearInterval(intervalId);
  intervalId = null;

  startStopBtn.textContent = 'start';
}

function resetTimer() {
  // Stop the timer if running
  stopTimer();

  // Reset time to zero
  elapsedMs = 0;
  renderTime(elapsedMs);

  // Clear laps
  lapsList.innerHTML = '';
  lapCount = 0;
}

function addLap() {
  // Record the currently displayed time (even if paused, so no need to stop)
  lapCount += 1;

  const h = hoursEl.textContent;
  const m = minutesEl.textContent;
  const s = secondsEl.textContent;
  const ms = msEl.textContent;

  const li = document.createElement('li');
  li.textContent = `Lap ${lapCount} — ${h}:${m}:${s}.${ms}`;
  lapsList.appendChild(li);

  // Scroll to newest lap (great on my mobile)
  li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


// ---------- 5) Button wiring ----------
startStopBtn.addEventListener('click', () => {
  if (isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', resetTimer);
lapBtn.addEventListener('click', addLap);


// ---------- 6) Theme toggle ----------
// When checked -> dark theme (added a data attribute on <body>)
themeToggle.addEventListener('change', (e) => {
  if (e.target.checked) {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.removeAttribute('data-theme');
  }
});


// ---------- 7) Initial setup ----------
renderTime(0); // Show 00:00:00.000 on load
startStopBtn.textContent = 'start';
yearEl.textContent = new Date().getFullYear();

// Final note: I used "let" for variables that change, and "const" for fixed references to DOM elements and functions. Please bear with me on the comments, I study with my codes using the notes for my future self :). 