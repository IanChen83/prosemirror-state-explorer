import React, { useState, useCallback } from 'react';
import { Schema } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import SchemaEditor from './components/SchemaEditor';
import ProseMirrorEditor from './components/ProseMirrorEditor';
import Visualizer from './components/Visualizer';
import { AlertTriangle } from 'lucide-react';

// Generate default schema initially
// We need a dummy schema first to initialize state before the user even types
// But we can re-use the logic from utils or just create a very basic one here if needed
// Actually, SchemaEditor will fire onSchemaChange on mount with DEFAULT_SCHEMA_CODE

const App: React.FC = () => {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<EditorView | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);

  const handleSchemaChange = useCallback((newSchema: Schema) => {
    setSchema(newSchema);
    setError(null);
  }, []);

  const handleError = useCallback((err: string | null) => {
    setError(err);
  }, []);

  const handleViewReady = useCallback((newView: EditorView) => {
    setView(newView);
  }, []);

  const handleTransaction = useCallback(() => {
    // Increment counter to force visualizer update
    setTransactionCount(c => c + 1);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="flex-none bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">ProseMirror State Explorer</h1>
          <p className="text-xs text-slate-400 mt-1">Visualize nodes, evaluate expressions, and debug schemas.</p>
        </div>
        <a href="https://prosemirror.net" target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
            ProseMirror Documentation &rarr;
        </a>
      </header>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-800 px-6 py-2 flex items-center gap-2 text-sm text-red-200">
           <AlertTriangle size={16} />
           <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Schema Editor Section (Top) */}
        <div className="flex-none max-h-[40vh] overflow-y-auto">
            <SchemaEditor onSchemaChange={handleSchemaChange} onError={handleError} />
        </div>

        {/* Workspace (Bottom Split) */}
        <div className="flex-1 flex overflow-hidden">
            {/* Editor Pane */}
            <div className="w-1/2 min-w-[320px] h-full overflow-hidden border-r border-slate-700">
                {schema ? (
                    <ProseMirrorEditor 
                        schema={schema} 
                        onViewReady={handleViewReady} 
                        onTransaction={handleTransaction}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        Initializing Schema...
                    </div>
                )}
            </div>

            {/* Visualizer Pane */}
            <div className="w-1/2 min-w-[320px] h-full overflow-hidden bg-slate-950">
                <Visualizer view={view} transactionCount={transactionCount} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
