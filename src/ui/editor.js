/**
 * CodeMirror 6 with R syntax highlighting, theme-aware, and the RStudio
 * keyboard shortcuts in the muscle memory of anyone who has used RStudio.
 */

import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection,
} from '@codemirror/view';
import { EditorState, EditorSelection, Compartment, Prec } from '@codemirror/state';
import {
  defaultKeymap, history, historyKeymap, indentWithTab,
  deleteLine, moveLineUp, moveLineDown, copyLineDown, indentSelection,
} from '@codemirror/commands';
import { StreamLanguage, syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches, search } from '@codemirror/search';
import { r as rMode } from '@codemirror/legacy-modes/mode/r';
import { tags as t } from '@lezer/highlight';
import { isDarkTheme, onTheme } from './theme.js';

export const IS_MAC = /Mac|iPhone|iPad/i.test(
  (typeof navigator !== 'undefined' && (navigator.platform || navigator.userAgent)) || '');
const MOD = IS_MAC ? '⌘' : 'Ctrl';

/** Shown in the shortcuts panel. Keep in step with the keymap below. */
export const SHORTCUTS = [
  { keys: `${MOD} + ↵`, what: 'Run your code (just the selection, if you have one)', rstudio: true },
  { keys: `${MOD} + ⇧ + ↵`, what: 'Submit for grading', rstudio: false },
  { keys: 'Alt + −', what: 'Insert the assignment arrow  <-', rstudio: true },
  { keys: `${MOD} + ⇧ + M`, what: 'Insert the pipe  |>', rstudio: true },
  { keys: `${MOD} + ⇧ + C`, what: 'Comment or uncomment the selected lines', rstudio: true },
  { keys: `${MOD} + D`, what: 'Delete the current line', rstudio: true },
  { keys: `${MOD} + ⇧ + D`, what: 'Duplicate the current line', rstudio: true },
  { keys: 'Alt + ↑ / ↓', what: 'Move the current line up or down', rstudio: true },
  { keys: `${MOD} + ⇧ + A`, what: 'Reindent the selection', rstudio: true },
  { keys: 'Tab / ⇧ + Tab', what: 'Indent or outdent', rstudio: true },
  { keys: 'Ctrl + L', what: 'Clear the output pane', rstudio: true },
  { keys: `${MOD} + F`, what: 'Find in your code', rstudio: true },
  { keys: `${MOD} + Z  /  ${MOD} + ⇧ + Z`, what: 'Undo / redo', rstudio: true },
];

const darkHl = HighlightStyle.define([
  { tag: t.keyword, color: '#f472b6' },
  { tag: [t.name, t.variableName], color: '#e4eef5' },
  { tag: [t.function(t.variableName), t.function(t.name)], color: '#7dd3fc' },
  { tag: t.string, color: '#fbbf24' },
  { tag: t.number, color: '#a78bfa' },
  { tag: t.comment, color: '#64809a', fontStyle: 'italic' },
  { tag: t.operator, color: '#4ade80' },
  { tag: t.bool, color: '#f472b6' },
  { tag: t.null, color: '#f472b6' },
  { tag: t.punctuation, color: '#9fb3c4' },
]);

const lightHl = HighlightStyle.define([
  { tag: t.keyword, color: '#9d174d' },
  { tag: [t.name, t.variableName], color: '#16222e' },
  { tag: [t.function(t.variableName), t.function(t.name)], color: '#1d4ed8' },
  { tag: t.string, color: '#9a5700' },
  { tag: t.number, color: '#6d28d9' },
  { tag: t.comment, color: '#7a8b9a', fontStyle: 'italic' },
  { tag: t.operator, color: '#047857' },
  { tag: t.bool, color: '#9d174d' },
  { tag: t.null, color: '#9d174d' },
  { tag: t.punctuation, color: '#52606d' },
]);

const baseTheme = (dark) => EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--fg)' },
  '.cm-content': { caretColor: 'var(--accent)', padding: '10px 0' },
  '.cm-gutters': {
    backgroundColor: 'transparent', color: 'var(--fg-faint)',
    border: 'none', paddingRight: '6px',
  },
  '.cm-activeLine': { backgroundColor: dark ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.028)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--fg-dim)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: dark ? 'rgba(74,222,128,.22)' : 'rgba(34,197,94,.22)',
  },
  '.cm-selectionMatch': { backgroundColor: dark ? 'rgba(251,191,36,.18)' : 'rgba(217,119,6,.16)' },
  '.cm-matchingBracket': { outline: '1px solid var(--accent)', backgroundColor: 'transparent' },
  '.cm-scroller': { padding: '0 10px' },
  '.cm-panels': {
    backgroundColor: 'var(--bg-3)', color: 'var(--fg)',
    borderTop: '1px solid var(--border)',
  },
  '.cm-panel input, .cm-panel button': {
    background: 'var(--bg-2)', color: 'var(--fg)',
    border: '1px solid var(--border-2)', borderRadius: '4px', padding: '2px 6px',
  },
  '.cm-searchMatch': { backgroundColor: 'rgba(251,191,36,.3)' },
  '.cm-searchMatch-selected': { backgroundColor: 'rgba(251,191,36,.6)' },
}, { dark });

