import { useState } from "react";
import PropTypes from "prop-types";
import { FolderOpen, Folder, File as FileIcon, ChevronDown, ChevronRight } from "lucide-react";

// Build a nested tree structure from flat list returned by getFolderRoots
export const buildTree = (items, rootPath) => {
  const root = {};

  items.forEach(({ filePath, fileSize, isDirectory }) => {
    // make relative path by removing the rootPath prefix (if any)
    let rel = filePath.startsWith(rootPath) ? filePath.slice(rootPath.length) : filePath;
    // remove any leading path separators (both / and \)
    rel = rel.replace(/^[\\/]+/, "");
    if (!rel) return; // skip root itself

    const parts = rel.split(/[\\/]/).filter(Boolean);
    insert(root, parts, 0, filePath, fileSize, isDirectory);
  });

  return root;
};

const insert = (node, parts, idx, fullPath, size, isDir) => {
  const name = parts[idx];
  if (!name) return;
  if (!node[name]) {
    node[name] = {
      name,
      path: parts.slice(0, idx + 1).join("/"), // relative path for display
      fullPath,
      size,
      isDirectory: idx === parts.length - 1 ? isDir : true,
      children: {},
    };
  }
  if (idx < parts.length - 1) {
    insert(node[name].children, parts, idx + 1, fullPath, size, isDir);
  }
};

const Node = ({ node, level = 0, onSelect, selectedPath }) => {
  const [open, setOpen] = useState(level === 0);
  const hasChildren = Object.keys(node.children).length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 cursor-pointer select-none hover:bg-gray-800/50 rounded px-1"
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => {
          if (hasChildren) setOpen((o) => !o);
          onSelect && onSelect(node);
        }}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-400" />
          )
        ) : (
          <span className="w-3" />
        )}
        {node.isDirectory ? (
          level === 0 ? (
            <FolderOpen className="w-4 h-4 text-orange-500" />
          ) : (
            <Folder className="w-4 h-4 text-orange-500" />
          )
        ) : (
          <FileIcon className="w-4 h-4 text-gray-400" />
        )}
        <span className={`text-gray-300 text-sm truncate ${selectedPath===node.fullPath?'text-orange-400':''}`} title={node.fullPath}>
          {node.name}
        </span>
        {!node.isDirectory && (
          <span className="ml-auto text-gray-500 text-xs">{formatFileSize(node.size)}</span>
        )}
      </div>
      {open &&
        hasChildren &&
        Object.values(node.children)
          .sort((a, b) => {
            // directories first
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
          .map((child) => (
            <Node key={child.fullPath + child.name} node={child} level={level + 1} onSelect={onSelect} selectedPath={selectedPath}/>
          ))}
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export default function FolderTree({ items, rootPath, onSelect, selectedPath }) {
  const tree = buildTree(items, rootPath);
  return (
    <div className="overflow-auto h-full">
      {Object.values(tree)
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map((node) => (
          <Node key={node.fullPath + node.name} node={node} onSelect={onSelect} selectedPath={selectedPath} />
        ))}
    </div>
  );
}

FolderTree.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      filePath: PropTypes.string.isRequired,
      fileSize: PropTypes.number.isRequired,
      isDirectory: PropTypes.bool.isRequired,
    })
  ).isRequired,
  rootPath: PropTypes.string.isRequired,
};
