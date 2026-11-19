// Stub storage so state.js runs outside a browser.
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
const S = await import('../src/game/state.js');

let fails = 0;
const ok = (c, m) => { if (!c) { console.log('FAIL:', m); fails++; } else console.log('  ok:', m); };
const shift = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return S.today(d); };

// 1. first ever pass starts a streak
S.resetState();
let r = S.completeMission('l1m1', 30);
ok(S.getState().streak === 1, 'first pass starts a 1-day streak');
ok(r.gain === 30 && r.streakUp === true, 'full XP on a clean pass');

// 2. a second pass on the same day does not double the streak
r = S.completeMission('l1m2', 35);
ok(S.getState().streak === 1, 'second pass the same day keeps the streak at 1');
ok(r.streakUp === false, 'no streak bump twice in a day');
ok(S.getState().xp === 65, 'XP accumulates');

// 3. re-passing a mission earns nothing
r = S.completeMission('l1m1', 30);
ok(r.gain === 0 && r.repeat === true, 're-passing earns no XP');
ok(S.getState().xp === 65, 'XP unchanged on a repeat');

// 4. playing the next day extends the streak
S.replaceState({ ...S.getState(), lastDay: shift(-1), streak: 4, bestStreak: 4 });
r = S.completeMission('l1m3', 35);
ok(S.getState().streak === 5, 'playing the next day extends the streak to 5');
ok(S.getState().bestStreak === 5, 'best streak follows');

// 5. a missed day breaks it on load
S.replaceState({ ...S.getState(), lastDay: shift(-3), streak: 9, bestStreak: 12 });
S.refreshStreak();
ok(S.getState().streak === 0, 'a 3-day gap resets the streak to 0');
ok(S.getState().bestStreak === 12, 'best streak is remembered');
r = S.completeMission('l1m4', 40);
ok(S.getState().streak === 1, 'playing again restarts the streak at 1');

// 6. yesterday is not a gap
S.replaceState({ ...S.getState(), lastDay: shift(-1), streak: 6 });
S.refreshStreak();
ok(S.getState().streak === 6, 'yesterday does not break the streak');

// 7. hints cost XP, floored at 1
S.resetState();
ok(S.useHint('l2m1') === 5 && S.useHint('l2m1') === 10 && S.useHint('l2m1') === 15, 'hint costs escalate');
ok(S.useHint('l2m1') === 0, 'no fourth hint');
r = S.completeMission('l2m1', 35);
ok(r.gain === 5 && r.spent === 30, '35 XP mission with all 3 hints pays 5');
S.resetState();
S.useHint('l1m1'); S.useHint('l1m1'); S.useHint('l1m1');
r = S.completeMission('l1m1', 30);
ok(r.gain === 1, 'a 30 XP mission with 30 XP of hints still pays the 1 XP floor');

// 8. ranks
ok(S.rankFor(0).name === 'Volunteer RA', 'starts as Volunteer RA');
ok(S.rankFor(420).name === 'Senior RA', 'rank threshold hit exactly');
ok(S.rankFor(419).name === 'Research Assistant', 'one XP short stays put');
ok(S.rankFor(99999).next === null && S.rankFor(99999).pct === 100, 'top rank is terminal');

// 9. level unlocking
const { LEVELS } = await import('../src/content/levels.js');
S.resetState();
ok(S.isLevelUnlocked(LEVELS, 0) === true, 'level 1 is open from the start');
ok(S.isLevelUnlocked(LEVELS, 1) === false, 'level 2 starts locked');
LEVELS[0].missions.filter((m) => !m.boss).forEach((m) => S.completeMission(m.id, m.xp));
ok(S.isLevelUnlocked(LEVELS, 1) === false, 'finishing the normal missions is not enough');
S.completeMission('l1boss', 120);
ok(S.isLevelUnlocked(LEVELS, 1) === true, 'the boss unlocks the next level');
ok(S.isLevelUnlocked(LEVELS, 2) === false, 'and only the next one');

// 10. corrupt save does not crash
mem.set('rlab.save.v1', '{not json');
S.loadState();
ok(S.getState().xp === 0, 'a corrupt save falls back to a blank one');

// 11. storage that throws
globalThis.localStorage = { getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); }, removeItem(){ throw new Error('blocked'); } };
S.loadState();
S.completeMission('l1m1', 30);
ok(S.getState().xp === 30, 'progress still works in memory when storage throws');
ok(S.storageWorking() === false, 'and the app knows storage is unavailable');

console.log(fails ? `\n${fails} FAILURES` : '\nAll state tests passed');
process.exit(fails ? 1 : 0);
