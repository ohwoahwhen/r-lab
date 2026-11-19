/** CodeMirror 6 with R syntax highlighting, theme-aware. */

import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { EditorState, Compartment, Prec } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { StreamLanguage, syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { r as rMode } from '@codemirror/legacy-modes/mode/r';
import { tags as t } from '@lezer/highlight';
import { isDarkTheme, onTheme } from './theme.js';

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
  '.cm-matchingBracket': { outline: '1px solid var(--accent)', backgroundColor: 'transparent' },
  '.cm-scroller': { padding: '0 10px' },
}, { dark });

const themeComp = new Compartment();

function themeExtensions() {
  const dark = isDarkTheme();
  return [baseTheme(dark), syntaxHighlighting(dark ? darkHl : lightHl)];
}

/**
 * @param {HTMLElement} parent
 * @param {{doc?: string, onRun?: () => void, onSubmit?: () => void}} opts
 */
export function createEditor(parent, { doc = '', onRun, onSubmit } = {}) {
  const runKeys = Prec.highest(keymap.of([
    { key: 'Mod-Enter', preventDefault: true, run: () => { onRun && onRun(); return true; } },
    { key: 'Mod-Shift-Enter', preventDefault: true, run: () => { onSubmit && onSubmit(); return true; } },
  ]));

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
        StreamLanguage.define(rMode),
        runKeys,
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        themeComp.of(themeExtensions()),
      ],
    }),
  });

  const off = onTheme(() => {
    view.dispatch({ effects: themeComp.reconfigure(themeExtensions()) });
  });

  return {
    view,
    get value() { return view.state.doc.toString(); },
    set value(v) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: v } });
    },
    focus() { view.focus(); },
    destroy() { off(); view.destroy(); },
  };
}
