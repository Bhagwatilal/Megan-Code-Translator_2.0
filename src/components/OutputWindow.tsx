import React from 'react';
import { X } from 'lucide-react';

interface OutputWindowProps {
  output: string;
  onClose: () => void;
}

export function OutputWindow({ output, onClose }: OutputWindowProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden animate-slideUp">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium">Output</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <pre className="p-4 text-sm font-mono overflow-auto max-h-48 whitespace-pre-wrap">
        {output}
      </pre>
    </div>
  );
}