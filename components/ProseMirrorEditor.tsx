import React, { useRef, useEffect } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { baseKeymap, splitBlock } from 'prosemirror-commands';
import { inputRules, wrappingInputRule, textblockTypeInputRule } from 'prosemirror-inputrules';

interface ProseMirrorEditorProps {
  schema: Schema;
  onViewReady: (view: EditorView) => void;
  onTransaction: () => void;
}

const ProseMirrorEditor: React.FC<ProseMirrorEditorProps> = ({ schema, onViewReady, onTransaction }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Re-initialize editor when schema changes
  useEffect(() => {
    if (!editorRef.current) return;

    // Basic initial content
    const contentElement = document.createElement('div');
    contentElement.innerHTML = `<p>Hello World!</p><p>This is a <strong>ProseMirror</strong> explorer.</p><p>Try typing markdown:</p><ul><li><ul><li>bullet list</li></ul></li></ul><ol><li><ol><li>ordered list</li></ol></li></ol><blockquote>> blockquote</blockquote><h1>Heading</h1><table><tbody><tr><td><p>Table Cell</p></td><td><p>Table Cell 2</p></td></tr></tbody></table>`;
    
    // Attempt to parse content with the new schema, fallback to empty doc if it fails
    let doc;
    try {
        doc = DOMParser.fromSchema(schema).parse(contentElement);
    } catch (e) {
        console.warn("Failed to parse initial content with new schema", e);
        // Fallback to minimal doc
        try {
            doc = schema.nodeFromJSON({ type: 'doc', content: [{ type: 'paragraph' }] });
        } catch (e2) {
             // If paragraph doesn't exist, try just doc
             doc = schema.topNodeType.createAndFill();
        }
    }

    if (!doc) {
        console.error("Could not create a document from the schema");
        return;
    }

    // Build Input Rules based on current Schema
    const rules = [];
    
    // Blockquote: > + space
    if (schema.nodes.blockquote) {
      rules.push(wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote));
    }
    
    // Headings: #{1,6} + space
    if (schema.nodes.heading) {
      rules.push(textblockTypeInputRule(
        /^(#{1,6})\s$/,
        schema.nodes.heading,
        match => ({ level: match[1].length })
      ));
    }

    // Bullet list: * + space
    if (schema.nodes.bullet_list) {
      rules.push(wrappingInputRule(/^\s*\*\s$/, schema.nodes.bullet_list));
    }

    // Ordered list: \d+. + space (e.g., 1., 23., 100.)
    if (schema.nodes.ordered_list) {
      rules.push(wrappingInputRule(
        /^\s*(\d+)\.\s$/,
        schema.nodes.ordered_list,
        match => ({ start: parseInt(match[1], 10) })
      ));
    }

    const state = EditorState.create({
      doc,
      schema,
      plugins: [
        history(),
        inputRules({ rules }),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-Shift-z": redo,
          "Enter": splitBlock, // Basic command to ensure we can type new lines
        }),
        keymap(baseKeymap)
      ]
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction: (tr) => {
        const nextState = view.state.apply(tr);
        view.updateState(nextState);
        onTransaction(); // Notify parent to update visualizer
      }
    });

    viewRef.current = view;
    onViewReady(view);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [schema, onViewReady, onTransaction]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-100"><span className="text-blue-400">2.</span> Editor</h2>
        <div className="text-xs text-slate-400">
          Typing updates the state
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto bg-slate-900">
        <div ref={editorRef} className="h-full" />
      </div>
    </div>
  );
};

export default ProseMirrorEditor;
