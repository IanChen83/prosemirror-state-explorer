import React, { useState, useEffect, useMemo } from 'react';
import { EditorView } from 'prosemirror-view';
import { NodeInfo } from '../types';
import { cn } from '../lib/utils';
import { Terminal, MapPin, Hash, Type } from 'lucide-react';

interface VisualizerProps {
  view: EditorView | null;
  // This prop serves as a signal to re-render when the editor state changes
  transactionCount: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ view, transactionCount }) => {
  const [pos, setPos] = useState<number>(0);
  const [trackCursor, setTrackCursor] = useState<boolean>(true);
  const [evalExpression, setEvalExpression] = useState<string>('node.type.name');
  const [evalResult, setEvalResult] = useState<string>('');
  
  // Update position based on tracker state and editor transactions
  useEffect(() => {
    if (!view) return;

    if (trackCursor) {
      // If tracking is ON, always sync to current cursor position
      const { from } = view.state.selection;
      setPos(from);
    } else {
      // If tracking is OFF, only update if the current position becomes invalid (e.g. document shortened)
      const maxPos = view.state.doc.content.size;
      if (pos > maxPos) {
        setPos(maxPos);
      }
    }
  }, [trackCursor, view, transactionCount]);

  // Calculate hierarchy based on pos
  const hierarchy = useMemo(() => {
    if (!view) return [];
    
    // Ensure pos is within bounds
    const safePos = Math.max(0, Math.min(pos, view.state.doc.content.size));
    let resolved;
    try {
        resolved = view.state.doc.resolve(safePos);
    } catch (e) {
        return [];
    }

    const path: NodeInfo[] = [];
    for (let i = 0; i <= resolved.depth; i++) {
      const node = resolved.node(i);
      path.push({
        type: node.type.name,
        start: resolved.start(i),
        end: resolved.end(i),
        depth: i,
        attrs: node.attrs,
        isBlock: node.isBlock,
        isInline: node.isInline,
        isText: node.isText,
        text: node.isText ? node.text : undefined
      });
    }

    return path;
  }, [view, pos, transactionCount]);

  // Handle Evaluation
  useEffect(() => {
    if (!view) return;
    try {
      const safePos = Math.max(0, Math.min(pos, view.state.doc.content.size));
      const resolved = view.state.doc.resolve(safePos);
      const node = resolved.node(resolved.depth); // Current parent node of position
      // Alternatively, allow accessing nodeAfter
      const nodeAfter = resolved.nodeAfter;

      // Create a function context
      // We pass: state, view, node (ancestor), nodeAfter, resolvedPos
      const func = new Function('state', 'view', 'node', 'nodeAfter', 'resolvedPos', 'pos', `return ${evalExpression}`);
      
      const result = func(view.state, view, node, nodeAfter, resolved, safePos);
      
      if (result === undefined) setEvalResult("undefined");
      else if (result === null) setEvalResult("null");
      else if (typeof result === 'object') setEvalResult(JSON.stringify(result, null, 2));
      else setEvalResult(String(result));

    } catch (e: any) {
      setEvalResult(`Error: ${e.message}`);
    }
  }, [view, pos, evalExpression, transactionCount]);

  if (!view) {
    return (
        <div className="flex items-center justify-center h-full text-slate-500 bg-slate-900">
            Waiting for editor...
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-blue-400">3.</span> Visualizer
        </h2>
        <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input 
                    type="checkbox" 
                    checked={trackCursor} 
                    onChange={(e) => setTrackCursor(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                Track Cursor
            </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Position Control */}
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={16} />
                    <span className="text-sm font-medium uppercase tracking-wider">Document Position</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                    <span className="text-slate-500 text-xs">POS</span>
                    <input 
                        type="number" 
                        value={pos} 
                        onChange={(e) => {
                            // Update pos directly, keep tracking ON if it was ON
                            setPos(parseInt(e.target.value) || 0);
                        }}
                        className="bg-transparent text-right w-16 font-mono text-blue-400 focus:outline-none"
                    />
                </div>
            </div>

            {/* Hierarchy Path */}
            <div className="space-y-2">
                <div className="text-xs text-slate-500 mb-2">NODE HIERARCHY</div>
                <div className="flex flex-col gap-2">
                    {hierarchy.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-3 group">
                            {idx < hierarchy.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-[-10px] w-px bg-slate-800 group-last:hidden"></div>
                            )}
                            <div className={cn(
                                "z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2",
                                idx === hierarchy.length - 1 ? "bg-blue-600 border-blue-400 text-white" : "bg-slate-800 border-slate-600 text-slate-400"
                            )}>
                                {idx}
                            </div>
                            <div className={cn(
                                "flex-1 p-3 rounded-md border text-sm transition-colors",
                                idx === hierarchy.length - 1 ? "bg-slate-800 border-blue-900/50 shadow-md shadow-blue-900/10" : "bg-slate-900/50 border-slate-800"
                            )}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn("font-bold font-mono", idx === hierarchy.length - 1 ? "text-blue-300" : "text-slate-300")}>
                                        {item.type}
                                    </span>
                                    <span className="text-xs font-mono text-slate-500">
                                        {item.start}-{item.end}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                    {Object.keys(item.attrs).length > 0 && (
                                        <div className="col-span-2 bg-slate-950/50 p-2 rounded">
                                            <span className="block text-slate-500 mb-1 text-[10px] uppercase">Attributes</span>
                                            <pre className="font-mono text-slate-300 overflow-x-auto">
                                                {JSON.stringify(item.attrs, null, 1).replace(/[\{\}"]/g, '').trim()}
                                            </pre>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Hash size={12} /> Size: {item.end - item.start}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Type size={12} /> {item.isBlock ? "Block" : item.isInline ? "Inline" : "Unknown"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Expression Evaluator */}
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-400 mb-3">
                <Terminal size={16} />
                <span className="text-sm font-medium uppercase tracking-wider">Expression Evaluator</span>
            </div>
            
            <div className="space-y-3">
                <div>
                    <div className="text-xs text-slate-500 mb-1 flex gap-2">
                        Available vars:
                        <code className="text-blue-400">state</code>
                        <code className="text-blue-400">view</code>
                        <code className="text-blue-400">node</code>
                        <code className="text-blue-400">nodeAfter</code>
                        <code className="text-blue-400">pos</code>
                        <code className="text-blue-400">resolvedPos</code>
                    </div>
                    <input 
                        type="text" 
                        value={evalExpression}
                        onChange={(e) => setEvalExpression(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm font-mono text-green-400 focus:outline-none focus:border-blue-500 placeholder-slate-600"
                        placeholder="e.g. node.childCount"
                    />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded p-3 min-h-[60px]">
                    <div className="text-xs text-slate-500 mb-1">RESULT</div>
                    <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap break-all">
                        {evalResult}
                    </pre>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
