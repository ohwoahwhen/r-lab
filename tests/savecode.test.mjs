import { exportCode, importCode, compareProgress, mergeProgress } from '../src/game/savecode.js';
import { missionOrder } from '../src/content/levels.js';

const order = missionOrder();
let fails = 0;
const ok = (c, m) => { if (!c) { console.log('FAIL:', m); fails++; } else console.log('  ok:', m); };

const state = {
  v: 1, xp: 1234, streak: 7, bestStreak: 19, lastDay: '2026-11-19',
  missions: {
    l1m1: { done: true, hints: 0 }, l1m2: { done: true, hints: 2 },
    l1boss: { done: true, hints: 3 }, l5boss: { done: true, hints: 1 },
    l3m4: { done: false, hints: 1 },
  },
};

const code = exportCode(state, order);
console.log('code:', code, `(${code.length} chars)`);
ok(code.startsWith('RLAB1-'), 'has prefix');
ok(code.length < 130, 'short enough to paste anywhere');

const back = importCode(code, order);
ok(back.ok, 'round-trips');
ok(back.state.xp === 1234, 'xp preserved');
ok(back.state.streak === 7 && back.state.bestStreak === 19, 'streaks preserved');
ok(back.state.lastDay === '2026-11-19', 'lastDay preserved');
ok(back.state.missions.l1m2.hints === 2, 'hint counts preserved');
ok(back.state.missions.l1boss.done === true, 'boss pass preserved');
ok(back.state.missions.l3m4.done === false && back.state.missions.l3m4.hints === 1, 'unfinished-with-hints preserved');
ok(Object.values(back.state.missions).filter(m=>m.done).length === 4, 'exactly 4 passes');

// whitespace / case / newline tolerance
ok(importCode('  ' + code.replace(/-/g,'-\n') + '  ', order).ok, 'tolerates whitespace and wrapped lines');
// corruption
const broken = code.slice(0, -1) + (code.at(-1) === 'A' ? 'B' : 'A');
const mid = code.slice(0, 12) + (code[12] === 'A' ? 'B' : 'A') + code.slice(13);
const r2 = importCode(broken, order);
ok(!r2.ok, 'rejects a single wrong character: ' + r2.error);
ok(!importCode(mid, order).ok, 'rejects a wrong character in the middle');
ok(!importCode('hello world', order).ok, 'rejects junk');
ok(importCode(code.toLowerCase().replace('rlab1','RLAB1'), order).ok, 'accepts a lowercased code');
ok(importCode(code.replace(/0/g,'O').replace(/1/g,'l'), order).ok, 'forgives O-for-0 and l-for-1 typos');
ok(!importCode('', order).ok, 'rejects empty');
const trunc = importCode(code.slice(0, 20), order);
ok(!trunc.ok, 'rejects truncated: ' + trunc.error);
// a code with a character dropped from the middle
ok(!importCode(code.slice(0, 30) + code.slice(31), order).ok, 'rejects a dropped character');

// comparison + merge
const local = { xp: 500, missions: { l1m1: {done:true}, l1m2:{done:true}, l2m1:{done:true} }, streak: 3, bestStreak: 3, lastDay: '2026-11-18' };
const incoming = back.state;
const cmp = compareProgress(local, incoming);
ok(cmp.verdict === 'incoming-better', 'spots the better incoming save');
ok(compareProgress(incoming, local).verdict === 'local-better', 'spots the worse incoming save');
const merged = mergeProgress(local, incoming);
ok(merged.xp === 1234, 'merge keeps higher xp');
ok(merged.missions.l2m1.done && merged.missions.l5boss.done, 'merge unions passes');
ok(Object.values(merged.missions).filter(m=>m.done).length === 5, 'merge has 5 passes (union of 3 and 4 with 2 shared)');
ok(merged.bestStreak === 19 && merged.lastDay === '2026-11-19', 'merge keeps best streak and newest day');

// a save from a future build with more missions must not crash
const future = exportCode({ ...state, missions: { ...state.missions, zz99: { done: true } } }, [...order, 'zz99']);
const fr = importCode(future, order);
ok(fr.ok, 'tolerates a code from a build with extra missions: ' + (fr.error||''));

// empty save
ok(importCode(exportCode({ xp: 0, missions: {}, streak: 0, bestStreak: 0, lastDay: null }, order), order).state.xp === 0, 'empty save round-trips');

console.log(fails ? `\n${fails} FAILURES` : '\nAll save-code tests passed');
process.exit(fails ? 1 : 0);
