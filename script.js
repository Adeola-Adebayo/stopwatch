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

// Keys used for local storage
const LS_KEYS = {
  elapsed: 'sw_elapsedMs',
  isRunning: 'sw_isRunning',
  start: 'sw_startTime',
  laps: 'sw_laps',
  theme: 'sw_theme'
};


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

// Converted elapsed milliseconds to H:M:S:ms parts and update the DOM spans
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

//Enable/disable controls based on state (lap only when running)
function updateControlStates() {
  lapBtn.disabled = !isRunning;     // Lap only while running
  startStopBtn.textContent = isRunning ? 'stop' : 'start';
}

// Save time/running state frequently so we don't lose it if the tab closes
function persistState() {
  localStorage.setItem(LS_KEYS.elapsed, String(elapsedMs));
  localStorage.setItem(LS_KEYS.isRunning, String(isRunning));
  localStorage.setItem(LS_KEYS.start, String(startTime));
}

//Keep laps in local storage
function persistLaps() {
  const items = Array.from(lapsList.querySelectorAll('li')).map(li => li.textContent);
  localStorage.setItem(LS_KEYS.laps, JSON.stringify(items));
}

//Restore everything on load (theme, laps, time, running state)
function restoreState() {
  const savedElapsed = Number(localStorage.getItem(LS_KEYS.elapsed) || 0);
  const savedRunning = localStorage.getItem(LS_KEYS.isRunning) === 'true';
  const savedStart = Number(localStorage.getItem(LS_KEYS.start) || 0);
  const savedLaps = JSON.parse(localStorage.getItem(LS_KEYS.laps) || '[]');
  const savedTheme = localStorage.getItem(LS_KEYS.theme);

// Theme
  if (savedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
  }

  // Laps
  if (Array.isArray(savedLaps) && savedLaps.length) {
    savedLaps.forEach(txt => {
      const li = document.createElement('li');
      li.textContent = txt;
      lapsList.appendChild(li);
    });
    lapCount = savedLaps.length;
  }

  // Time + running
  if (savedRunning && savedStart > 0) {
    // It was running; account for time passed while reloading
    elapsedMs = savedElapsed + (Date.now() - savedStart);
    startTime = Date.now() - elapsedMs;
    startTimer(); // will set isRunning=true and start ticking
  } else {
    elapsedMs = savedElapsed;
    renderTime(elapsedMs);
    isRunning = false;
    updateControlStates();
  }
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
    persistState(); // Save state frequently makes refresh seamless
  }, 10);

  // Update button label to show current action
  updateControlStates(); 
  persistState(); // Save initial state
}

function stopTimer() {
  if (!isRunning) return;

  isRunning = false;
  clearInterval(intervalId);
  intervalId = null;

  persistState(); // save paused state
  updateControlStates();
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
  persistLaps(); // clear saved laps
  persistState(); // clear saved time
}

function addLap() {
  // Do nothing if not running (prevents paused/never-started laps)
  if (!isRunning) return;

  // Increment lap count and add a new <li> with current time
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
  persistLaps(); // Save updated laps
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
    localStorage.setItem(LS_KEYS.theme, 'dark');
  } else {
    document.body.removeAttribute('data-theme');
    localStorage.setItem(LS_KEYS.theme, 'light');
  }
});


// ---------- 7) Initial setup ----------
renderTime(0); // Show 00:00:00.000 on load
yearEl.textContent = new Date().getFullYear();

// Restore everything (will also auto-start if it was running)
restoreState();

// Make sure buttons match the real state on load
updateControlStates(); 


// Final note: I used "let" for variables that change, and "const" for fixed references to DOM elements and functions. Please bear with me on the comments, I study with my codes using the notes for my future self :). 