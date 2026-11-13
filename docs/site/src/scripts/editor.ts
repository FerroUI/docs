import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { xml } from '@codemirror/lang-xml';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const highlighting=HighlightStyle.define([
  {tag:tags.tagName,color:'var(--docs-code-tag)'},
  {tag:tags.attributeName,color:'var(--docs-code-attribute)'},
  {tag:tags.attributeValue,color:'var(--docs-code-string)'},
  {tag:tags.comment,color:'var(--sl-color-gray-3)'},
]);

export function makeEditor(parent: HTMLElement, text: string, onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const view = new EditorView({ parent, state: EditorState.create({ doc: text, extensions: [
    lineNumbers(), history(), highlightActiveLine(), xml(), syntaxHighlighting(highlighting),
    EditorView.theme({'&':{backgroundColor:'var(--sl-color-bg)',color:'var(--sl-color-text)'},'.cm-activeLine':{backgroundColor:'var(--sl-color-bg-sidebar)'},'.cm-cursor':{borderLeftColor:'var(--sl-color-text)'}}),
    keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
    EditorView.contentAttributes.of({ 'aria-label': 'Editable XAML example' }),
    EditorView.updateListener.of((update) => { if (update.docChanged) { clearTimeout(timer); timer = setTimeout(onChange, 400); } }),
  ] }) });
  return { text: () => view.state.doc.toString(), reset: (value: string) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } }), destroy: () => { clearTimeout(timer); view.destroy(); } };
}
