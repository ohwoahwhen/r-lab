/**
 * Playtest harness — dev only, not part of the deployed site.
 * Opens at /test.html. Runs every mission's model solution (must pass) and
 * every wrong answer in wrong.js (must fail, with feedback that mentions the
 * right thing). Results land on window.__RESULTS for scripted inspection.
 */
import { bootEngine, setProgressHandler, runCode, gradeAnswer } from '../r/engine.js';
import { LEVELS } from '../content/levels.js';
import { WRONG } from './wrong.js';

const log = (s, cls = '') => {
  const el = document.createElement('div');
  if (cls) el.className = cls;
  el.textContent = s;
  document.getElementById('log').appendChild(el);
  el.scrollIntoView({ block: 'nearest' });
};

const results = { pass: [], fail: [], weak: [], startedAt: Date.now() };
window.__RESULTS = results;
window.__DONE = false;

setProgressHandler((stage, pct, detail) => {
  document.getElementById('status').textContent = `${stage} ${Math.round(pct)}% — ${detail || ''}`;
});

async function attempt(code) {
  const r = await runCode(code);
  return r;
}

async function main() {
  await bootEngine();
  log('R ready. Playing every mission.', 'h');

  const only = new URLSearchParams(location.search).get('only');

  for (const level of LEVELS) {
    for (const m of level.missions) {
      if (only && !m.id.startsWith(only)) continue;
      // 1. the model solution must pass
      const run = await attempt(m.solution);
      if (run.status !== 'ok') {
        results.fail.push({ id: m.id, why: 'solution errored', detail: run.message || run.text });
        log(`FAIL ${m.id} — solution errored: ${run.message}`, 'bad');
        continue;
      }
      const g = await gradeAnswer(m.check);
      if (!g.pass) {
        results.fail.push({ id: m.id, why: 'solution rejected', detail: g.problems.join(' | ') });
        log(`FAIL ${m.id} — solution rejected: ${g.problems.join(' | ')}`, 'bad');
        continue;
      }
      if ((m.kind === 'plot' || m.target) && (!run.images || !run.images.length)) {
        results.fail.push({ id: m.id, why: 'plot mission drew nothing' });
        log(`FAIL ${m.id} — no plot image produced`, 'bad');
        continue;
      }
      results.pass.push(m.id);
      log(`pass ${m.id} — ${m.title}`, 'ok');

      // 2. wrong answers must fail, with feedback that names the problem
      for (const [bad, mustMention] of (WRONG[m.id] || [])) {
        const br = await attempt(bad);
        let probs = [];
        let passed = false;
        if (br.status !== 'ok') {
          probs = [br.message || 'error'];
        } else {
          const bg = await gradeAnswer(m.check);
          passed = bg.pass;
          probs = bg.problems;
        }
        const text = probs.join(' | ');
        if (passed) {
          results.fail.push({ id: m.id, why: 'wrong answer accepted', detail: bad });
          log(`FAIL ${m.id} — a wrong answer passed: ${bad.slice(0, 70)}`, 'bad');
        } else if (mustMention && !mustMention.test(text)) {
          results.weak.push({ id: m.id, code: bad.slice(0, 80), feedback: text, wanted: String(mustMention) });
          log(`weak ${m.id} — feedback didn't mention ${mustMention}: ${text.slice(0, 160)}`, 'warn');
        } else {
          log(`  wrong-answer ok: ${text.slice(0, 110)}`, 'dim');
        }
      }
    }
  }

  window.__DONE = true;
  const line = `DONE — ${results.pass.length} passed, ${results.fail.length} failed, ${results.weak.length} weak hints`;
  log(line, results.fail.length ? 'bad' : 'ok');
  document.getElementById('status').textContent = line;
}

main().catch((e) => {
  window.__DONE = true;
  results.fail.push({ id: 'BOOT', why: String(e) });
  log(`BOOT FAILED: ${e}`, 'bad');
});