const themeComp = new Compartment();

function themeExtensions() {
  const dark = isDarkTheme();
  return [baseTheme(dark), syntaxHighlighting(dark ? darkHl : lightHl)];
}

/* ───────── RStudio-style editing commands ───────── */

/** Insert a snippet at the cursor, replacing any selection. */
function insertSnippet(text) {
  return (view) => {
    view.dispatch(view.state.changeByRange((range) => ({
      changes: { from: range.from, to: range.to, insert: text },
      range: EditorSelection.cursor(range.from + text.length),
    })));
    view.focus();
    return true;
  };
}

/** RStudio's Cmd+Shift+C: comment or uncomment every line the selection touches. */
function toggleComment(view) {
  const { state } = view;
  const changes = [];
  const seen = new Set();
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number;
    const last = state.doc.lineAt(range.to).number;
    for (let n = first; n <= last; n++) {
      if (seen.has(n)) continue;
      seen.add(n);
      const line = state.doc.line(n);
      const m = line.text.match(/^(\s*)(#\s?)?/);
      const indent = m[1].length;
      if (m[2]) {
        changes.push({ from: line.from + indent, to: line.from + indent + m[2].length, insert: '' });
      } else if (line.text.trim()) {
        changes.push({ from: line.from + indent, insert: '# ' });
      }
    }
  }
  if (!changes.length) return false;
  view.dispatch({ changes });
  return true;
}

const themeComps = () => themeExtensions();

/**
 * Bind a shifted letter under both spellings. Depending on the keyboard event,
 * the key name arrives as "m" or "M", and only one of them would match.
 */
function dual(key, run) {
  const upper = key.replace(/-([a-z])$/, (_, c) => `-${c.toUpperCase()}`);
  const keys = upper === key ? [key] : [key, upper];
  return keys.map((k) => ({ key: k, preventDefault: true, run }));
}

/**
 * @param {HTMLElement} parent
 * @param {{doc?: string, onRun?: Function, onSubmit?: Function, onClearOutput?: Function}} opts
 */
export function createEditor(parent, { doc = '', onRun, onSubmit, onClearOutput } = {}) {
  // Highest precedence so these win over the default keymap.
  const appKeys = Prec.highest(keymap.of([
    { key: 'Mod-Enter', preventDefault: true, run: () => { onRun && onRun(); return true; } },
    { key: 'Mod-Shift-Enter', preventDefault: true, run: () => { onSubmit && onSubmit(); return true; } },
    // RStudio editing shortcuts
    ...dual('Mod-Shift-m', insertSnippet(' |> ')),
    ...dual('Mod-Shift-c', toggleComment),
    { key: 'Mod-/', preventDefault: true, run: toggleComment },
    { key: 'Mod-d', preventDefault: true, run: deleteLine },
    ...dual('Mod-Shift-d', copyLineDown),
    { key: 'Alt-ArrowUp', preventDefault: true, run: moveLineUp },
    { key: 'Alt-ArrowDown', preventDefault: true, run: moveLineDown },
    ...dual('Mod-Shift-a', indentSelection),
    { key: 'Ctrl-l', preventDefault: true, run: () => { onClearOutput && onClearOutput(); return true; } },
    // Alt+- is listed here too, but the dom handler below is what reliably
    // catches it: on a Mac, Option+minus produces an en dash, not "-".
    { key: 'Alt--', preventDefault: true, run: insertSnippet(' <- ') },
  ]));

  const altMinus = EditorView.domEventHandlers({
    keydown(event, view) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return false;
      if (event.key === '-' || event.key === '–' || event.code === 'Minus') {
        event.preventDefault();
        insertSnippet(' <- ')(view);
        return true;
      }
      return false;
    },
  });

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        highlightSelectionMatches(),
        search({ top: true }),
        StreamLanguage.define(rMode),
        appKeys,
        altMinus,
        keymap.of([...closeBracketsKeymap, ...searchKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        themeComp.of(themeComps()),
      ],
    }),
  });

  const off = onTheme(() => {
    view.dispatch({ effects: themeComp.reconfigure(themeComps()) });
  });

  return {
    view,
    get value() { return view.state.doc.toString(); },
    set value(v) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: v } });
    },
    /** The selected text, or '' when nothing is selected. */
    selection() {
      const { state } = view;
      return state.selection.ranges
        .filter((r) => !r.empty)
        .map((r) => state.sliceDoc(r.from, r.to))
        .join('\n');
    },
    focus() { view.focus(); },
    destroy() { off(); view.destroy(); },
  };
}
