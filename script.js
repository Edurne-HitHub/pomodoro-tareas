const MODE_MINUTES = { focus: 25, short: 5, long: 15 };
const STORAGE_KEY = 'pomodoro-tareas-v1';

const state = loadState();

const clockEl = document.getElementById('clock');
const startPauseBtn = document.getElementById('startPause');
const resetBtn = document.getElementById('reset');
const modeButtons = document.querySelectorAll('.mode-btn');
const activeTaskLabel = document.getElementById('activeTaskLabel');
const pomoCountEl = document.getElementById('pomoCount');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');

let timerId = null;
let secondsLeft = MODE_MINUTES[state.mode] * 60;
let running = false;

function loadState() {
  const defaults = { mode: 'focus', tasks: [], selectedTaskId: null, pomoCountToday: 0, lastDate: todayKey() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = { ...defaults, ...JSON.parse(raw) };
    if (parsed.lastDate !== todayKey()) {
      parsed.pomoCountToday = 0;
      parsed.lastDate = todayKey();
    }
    return parsed;
  } catch {
    return defaults;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateClock() {
  clockEl.textContent = formatTime(secondsLeft);
  document.title = `${formatTime(secondsLeft)} · Pomodoro`;
}

function setMode(mode, resetTimer = true) {
  state.mode = mode;
  document.body.classList.remove('mode-focus', 'mode-short', 'mode-long');
  document.body.classList.add(`mode-${mode}`);
  modeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === mode));
  if (resetTimer) {
    pauseTimer();
    secondsLeft = MODE_MINUTES[mode] * 60;
    updateClock();
  }
  saveState();
}

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });
  } catch {
    /* audio not available */
  }
}

function tick() {
  secondsLeft -= 1;
  updateClock();
  if (secondsLeft <= 0) {
    completeSession();
  }
}

function completeSession() {
  pauseTimer();
  playDing();
  if (state.mode === 'focus') {
    state.pomoCountToday += 1;
    const task = state.tasks.find((t) => t.id === state.selectedTaskId);
    if (task) task.pomos += 1;
    saveState();
    renderTasks();
    renderPomoCount();
    const nextMode = state.pomoCountToday % 4 === 0 ? 'long' : 'short';
    setMode(nextMode);
  } else {
    setMode('focus');
  }
}

function startTimer() {
  if (running) return;
  running = true;
  startPauseBtn.textContent = 'Pausar';
  timerId = setInterval(tick, 1000);
}

function pauseTimer() {
  running = false;
  startPauseBtn.textContent = 'Iniciar';
  clearInterval(timerId);
  timerId = null;
}

function resetTimer() {
  pauseTimer();
  secondsLeft = MODE_MINUTES[state.mode] * 60;
  updateClock();
}

function renderPomoCount() {
  pomoCountEl.textContent = state.pomoCountToday;
}

function renderActiveTaskLabel() {
  const task = state.tasks.find((t) => t.id === state.selectedTaskId);
  activeTaskLabel.textContent = task ? `Trabajando en: ${task.text}` : 'Sin tarea activa';
}

function renderTasks() {
  taskList.innerHTML = '';
  if (state.tasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No hay tareas todavía. ¡Añade una!';
    taskList.appendChild(empty);
    renderActiveTaskLabel();
    return;
  }

  state.tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '') + (task.id === state.selectedTaskId ? ' selected' : '');

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;
    text.title = 'Marcar como completada';
    text.addEventListener('click', () => {
      task.done = !task.done;
      saveState();
      renderTasks();
    });

    const pomos = document.createElement('span');
    pomos.className = 'task-pomos';
    pomos.textContent = `🍅 ${task.pomos}`;

    const selectBtn = document.createElement('button');
    selectBtn.className = 'task-select-btn' + (task.id === state.selectedTaskId ? ' active' : '');
    selectBtn.textContent = task.id === state.selectedTaskId ? 'Activa' : 'Elegir';
    selectBtn.addEventListener('click', () => {
      state.selectedTaskId = task.id === state.selectedTaskId ? null : task.id;
      saveState();
      renderTasks();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Eliminar tarea';
    deleteBtn.addEventListener('click', () => {
      state.tasks = state.tasks.filter((t) => t.id !== task.id);
      if (state.selectedTaskId === task.id) state.selectedTaskId = null;
      saveState();
      renderTasks();
    });

    li.append(text, pomos, selectBtn, deleteBtn);
    taskList.appendChild(li);
  });

  renderActiveTaskLabel();
}

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

startPauseBtn.addEventListener('click', () => {
  running ? pauseTimer() : startTimer();
});

resetBtn.addEventListener('click', resetTimer);

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  state.tasks.push({ id: crypto.randomUUID(), text, done: false, pomos: 0 });
  taskInput.value = '';
  saveState();
  renderTasks();
});

setMode(state.mode, false);
updateClock();
renderPomoCount();
renderTasks();
