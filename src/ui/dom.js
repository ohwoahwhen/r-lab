/** Tiny DOM helpers — no framework, so these stay small on purpose. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape text for safe interpolation into HTML. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Minimal inline markdown: `code`, **bold**, *italic*, and line breaks. */
export function md(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

export function mdp(s) { return `<p>${md(s)}</p>`; }

export function toast(message, kind = '', ms = 3200) {
  const host = $('#toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast ${kind ? `toast--${kind}` : ''}`;
  el.innerHTML = md(message);
  host.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 240ms, transform 240ms';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 260);
  }, ms);
}

/**
 * A promise-returning modal.
 * @param {{title:string, body:string, actions:{label:string,value:any,primary?:boolean}[]}} opts
 */
export function modal({ title, body, actions }) {
  return new Promise((resolve) => {
    const root = $('#modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `
      <div class="modal__box" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <h3>${esc(title)}</h3>
        <div class="modal__body">${body}</div>
        <div class="row" style="justify-content:flex-end">
          ${actions.map((a, i) => `<button class="btn ${a.primary ? 'btn--primary' : ''} ${a.danger ? 'danger' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}
        </div>
      </div>`;
    const close = (v) => { wrap.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) close(null);
      const btn = e.target.closest('button[data-i]');
      if (btn) close(actions[Number(btn.dataset.i)].value);
    });
    document.addEventListener('keydown', onKey);
    root.appendChild(wrap);
    const first = wrap.querySelector('.btn--primary') || wrap.querySelector('.btn');
    if (first) first.focus();
  });
}

export function confirmBox(title, body, yes = 'Yes', no = 'Cancel', danger = false) {
  return modal({
    title, body,
    actions: [
      { label: yes, value: true, primary: !danger, danger },
      { label: no, value: false },
    ],
  });
}
