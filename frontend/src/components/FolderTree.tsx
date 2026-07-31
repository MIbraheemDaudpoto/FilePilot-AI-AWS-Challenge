import { FolderOpen, File } from 'lucide-react';
import { AnalysisResult } from '../types';

interface Props {
  results: AnalysisResult[];
}

interface TreeNode {
  children: Record<string, TreeNode>;
  files: string[];
}

function buildTree(results: AnalysisResult[]): TreeNode {
  const root: TreeNode = { children: {}, files: [] };

  results.forEach((r) => {
    if (r.error) return;
    const parts = (r.folder || 'Downloads').split('/');
    let node = root;
    parts.forEach((part) => {
      if (!node.children[part]) {
        node.children[part] = { children: {}, files: [] };
      }
      node = node.children[part];
    });
    node.files.push(r.suggested_name);
  });

  return root;
}

interface NodeProps {
  name: string;
  node: TreeNode;
  depth: number;
  isLast: boolean;
  prefix: string;
}

function TreeNodeView({ name, node, depth, isLast, prefix }: NodeProps) {
  const connector = isLast ? '└── ' : '├── ';
  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  const childKeys = Object.keys(node.children);
  const allItems = [
    ...childKeys.map((k) => ({ type: 'dir' as const, key: k })),
    ...node.files.map((f) => ({ type: 'file' as const, key: f })),
  ];

  return (
    <div>
      {/* Directory line */}
      <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 0}px` }}>
        <span className="text-slate-600 font-mono text-sm select-none whitespace-pre">{prefix}{connector}</span>
        <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-slate-200 text-sm font-medium">{name}/</span>
      </div>

      {/* Children */}
      {allItems.map((item, idx) => {
        const itemIsLast = idx === allItems.length - 1;
        if (item.type === 'dir') {
          return (
            <TreeNodeView
              key={item.key}
              name={item.key}
              node={node.children[item.key]}
              depth={depth + 1}
              isLast={itemIsLast}
              prefix={childPrefix}
            />
          );
        }
        // File leaf
        const fileConnector = itemIsLast ? '└── ' : '├── ';
        return (
          <div key={item.key} className="flex items-center gap-1.5">
            <span className="text-slate-600 font-mono text-sm select-none whitespace-pre">{childPrefix}{fileConnector}</span>
            <File className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-slate-300 text-sm font-mono">{item.key}</span>
          </div>
        );
      })}
    </div>
  );
}

export function FolderTree({ results }: Props) {
  const tree = buildTree(results.filter((r) => !r.error));
  const rootKeys = Object.keys(tree.children);
  if (rootKeys.length === 0) return null;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-lg shadow-black/20">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800/60 flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">Suggested Folder Structure</h3>
        <span className="ml-auto text-xs text-slate-500">{results.filter((r) => !r.error).length} files organized</span>
      </div>

      {/* Tree body */}
      <div className="px-5 py-4 font-mono text-sm space-y-0.5 overflow-x-auto">
        {/* Root Downloads label */}
        <div className="flex items-center gap-1.5 mb-2">
          <FolderOpen className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="text-amber-200 font-semibold">Downloads/</span>
        </div>

        {rootKeys.map((key, idx) => (
          <TreeNodeView
            key={key}
            name={key}
            node={tree.children[key]}
            depth={0}
            isLast={idx === rootKeys.length - 1}
            prefix=""
          />
        ))}
      </div>
    </div>
  );
}
