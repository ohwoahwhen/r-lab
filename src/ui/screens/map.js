import { LEVELS, COMING_SOON } from '../../content/levels.js';
import { esc, md } from '../dom.js';
import { getState, isDone, isLevelUnlocked, levelProgress, rankFor, totals } from '../../game/state.js';

export function renderMap(root, { go }) {
  const st = getState();
  const t = totals(LEVELS);
  const rank = rankFor(st.xp);

  const nodes = LEVELS.map((level, i) => {
    const unlocked = isLevelUnlocked(LEVELS, i);
    const prog = levelProgress(level);
    const done = prog.complete;
    const current = unlocked && !done;
    const cls = ['node', done ? 'node--done' : '', current ? 'node--current' : '', !unlocked ? 'node--locked' : ''].join(' ');
    const dots = level.missions.map((m) => `<span class="node__dot ${isDone(m.id) ? 'is-done' : ''} ${m.boss ? 'is-boss' : ''}" title="${esc(m.title)}"></span>`).join('');
    const xpTotal = level.missions.reduce((a, m) => a + m.xp, 0);
    return `
      <button class="${cls}" data-level="${level.id}" ${unlocked ? '' : 'disabled aria-disabled="true"'}>
        <span class="node__badge">${done ? '✓' : unlocked ? level.n : '🔒'}</span>
        <span>
          <span class="node__name">${esc(level.title)}</span>
          <span class="node__desc">${unlocked ? esc(level.blurb) : `Finish the level ${level.n - 1} boss to unlock this.`}</span>
        </span>
        <span class="node__meta">
          ${prog.done}/${prog.total} · ${xpTotal} XP
          <span class="node__dots">${dots}</span>
        </span>
      </button>`;
  }).join('');

  const soon = COMING_SOON.map((l) => `
    <button class="node node--locked" disabled>
      <span class="node__badge">${l.n}</span>
      <span>
        <span class="node__name">${esc(l.title)}</span>
        <span class="node__desc">${esc(l.blurb)} <em>— being written.</em></span>
      </span>
      <span class="node__meta">soon</span>
    </button>`).join('');

  root.innerHTML = `
    <div class="map">
      <div class="map__head">
        <h1 class="map__title">The Comparative Cognition Lab</h1>
        <p class="map__sub">You are a new research assistant. Each level is a set of tasks from your supervisor,
        and every task makes you write real R that really runs. ${t.done} of ${t.total} missions passed ·
        ${esc(rank.name)}${rank.next ? ` · ${rank.toNext} XP to ${esc(rank.next)}` : ''}.</p>
      </div>
      <div class="map__grid">${nodes}${soon}</div>
    </div>`;

  root.querySelectorAll('[data-level]').forEach((btn) => {
    btn.addEventListener('click', () => go('level', { levelId: btn.dataset.level }));
  });
}

export function renderLevel(root, { go, levelId }) {
  const idx = LEVELS.findIndex((l) => l.id === levelId);
  const level = LEVELS[idx];
  if (!level) { go('map'); return; }
  const unlocked = isLevelUnlocked(LEVELS, idx);
  if (!unlocked) { go('map'); return; }

  const rows = level.missions.map((m, i) => {
    const prevDone = i === 0 || isDone(level.missions[i - 1].id);
    const open = prevDone || isDone(m.id);
    const cls = ['mrow', m.boss ? 'mrow--boss' : '', isDone(m.id) ? 'mrow--done' : ''].join(' ');
    return `
      <button class="${cls}" data-mission="${m.id}" ${open ? '' : 'disabled'}>
        <span class="mrow__tick">${isDone(m.id) ? '✓' : open ? (m.boss ? '★' : i + 1) : '🔒'}</span>
        <span>
          <span class="mrow__name">${esc(m.title)}</span>
          <span class="mrow__teach">${open ? md(m.task.split('\n')[0].slice(0, 120)) : 'Pass the mission above first.'}</span>
        </span>
        <span class="mrow__xp">${m.xp} XP</span>
      </button>`;
  }).join('');

  root.innerHTML = `
    <div class="mlist">
      <div class="mlist__back"><button class="btn btn--sm btn--ghost" id="back">← Level map</button></div>
      <h1>Level ${level.n} · ${esc(level.title)}</h1>
      <div class="mlist__story">${md(level.story)}</div>
      ${rows}
    </div>`;

  root.querySelector('#back').addEventListener('click', () => go('map'));
  root.querySelectorAll('[data-mission]').forEach((btn) => {
    btn.addEventListener('click', () => go('mission', { missionId: btn.dataset.mission }));
  });
}
