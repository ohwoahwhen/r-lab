/**
 * Progress, XP, ranks and the daily streak.
 * Every localStorage touch is wrapped: a private window or blocked storage
 * degrades to in-memory progress with a visible notice instead of a crash.
 */

const KEY = 'rlab.save.v1';
const THEME_KEY = 'rlab.theme';

export const RANKS = [
  { at: 0,    name: 'Volunteer RA' },
  { at: 150,  name: 'Research Assistant' },
  { at: 420,  name: 'Senior RA' },
  { at: 800,  name: 'Data Wrangler' },
  { at: 1250, name: 'Lab Analyst' },
  { at: 1750, name: 'Stats Lead' },
  { at: 2350, name: 'Lab Manager' },
  { at: 3000, name: 'Principal Investigator' },
];

export const HINT_COSTS = [5, 10, 15];

let storageOK = true;

export function storageWorking() { return storageOK; }

function safeGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v;
  } catch (err) {
    storageOK = false;
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    storageOK = false;
    return false;
  }
}

function safeRemove(key) {
  try { localStorage.removeItem(key); } catch { storageOK = false; }
}

export function blankState() {
  return {
    v: 1,
    xp: 0,
    missions: {},        // id -> { done, hints, tries }
    streak: 0,
    bestStreak: 0,
    lastDay: null,       // 'YYYY-MM-DD' of last passed mission
    startedAt: today(),
  };
}

let state = blankState();
const listeners = new Set();

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } }); }

export function getState() { return state; }

export function loadState() {
  state = blankState();
  const raw = safeGet(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.missions) {
        state = { ...blankState(), ...parsed, missions: parsed.missions || {} };
      }
    } catch { /* corrupt save: start fresh rather than crash */ }
  }
  refreshStreak();
  return state;
}

export function saveState() {
  safeSet(KEY, JSON.stringify(state));
}

export function replaceState(next) {
  state = { ...blankState(), ...next, missions: next.missions || {} };
  saveState();
  emit();
}

export function resetState() {
  state = blankState();
  safeRemove(KEY);
  emit();
}

/* ───────── dates & streak ───────── */

export function today(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayNumber(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/** A gap of 2+ days since the last pass breaks the streak. */
export function refreshStreak() {
  const last = dayNumber(state.lastDay);
  if (last == null) return;
  const gap = dayNumber(today()) - last;
  if (gap > 1) {
    state.streak = 0;
  }
}

function bumpStreak() {
  const t = today();
  if (state.lastDay === t) return false;
  const gap = state.lastDay ? dayNumber(t) - dayNumber(state.lastDay) : null;
  state.streak = gap === 1 ? state.streak + 1 : 1;
  state.lastDay = t;
  state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
  return true;
}

/* ───────── XP & ranks ───────── */

export function rankFor(xp) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].at) i = k;
  const cur = RANKS[i];
  const next = RANKS[i + 1] || null;
  const span = next ? next.at - cur.at : 1;
  const into = next ? xp - cur.at : 1;
  return {
    index: i, name: cur.name, next: next ? next.name : null,
    pct: next ? Math.max(0, Math.min(100, (into / span) * 100)) : 100,
    toNext: next ? next.at - xp : 0,
  };
}

export function missionRecord(id) {
  return state.missions[id] || { done: false, hints: 0, tries: 0 };
}

export function isDone(id) { return !!(state.missions[id] && state.missions[id].done); }

export function hintsUsed(id) { return missionRecord(id).hints || 0; }

/** Reveal the next hint. Returns the XP it cost. */
export function useHint(id) {
  const rec = { ...missionRecord(id) };
  const n = rec.hints || 0;
  if (n >= HINT_COSTS.length) return 0;
  rec.hints = n + 1;
  state.missions[id] = rec;
  saveState();
  emit();
  return HINT_COSTS[n];
}

export function countTry(id) {
  const rec = { ...missionRecord(id) };
  rec.tries = (rec.tries || 0) + 1;
  state.missions[id] = rec;
  saveState();
}

/**
 * Record a pass. XP is the mission's XP minus hint costs already revealed,
 * floored at 1. Re-passing a mission earns nothing.
 */
export function completeMission(id, baseXp) {
  const rec = { ...missionRecord(id) };
  const already = rec.done;
  const spent = HINT_COSTS.slice(0, rec.hints || 0).reduce((a, b) => a + b, 0);
  const gain = already ? 0 : Math.max(1, baseXp - spent);
  rec.done = true;
  rec.at = new Date().toISOString();
  state.missions[id] = rec;
  const before = rankFor(state.xp).index;
  state.xp += gain;
  const after = rankFor(state.xp).index;
  const streakUp = gain > 0 ? bumpStreak() : false;
  saveState();
  emit();
  return {
    gain, spent, repeat: already, streakUp,
    rankUp: after > before ? RANKS[after].name : null,
  };
}

export function totals(levels) {
  const ids = levels.flatMap((l) => l.missions.map((m) => m.id));
  const done = ids.filter(isDone).length;
  return { done, total: ids.length };
}

export function levelProgress(level) {
  const done = level.missions.filter((m) => isDone(m.id)).length;
  return { done, total: level.missions.length, complete: done === level.missions.length };
}

/** A level unlocks when the previous level's boss is passed. */
export function isLevelUnlocked(levels, index) {
  if (index === 0) return true;
  const prev = levels[index - 1];
  const boss = prev.missions.find((m) => m.boss);
  return boss ? isDone(boss.id) : levelProgress(prev).complete;
}

/* ───────── theme ───────── */

export function loadTheme() {
  const t = safeGet(THEME_KEY);
  return ['night', 'arcade', 'seminar'].includes(t) ? t : 'night';
}

export function saveTheme(t) { safeSet(THEME_KEY, t); }
