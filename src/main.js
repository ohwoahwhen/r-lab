import '../styles/tokens.css';
import '../styles/app.css';

import { bootEngine, setProgressHandler } from './r/engine.js';
import { initTheme } from './ui/theme.js';
import { $, esc, toast } from './ui/dom.js';
import { loadState, getState, onChange, rankFor, refreshStreak } from './game/state.js';
import { renderMap, renderLevel } from './ui/screens/map.js';
import { renderMission, disposeMission } from './ui/screens/mission.js';
import { renderSettings } from './ui/screens/settings.js';

const BOOT_STEPS = [
  ['fetch', 'Fetch webR'],
  ['start', 'Start R'],
  ['packages', 'Install tidyverse'],
  ['library', 'Load packages'],
  ['data', 'Build lab datasets'],
  ['selftest', 'Check everything works'],
  ['ready', 'Ready'],
];

const screens = {
  map: $('#screen-map'),
  level: $('#screen-map'),
  mission: $('#screen-mission'),
  settings: $('#screen-settings'),
};

let route = { name: 'map', params: {} };

function show(name) {
  $('#screen-loading').classList.remove('is-active');
  for (const el of [$('#screen-map'), $('#screen-mission'), $('#screen-settings')]) {
    el.classList.remove('is-active');
  }
  screens[name].classList.add('is-active');
  $('#topbar').hidden = false;
}

function go(name, params = {}) {
  if (route.name === 'mission' && name !== 'mission') disposeMission();
  route = { name, params };
  const hash = name === 'mission' ? `#m/${params.missionId}`
    : name === 'level' ? `#l/${params.levelId}`
    : name === 'settings' ? '#settings' : '#map';
  if (location.hash !== hash) history.replaceState(null, '', hash);
  render();
}

function render() {
  const { name, params } = route;
  show(name);
  if (name === 'map') renderMap(screens.map, { go });
  else if (name === 'level') renderLevel(screens.map, { go, ...params });
  else if (name === 'mission') renderMission(screens.mission, { go, ...params });
  else if (name === 'settings') renderSettings(screens.settings, { go, onThemeChange: drawHud });
  drawHud();
  // The screens scroll internally now, so reset the active one rather than the window.
  screens[name].scrollTop = 0;
}

function routeFromHash() {
  const h = location.hash || '';
  const m = h.match(/^#m\/(.+)$/);
  if (m) return { name: 'mission', params: { missionId: m[1] } };
  const l = h.match(/^#l\/(.+)$/);
  if (l) return { name: 'level', params: { levelId: l[1] } };
  if (h === '#settings') return { name: 'settings', params: {} };
  return { name: 'map', params: {} };
}

function drawHud() {
  const st = getState();
  const rank = rankFor(st.xp);
  $('#hud-rank').textContent = rank.name;
  $('#hud-xp').textContent = `${st.xp} XP`;
  $('#hud-xp-fill').style.width = `${rank.pct}%`;
  $('#hud-streak-n').textContent = String(st.streak || 0);
  $('#hud-streak').classList.toggle('streak--cold', !st.streak);
  $('#hud-streak').title = st.streak
    ? `${st.streak}-day streak · best ${st.bestStreak || st.streak}. Pass a mission today to keep it.`
    : 'No streak yet. Pass a mission today to start one.';
}

/* ───────── boot ───────── */

function bootUI() {
  const stepsEl = $('#boot-steps');
  stepsEl.innerHTML = BOOT_STEPS.map(([k, label]) =>
    `<li data-step="${k}">${esc(label)}</li>`).join('');

  setProgressHandler((stage, pct, detail) => {
    $('#boot-fill').style.width = `${Math.max(2, Math.min(100, pct))}%`;
    if (detail) $('#boot-status').textContent = detail;
    let past = true;
    for (const [k] of BOOT_STEPS) {
      const li = stepsEl.querySelector(`[data-step="${k}"]`);
      if (!li) continue;
      if (k === stage) { li.className = 'is-active'; past = false; }
      else li.className = past ? 'is-done' : '';
    }
  });
}

async function main() {
  initTheme();
  loadState();
  refreshStreak();
  onChange(drawHud);
  bootUI();

  $('#nav-map').addEventListener('click', () => go('map'));
  $('#nav-settings').addEventListener('click', () => go('settings'));
  $('#hud-streak').addEventListener('click', () => {
    const st = getState();
    toast(st.streak
      ? `${st.streak}-day streak. Best so far: ${st.bestStreak || st.streak}.`
      : 'No streak running. Pass any mission today to start one.');
  });
  window.addEventListener('hashchange', () => {
    const r = routeFromHash();
    if (r.name !== route.name || JSON.stringify(r.params) !== JSON.stringify(route.params)) {
      route = r;
      render();
    }
  });

  $('#boot-retry').addEventListener('click', () => location.reload());

  try {
    await bootEngine();
    route = routeFromHash();
    render();
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    $('#boot-error').hidden = false;
    $('#boot-error-msg').innerHTML =
      `<strong>R could not start.</strong><br>${esc(msg)}<br><br>` +
      'This is almost always a network hiccup while downloading R. ' +
      'A reload usually fixes it. If it keeps happening, check that your browser is up to date.';
    $('#boot-status').textContent = 'Stopped.';
  }
}

main();
