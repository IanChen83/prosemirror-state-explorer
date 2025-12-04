import React, { useState, useCallback } from 'react';
import { Schema } from 'prosemirror-model';
import { AlertCircle, CheckCircle2, RotateCcw, Play } from 'lucide-react';
import { cn, DEFAULT_SCHEMA_CODE } from '../lib/utils';

interface SchemaEditorProps {
  onSchemaChange: (schema: Schema) => void;
  onError: (error: string | null) => void;
}

const SchemaEditor: React.FC<SchemaEditorProps> = ({ onSchemaChange, onError }) => {
  const [code, setCode] = useState(DEFAULT_SCHEMA_CODE);
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastSuccess, setLastSuccess] = useState<boolean>(true);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_SCHEMA_CODE);
    handleSubmit(DEFAULT_SCHEMA_CODE);
  }, []);

  const handleSubmit = useCallback((currentCode: string) => {
    try {
      // Create a function that takes 'Schema' as an argument and executes the user code
      const schemaCreator = new Function('Schema', currentCode);
      
      // Execute the function with the actual Schema class
      const result = schemaCreator(Schema);

      if (result instanceof Schema) {
        onSchemaChange(result);
        onError(null);
        setLastSuccess(true);
      } else {
        throw new Error("The code must return an instance of Schema.");
      }
    } catch (err: any) {
      console.error(err);
      onError(err.message || "An unknown error occurred evaluating the schema.");
      setLastSuccess(false);
    }
  }, [onSchemaChange, onError]);

  // Initial load
  React.useEffect(() => {
    handleSubmit(DEFAULT_SCHEMA_CODE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col border-b border-slate-700 bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800">
        <h2 className="text-lg font-semibold flex items-center gap-2">
           <span className="text-blue-400">1.</span> Schema Definition
        </h2>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-white"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-4 font-mono text-sm bg-slate-950 text-slate-300 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               {lastSuccess ? (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle2 size={16} className="mr-1" /> Schema valid
                  </div>
               ) : (
                  <div className="flex items-center text-red-400 text-sm">
                    <AlertCircle size={16} className="mr-1" /> Error in schema
                  </div>
               )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors"
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button
                onClick={() => handleSubmit(code)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
              >
                <Play size={16} />
                Apply Schema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaEditor;
