import { Schema } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

export interface SchemaContext {
  Schema: typeof Schema;
}

export interface NodeInfo {
  type: string;
  start: number;
  end: number;
  depth: number;
  attrs: Record<string, any>;
  isBlock: boolean;
  isInline: boolean;
  isText: boolean;
  text?: string;
}
