import { THEMES, getTheme, setTheme } from '../theme.js';
import { SHORTCUTS } from '../editor.js';
import { esc, toast, modal, confirmBox } from '../dom.js';
import { LEVELS, missionOrder } from '../../content/levels.js';
import {
  getState, replaceState, resetState, totals, rankFor, storageWorking,
} from '../../game/state.js';
import { exportCode, importCode, compareProgress, mergeProgress } from '../../game/savecode.js';

export function renderSettings(root, { go, onThemeChange }) {
  const st = getState();
  const t = totals(LEVELS);
  const rank = rankFor(st.xp);
  const code = exportCode(st, missionOrder());

  root.innerHTML = `
    <div class="settings">
      <div class="mlist__back"><button class="btn btn--sm btn--ghost" id="back">← Level map</button></div>
      <h1>Settings</h1>

      <h2>Progress</h2>
      <div class="statgrid">
        <div class="stat"><div class="stat__n">${st.xp}</div><div class="stat__l">Total XP</div></div>
        <div class="stat"><div class="stat__n">${t.done}/${t.total}</div><div class="stat__l">Missions</div></div>
        <div class="stat"><div class="stat__n">${st.streak}</div><div class="stat__l">Day streak</div></div>
        <div class="stat"><div class="stat__n">${st.bestStreak || 0}</div><div class="stat__l">Best streak</div></div>
      </div>
      <p class="muted" style="margin-top:var(--sp-3)">Current rank: <strong>${esc(rank.name)}</strong>${rank.next ? ` · ${rank.toNext} XP to ${esc(rank.next)}` : ' · top rank'}.</p>
      ${storageWorking() ? '' : '<p class="muted" style="color:var(--warn)">This browser is blocking local storage, so progress will vanish when you close the tab. Export a save code before you go.</p>'}

      <h2>Look and feel</h2>
      <div class="themepick">
        ${THEMES.map((th) => `
          <button class="themecard ${getTheme() === th.id ? 'is-on' : ''}"
                  data-theme-id="${th.id}" data-theme-preview="${th.id}"
                  aria-pressed="${getTheme() === th.id}">
            <span class="themecard__swatch">${th.swatch.map((c) => `<i style="background:${c}"></i>`).join('')}</span>
            <span class="themecard__name">${esc(th.name)}</span>
            <span class="themecard__desc">${esc(th.desc)}</span>
          </button>`).join('')}
      </div>

      <h2>Keyboard shortcuts</h2>
      <p class="muted">The editor uses RStudio's shortcuts, so anything you learn here carries over —
      and anything you already do in RStudio works here.</p>
      <table class="shortcuts">
        ${SHORTCUTS.map((sc) => `
          <tr>
            <td><kbd>${esc(sc.keys)}</kbd></td>
            <td>${esc(sc.what)}${sc.rstudio ? '' : ' <span class="muted">(R Lab only — RStudio has no Submit)</span>'}</td>
          </tr>`).join('')}
      </table>

      <h2>Move your progress to another device</h2>
      <p class="muted">Your save code holds your XP, streak and every mission you have passed. Copy it on this
      device, paste it on the other one. It is just text — email it to yourself, put it in a note, whatever.</p>
      <textarea class="codebox" id="out-code" readonly rows="3">${esc(code)}</textarea>
      <div class="row">
        <button class="btn btn--primary btn--sm" id="copy">Copy save code</button>
        <span class="muted" id="copy-note"></span>
      </div>

      <h2>Import a save code</h2>
      <textarea class="codebox" id="in-code" rows="3" placeholder="Paste a code starting with RLAB1-…"></textarea>
      <div class="row">
        <button class="btn btn--sm" id="import">Import</button>
        <span class="muted">Nothing is overwritten without asking you first.</span>
      </div>

      <h2>R session</h2>
      <p class="muted">R is running inside this page. There is no way to interrupt code that never finishes
      (a browser limitation, not a bug), so if R ever stops responding, reload it here.</p>
      <div class="row"><button class="btn btn--sm" id="restart">Restart R (reloads the page)</button></div>

      <h2 class="danger">Start over</h2>
      <div class="row"><button class="btn btn--sm danger" id="reset">Erase all progress</button></div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  $('#back').addEventListener('click', () => go('map'));

  root.querySelectorAll('[data-theme-id]').forEach((b) => {
    b.addEventListener('click', () => {
      setTheme(b.dataset.themeId);
      root.querySelectorAll('[data-theme-id]').forEach((x) => {
        x.classList.toggle('is-on', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
      if (onThemeChange) onThemeChange();
    });
  });

  $('#copy').addEventListener('click', async () => {
    const ta = $('#out-code');
    ta.select();
    let ok = false;
    try {
      await navigator.clipboard.writeText(ta.value);
      ok = true;
    } catch {
      try { ok = document.execCommand('copy'); } catch { ok = false; }
    }
    $('#copy-note').textContent = ok ? 'Copied.' : 'Could not copy automatically — it is selected, press ⌘/Ctrl+C.';
  });

  $('#import').addEventListener('click', async () => {
    const raw = $('#in-code').value;
    const res = importCode(raw, missionOrder());
    if (!res.ok) { toast(res.error, 'bad', 5200); return; }

    const local = getState();
    const cmp = compareProgress(local, res.state);
    const bodyRows = `
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0">
        <tr><th style="text-align:left"></th><th style="text-align:right">This device</th><th style="text-align:right">The code</th></tr>
        <tr><td>Missions passed</td><td style="text-align:right">${cmp.local.done}</td><td style="text-align:right">${cmp.incoming.done}</td></tr>
        <tr><td>Total XP</td><td style="text-align:right">${cmp.local.xp}</td><td style="text-align:right">${cmp.incoming.xp}</td></tr>
      </table>`;

    if (cmp.local.done === 0 && cmp.local.xp === 0) {
      replaceState(res.state);
      toast(`Imported: ${cmp.incoming.done} missions, ${cmp.incoming.xp} XP.`, 'good');
      renderSettings(root, { go, onThemeChange });
      return;
    }

    const choice = await modal({
      title: cmp.verdict === 'local-better' ? 'That code has less progress than this device' : 'Import this save code?',
      body: `${bodyRows}<p class="muted">${cmp.verdict === 'local-better'
        ? 'Replacing would lose work you have already done here. Merging keeps the best of both.'
        : 'Merging keeps every mission passed on either device and the higher XP.'}</p>`,
      actions: [
        { label: 'Merge (keep the best)', value: 'merge', primary: true },
        { label: 'Replace what is here', value: 'replace', danger: true },
        { label: 'Cancel', value: null },
      ],
    });
    if (!choice) return;
    const next = choice === 'merge' ? mergeProgress(local, res.state) : res.state;
    replaceState(next);
    toast(choice === 'merge' ? 'Merged.' : 'Replaced.', 'good');
    renderSettings(root, { go, onThemeChange });
  });

  $('#restart').addEventListener('click', async () => {
    const ok = await confirmBox('Restart R?',
      '<p>This reloads the page. Your progress is saved, but anything in the editor that you have not submitted will be lost.</p>',
      'Reload', 'Cancel');
    if (ok) location.reload();
  });

  $('#reset').addEventListener('click', async () => {
    const ok = await confirmBox('Erase all progress?',
      `<p>This clears every mission, your ${getState().xp} XP and your streak on this device. It cannot be undone.</p>
       <p class="muted">If you might want it back, copy your save code first.</p>`,
      'Erase everything', 'Cancel', true);
    if (!ok) return;
    resetState();
    toast('Progress erased.', 'bad');
    renderSettings(root, { go, onThemeChange });
  });
}
