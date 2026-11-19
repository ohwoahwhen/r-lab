import { loadTheme, saveTheme } from '../game/state.js';

export const THEMES = [
  {
    id: 'night', name: 'Night Lab',
    desc: 'Dark terminal, mono type, retro-game accents.',
    swatch: ['#0f1720', '#4ade80', '#fbbf24'],
  },
  {
    id: 'arcade', name: 'Arcade',
    desc: 'Bright, rounded and friendly. Big colourful progress.',
    swatch: ['#f3f7fb', '#22c55e', '#3b82f6'],
  },
  {
    id: 'seminar', name: 'Seminar',
    desc: 'Clean and academic. Game chrome turned down.',
    swatch: ['#fbfaf7', '#1f6f4a', '#8c5a16'],
  },
];

const subs = new Set();
let current = 'night';

export function initTheme() {
  current = loadTheme();
  apply(current);
  return current;
}

export function getTheme() { return current; }

export function setTheme(id) {
  if (!THEMES.some((t) => t.id === id)) return;
  current = id;
  apply(id);
  saveTheme(id);
  subs.forEach((fn) => fn(id));
}

export function onTheme(fn) { subs.add(fn); return () => subs.delete(fn); }

export function isDarkTheme(id = current) { return id === 'night'; }

function apply(id) {
  document.documentElement.dataset.theme = id;
}
