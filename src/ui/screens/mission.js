import { findMission, nextMission, LEVELS } from '../../content/levels.js';
import { esc, md, mdp, toast, modal } from '../dom.js';
import { createEditor } from '../editor.js';
import { drawImages } from '../plot.js';
import { runCode, gradeAnswer, renderPlot, peekData, shapeData, ensureStatsPackages, statsReady } from '../../r/engine.js';
import {
  completeMission, countTry, hintsUsed, isDone, useHint, HINT_COSTS, missionRecord,
} from '../../game/state.js';

const peekCache = new Map();
const targetCache = new Map();
const draftCache = new Map();
let active = null;

export function renderMission(root, { go, missionId }) {
  if (active) { active.editor.destroy(); active = null; }
  const found = findMission(missionId);
  if (!found) { go('map'); return; }
  const { level, mission } = found;
  const isPlot = mission.kind === 'plot' || !!mission.target;

  root.innerHTML = `
    <div class="mission">
      <div class="mission__head">
        <button class="btn btn--sm btn--ghost" id="back">← ${esc(level.title)}</button>
        <div>
          <div class="mission__crumb">Level ${level.n} · ${esc(level.title)}</div>
          <h2 class="mission__title">${esc(mission.title)}</h2>
        </div>
        <div class="mission__spacer"></div>
        ${mission.boss ? '<span class="tag tag--boss">Boss</span>' : ''}
        ${isPlot ? '<span class="tag tag--plot">Recreate the chart</span>' : ''}
        <span class="tag" id="xp-tag">${mission.xp} XP</span>
        ${isDone(mission.id) ? '<span class="tag">✓ passed</span>' : ''}
      </div>
      <div class="mission__tabs">
        <button class="btn btn--sm" data-tab="brief">Brief</button>
        <button class="btn btn--sm btn--primary" data-tab="work">Code</button>
      </div>
      <div class="mission__body">
        <div class="pane pane--brief" id="pane-brief">
          <div class="card card--story">
            <div class="card__label">Lab notebook</div>
            ${mdp(mission.teach)}
          </div>
          <div class="card card--task">
            <div class="card__label">Your task</div>
            ${taskHtml(mission.task)}
          </div>
          <div id="target-slot"></div>
          <div id="data-slot"></div>
          <div class="card" id="hint-card">
            <div class="card__label">Hints</div>
            <div class="hintbox" id="hints"></div>
          </div>
          <div id="sol-slot"></div>
        </div>
        <div class="pane pane--work is-shown" id="pane-work">
          <div class="work">
            <div class="editorwrap">
              <div class="editorwrap__bar">
                <span>R</span>
                <span class="spacer"></span>
                <button class="btn btn--sm btn--ghost" id="reset-code">Reset code</button>
              </div>
              <div id="editor"></div>
            </div>
            <div class="actions">
              <button class="btn" id="run">Run</button>
              <button class="btn btn--primary" id="submit">Submit</button>
              <button class="btn btn--ghost btn--sm" id="hint">Hint</button>
              <span class="spacer"></span>
              <span class="kbdhint">${kbdHint()}</span>
            </div>
            <div class="outwrap" id="outwrap">
              <div id="verdict"></div>
              <pre class="out" id="out"><span class="out__empty">Write some R and press Run. Output and plots appear here.</span></pre>
              <div class="plotbox" id="plot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const draft = draftCache.get(mission.id);
  const editor = createEditor($('#editor'), {
    doc: draft != null ? draft : (mission.starter || ''),
    onRun: () => doRun(),
    onSubmit: () => doSubmit(),
  });
  active = { editor, missionId: mission.id };

  editor.view.dom.addEventListener('keyup', () => draftCache.set(mission.id, editor.value));

  $('#back').addEventListener('click', () => go('level', { levelId: level.id }));
  $('#reset-code').addEventListener('click', () => {
    editor.value = mission.starter || '';
    draftCache.set(mission.id, editor.value);
    editor.focus();
  });
  root.querySelectorAll('[data-tab]').forEach((b) => {
    b.addEventListener('click', () => {
      const which = b.dataset.tab;
      $('#pane-brief').classList.toggle('is-shown', which === 'brief');
      $('#pane-work').classList.toggle('is-shown', which === 'work');
      root.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('btn--primary', x === b));
    });
  });

  drawHints();
  drawSolution();
  loadPeeks();
  if (mission.target) loadTarget();
  if (level.needsStats) ensureStats();

  /* ───────── statistics packages, fetched on first use ───────── */

  async function ensureStats() {
    if (statsReady()) return;
    const run = $('#run'); const submit = $('#submit');
    run.disabled = true; submit.disabled = true;
    const show = (html) => { $('#verdict').innerHTML = html; };
    show(`<div class="verdict"><div class="verdict__title"><span class="running"><i></i><i></i><i></i></span> Fetching the statistics packages</div>
      <p style="margin:0" id="stat-note">This level needs afex, emmeans, effectsize, psych and car — about 20 MB that the earlier levels never download. Once only; your browser caches them.</p></div>`);
    const res = await ensureStatsPackages((pkg) => {
      const n = $('#stat-note');
      if (n && pkg) n.textContent = `Installing ${pkg}…`;
    });
    if (res.ok) {
      run.disabled = false; submit.disabled = false;
      show('');
      toast('Statistics packages ready.', 'good', 2000);
    } else {
      const broken = [...(res.failed || []), ...(res.loadFailed || [])].join(', ');
      show(`<div class="verdict verdict--fail">
        <div class="verdict__title">Could not load the statistics packages</div>
        <p style="margin:0">These would not install or load: <code>${esc(broken)}</code>.
        That is usually a network problem. Reload the page to try again — the missions in
        levels 1–6 still work without them.</p>
      </div>`);
    }
  }

  /* ───────── hints & solution ───────── */

  function drawHints() {
    const used = hintsUsed(mission.id);
    const box = $('#hints');
    box.innerHTML = mission.hints.slice(0, used)
      .map((h, i) => `<div class="hint"><strong>Hint ${i + 1}.</strong> ${md(h)}</div>`).join('')
      || '<p class="muted" style="margin:0">No hints revealed. Each one costs a little XP, and they get more specific.</p>';
    const btn = $('#hint');
    if (used >= mission.hints.length) {
      btn.disabled = true;
      btn.textContent = 'No hints left';
    } else {
      btn.textContent = `Hint ${used + 1} (−${HINT_COSTS[used]} XP)`;
    }
    $('#xp-tag').textContent = `${currentReward()} XP`;
  }

  function currentReward() {
    const used = hintsUsed(mission.id);
    const spent = HINT_COSTS.slice(0, used).reduce((a, b) => a + b, 0);
    return Math.max(1, mission.xp - spent);
  }

  $('#hint').addEventListener('click', async () => {
    const used = hintsUsed(mission.id);
    if (used >= mission.hints.length) return;
    const ok = await modal({
      title: `Reveal hint ${used + 1}?`,
      body: `<p>It costs <strong>${HINT_COSTS[used]} XP</strong> off this mission's reward (you would earn ${Math.max(1, currentReward() - HINT_COSTS[used])} XP instead of ${currentReward()}).</p>`,
      actions: [{ label: 'Show the hint', value: true, primary: true }, { label: 'Not yet', value: false }],
    });
    if (!ok) return;
    useHint(mission.id);
    drawHints();
    drawSolution();
  });

  function drawSolution() {
    const slot = $('#sol-slot');
    const used = hintsUsed(mission.id);
    const passed = isDone(mission.id);
    if (!passed && used < mission.hints.length) {
      slot.innerHTML = '';
      return;
    }
    slot.innerHTML = `
      <div class="card solbox">
        <div class="card__label">Worked solution</div>
        ${passed ? '' : '<p class="muted">You have used every hint, so here it is. Read it, then type it yourself — passing after this still earns 1 XP.</p>'}
        <pre>${esc(mission.solution)}</pre>
        <div class="row"><button class="btn btn--sm" id="copy-sol">Put it in the editor</button></div>
      </div>`;
    const btn = slot.querySelector('#copy-sol');
    if (btn) btn.addEventListener('click', () => {
      editor.value = mission.solution;
      draftCache.set(mission.id, mission.solution);
      editor.focus();
    });
  }

  /* ───────── data peeks & target chart ───────── */

  async function loadPeeks() {
    const names = mission.datasets || [];
    if (!names.length) return;
    const slot = $('#data-slot');
    slot.innerHTML = names.map((n) => `
      <div class="card datapeek" style="margin-bottom:var(--sp-3)">
        <div class="card__label">${esc(n)} <span id="shape-${n}"></span></div>
        <pre id="peek-${n}">loading…</pre>
      </div>`).join('');
    for (const n of names) {
      try {
        if (!peekCache.has(n)) {
          peekCache.set(n, { text: await peekData(n, 6), shape: await shapeData(n) });
        }
        const { text, shape } = peekCache.get(n);
        const pre = slot.querySelector(`#peek-${n}`);
        const sh = slot.querySelector(`#shape-${n}`);
        if (pre) pre.textContent = text;
        if (sh) sh.textContent = `· ${shape}`;
      } catch (err) {
        const pre = slot.querySelector(`#peek-${n}`);
        if (pre) pre.textContent = `(could not preview: ${err})`;
      }
    }
  }

  async function loadTarget() {
    const slot = $('#target-slot');
    slot.innerHTML = `<div class="card"><div class="card__label">Target chart</div>
      <div id="target-plot"><span class="running"><i></i><i></i><i></i></span> drawing…</div></div>`;
    try {
      if (!targetCache.has(mission.id)) {
        const { images } = await renderPlot(mission.target);
        targetCache.set(mission.id, images);
      }
      const images = targetCache.get(mission.id);
      const host = slot.querySelector('#target-plot');
      host.innerHTML = '';
      if (!drawImages(host, images)) host.textContent = 'The target chart would not render.';
    } catch (err) {
      slot.querySelector('#target-plot').textContent = `Could not draw the target: ${err}`;
    }
  }

  /* ───────── run & submit ───────── */

  let busy = false;

  function setBusy(on, label) {
    busy = on;
    $('#run').disabled = on;
    $('#submit').disabled = on;
    if (on) {
      $('#verdict').innerHTML = `<div class="verdict"><span class="running"><i></i><i></i><i></i></span> ${esc(label)}</div>`;
    }
  }

  async function execute() {
    const code = editor.value;
    draftCache.set(mission.id, code);
    const res = await runCode(code);
    const out = $('#out');
    if (res.text && res.text.trim()) {
      out.textContent = res.text;
      out.classList.toggle('out--err', res.status === 'error' || res.status === 'parse');
    } else if (res.status === 'ok') {
      out.innerHTML = '<span class="out__empty">(no printed output — that is fine if your last line is an assignment or a plot)</span>';
      out.classList.remove('out--err');
    } else {
      out.textContent = res.message || '(nothing)';
      out.classList.add('out--err');
    }
    const plotHost = $('#plot');
    plotHost.innerHTML = '';
    if (res.images && res.images.length) {
      if (mission.target) {
        plotHost.innerHTML = '<div class="plotpair"><div id="mine"></div><div id="theirs"></div></div>';
        drawImages(plotHost.querySelector('#mine'), res.images, { label: 'Yours' });
        const t = targetCache.get(mission.id);
        if (t) drawImages(plotHost.querySelector('#theirs'), t, { label: 'Target' });
      } else {
        drawImages(plotHost, res.images);
      }
    }
    return res;
  }

  async function doRun() {
    if (busy) return;
    if (level.needsStats && !statsReady()) { await ensureStats(); if (!statsReady()) return; }
    setBusy(true, 'Running your R…');
    try {
      const res = await execute();
      $('#verdict').innerHTML = res.status === 'ok'
        ? ''
        : `<div class="verdict verdict--fail"><div class="verdict__title">R stopped with an error</div>${md(res.message || '')}</div>`;
    } catch (err) {
      $('#verdict').innerHTML = `<div class="verdict verdict--fail"><div class="verdict__title">Something went wrong</div>${esc(String(err))}</div>`;
    } finally {
      setBusy(false);
    }
  }

  async function doSubmit() {
    if (busy) return;
    if (level.needsStats && !statsReady()) { await ensureStats(); if (!statsReady()) return; }
    setBusy(true, 'Running and grading…');
    try {
      const res = await execute();
      if (res.status !== 'ok') {
        $('#verdict').innerHTML = `<div class="verdict verdict--fail">
          <div class="verdict__title">Your code didn't finish</div>
          <p style="margin:0">Fix the error above, then submit again. R said:</p>
          <ul><li><code>${esc(res.message || 'unknown error')}</code></li></ul>
        </div>`;
        countTry(mission.id);
        return;
      }
      const grade = await gradeAnswer(mission.check);
      countTry(mission.id);
      if (!grade.pass) {
        $('#verdict').innerHTML = `<div class="verdict verdict--fail">
          <div class="verdict__title">Not quite</div>
          <ul>${grade.problems.map((p) => `<li>${md(p)}</li>`).join('')}</ul>
        </div>`;
        const used = hintsUsed(mission.id);
        if (used < mission.hints.length) {
          $('#verdict').insertAdjacentHTML('beforeend',
            '<p class="muted" style="margin-top:8px">Stuck? A hint is one button away.</p>');
        }
        return;
      }
      const before = isDone(mission.id);
      const award = completeMission(mission.id, mission.xp);
      const nxt = nextMission(mission.id);
      $('#verdict').innerHTML = `<div class="verdict verdict--pass">
        <div class="verdict__title">✓ ${before ? 'Still correct' : 'Correct'}</div>
        <p style="margin:0">${award.gain > 0 ? `<strong>+${award.gain} XP</strong>${award.spent ? ` (${award.spent} XP went on hints)` : ''}.` : 'You had already passed this one, so no new XP.'}
        ${mission.debrief ? ` ${md(mission.debrief)}` : ''}</p>
        <div class="row">
          ${nxt ? `<button class="btn btn--primary btn--sm" id="go-next">Next mission →</button>` : ''}
          <button class="btn btn--sm" id="go-level">Back to level ${level.n}</button>
        </div>
      </div>`;
      const nb = $('#go-next');
      if (nb) nb.addEventListener('click', () => go('mission', { missionId: nxt }));
      $('#go-level').addEventListener('click', () => go('level', { levelId: level.id }));
      drawSolution();
      if (award.gain > 0) toast(`+${award.gain} XP`, 'xp', 2200);
      if (award.streakUp) {
        const s = missionRecord(mission.id);
        toast('Streak extended — see you tomorrow 🔥', 'good', 2600);
      }
      if (award.rankUp) {
        await modal({
          title: 'Promotion',
          body: `<div class="levelup"><div class="levelup__burst">🎉</div>
            <div class="levelup__rank">${esc(award.rankUp)}</div>
            <p class="muted">Dr. Finch has updated your title on the lab door.</p></div>`,
          actions: [{ label: 'Back to work', value: true, primary: true }],
        });
      }
      const lvl = LEVELS.find((l) => l.id === level.id);
      if (mission.boss && lvl) {
        const nextLvl = LEVELS[LEVELS.indexOf(lvl) + 1];
        if (nextLvl) toast(`Level ${nextLvl.n} unlocked: ${nextLvl.title}`, 'good', 3600);
      }
    } catch (err) {
      $('#verdict').innerHTML = `<div class="verdict verdict--fail"><div class="verdict__title">Grading failed</div>${esc(String(err))}</div>`;
    } finally {
      setBusy(false);
    }
  }

  $('#run').addEventListener('click', doRun);
  $('#submit').addEventListener('click', doSubmit);
  setTimeout(() => editor.focus(), 60);
}

/** Mac shows the command key, everyone else shows Ctrl. */
function kbdHint() {
  const mac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
  const mod = mac ? '⌘' : 'Ctrl';
  return `<kbd>${mod}</kbd>+<kbd>↵</kbd> run · <kbd>${mod}</kbd>+<kbd>⇧</kbd>+<kbd>↵</kbd> submit`;
}

function taskHtml(task) {
  const lines = String(task).split('\n');
  let html = '';
  let list = null;
  for (const line of lines) {
    const m = line.match(/^\s*(?:-|\d+\.)\s+(.*)$/);
    if (m) {
      const ordered = /^\s*\d+\./.test(line);
      if (list !== (ordered ? 'ol' : 'ul')) {
        if (list) html += `</${list}>`;
        list = ordered ? 'ol' : 'ul';
        html += `<${list}>`;
      }
      html += `<li>${md(m[1])}</li>`;
    } else {
      if (list) { html += `</${list}>`; list = null; }
      if (line.trim()) html += `<p>${md(line)}</p>`;
    }
  }
  if (list) html += `</${list}>`;
  return html;
}

export function disposeMission() {
  if (active) { active.editor.destroy(); active = null; }
}
