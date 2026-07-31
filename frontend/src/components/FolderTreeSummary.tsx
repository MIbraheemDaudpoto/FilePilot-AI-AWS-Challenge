import React from 'react';
import { AnalysisResult } from '../types';
import { Folder, FileText, HardDrive } from 'lucide-react';

interface FolderTreeSummaryProps {
  results: AnalysisResult[];
}

interface TreeNode {
  name: string;
  files: string[];
  children: Record<string, TreeNode>;
}

export const FolderTreeSummary: React.FC<FolderTreeSummaryProps> = ({ results }) => {
  if (results.length === 0) return null;

  // Build tree hierarchy structure
  const rootNode: TreeNode = { name: 'Downloads', files: [], children: {} };

  results.forEach((res) => {
    // Normalize folder path: e.g. "Documents/Bills" or "Pictures/Personal"
    const pathParts = res.folder.split('/').filter(Boolean);
    let currentNode = rootNode;

    pathParts.forEach((part) => {
      if (!currentNode.children[part]) {
        currentNode.children[part] = { name: part, files: [], children: {} };
      }
      currentNode = currentNode.children[part];
    });

    currentNode.files.push(res.suggested_name);
  });

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const childKeys = Object.keys(node.children);
    const hasContent = childKeys.length > 0 || node.files.length > 0;

    if (!hasContent) return null;

    return (
      <div key={node.name} className="space-y-1.5 font-mono text-sm">
        {/* Render child folders */}
        {childKeys.map((key, idx) => {
          const isLastFolder = idx === childKeys.length - 1 && node.files.length === 0;
          const childNode = node.children[key];
          return (
            <div key={key} className="pl-4 md:pl-6 border-l border-slate-800">
              <div className="flex items-center gap-2 text-blue-300 font-medium py-1">
                <span className="text-slate-600 font-sans">{isLastFolder ? '└──' : '├──'}</span>
                <Folder className="w-4 h-4 text-blue-400 fill-blue-500/20 shrink-0" />
                <span>{childNode.name}/</span>
              </div>
              {renderTree(childNode, depth + 1)}
            </div>
          );
        })}

        {/* Render files in this node */}
        {node.files.map((file, fIdx) => {
          const isLastFile = fIdx === node.files.length - 1;
          return (
            <div key={file} className="pl-4 md:pl-6 border-l border-slate-800 flex items-center gap-2 text-emerald-400 py-1">
              <span className="text-slate-600 font-sans">{isLastFile ? '└──' : '├──'}</span>
              <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{file}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center border border-blue-800/40">
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Suggested Folder Structure</h3>
            <p className="text-xs text-slate-400">Visual hierarchy preview for your organized filesystem</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-medium border border-slate-700">
          {results.length} {results.length === 1 ? 'file' : 'files'} mapped
        </span>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 overflow-x-auto">
        <div className="flex items-center gap-2 text-slate-100 font-mono font-bold text-base mb-2">
          <HardDrive className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Downloads/</span>
        </div>
        {renderTree(rootNode)}
      </div>
    </div>
  );
};
