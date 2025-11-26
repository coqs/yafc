  import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { 
  File,
  FileImage,
  FileText,
  FileCode,
  FileArchive,
  FolderOpen,
  Video,
  Music,
  Database,
  Copy,
  Trash2
} from "lucide-react";
import { getZipContents, getFolderRoots, deleteFile as apiDeleteFile, keepFile as apiKeepFile } from "../api";
import FolderTree from "./FolderTree";

// Keyboard shortcuts for actions
const SHORTCUTS = {
  KEEP: 'k',
  DELETE: 'd'
};

const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "svg", "tiff"];
const VIDEO_TYPES = ["mp4", "webm", "mov", "avi", "wmv", "mkv"];
const AUDIO_TYPES = ["mp3", "wav", "ogg", "wma", "flac", "m4a"];
const DOCUMENT_TYPES = ["pdf", "doc", "docx", "rtf", "txt", "pptx"];
const SPREADSHEET_TYPES = ["xls", "xlsx", "csv"];
const DATA_TYPES = ["json", "xml", "sql"];
const ARCHIVE_TYPES = ["zip", "rar", "7z", "tar", "gz"];

export default function FileViewer({ file }) {
  const [folderContents, setFolderContents] = useState(null); // array of files & dirs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zipContents, setZipContents] = useState([]);
  const [selected, setSelected] = useState(null);
  
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [zipError, setZipError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mainPreviewLoading, setMainPreviewLoading] = useState(false);

  if (!file) return null;

  const previewTarget = selected || file;

  const { filePath, fileSize, type } = file;
  const fileName = filePath.split(/[/\\]/).pop();
  const isFolder = type === 'directory' || (!fileName.includes('.') && fileSize === 0);
  const ext = isFolder ? '' : (fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '');
  const src = `http://localhost:3125/file?filePath=${encodeURIComponent(filePath)}`;

  // Effect for loading folder contents
  useEffect(() => {
    const loadFolderContents = async () => {
      if (isFolder) {
        try {
          setIsLoading(true);
          const files = await getFolderRoots(filePath);
          setFolderContents(files);
          setError(null);
          setMainPreviewLoading(false);
        } catch (err) {
          setError("Failed to load folder contents");
          console.error(err);
          setMainPreviewLoading(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setFolderContents(null);
      }
    };

    loadFolderContents();
  }, [filePath, isFolder]);

  // Effect for loading ZIP contents
  useEffect(() => {
    const loadZipContents = async () => {
      if (ARCHIVE_TYPES.includes(ext)) {
        try {
          setIsZipLoading(true);
          const contents = await getZipContents(filePath);
          setZipContents(contents);
          setZipError(null);
          setMainPreviewLoading(false);
        } catch (err) {
          setZipError("Failed to load archive contents");
          console.error(err);
          setMainPreviewLoading(false);
        } finally {
          setIsZipLoading(false);
        }
      } else {
        setZipContents([]);
      }
    };

    loadZipContents();
  }, [filePath, ext]);

  // Clear any selected item when switching files
  useEffect(() => {
    setSelected(null);
    setPreviewLoading(false);
    // Only set loading for non-folder/non-archive files
    if (!isFolder && !ARCHIVE_TYPES.includes(ext)) {
      setMainPreviewLoading(true);
      // Set a timeout to clear loading in case onLoad doesn't fire
      const timer = setTimeout(() => {
        setMainPreviewLoading(false);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setMainPreviewLoading(false);
    }
  }, [filePath, isFolder, ext]);

  // Set loading when selected changes
  useEffect(() => {
    if (selected) {
      setPreviewLoading(true);
      // Set a timeout to clear loading in case onLoad doesn't fire
      const timer = setTimeout(() => {
        setPreviewLoading(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selected]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const truncateFilename = (filename, maxLength = 30) => {
    // For files with extensions, remove the extension
    const lastDotIndex = filename.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename;
    
    if (nameWithoutExt.length <= maxLength) return nameWithoutExt;
    return `${nameWithoutExt.slice(0, maxLength)}...`;
  };

  // Find the longest common prefix (string) among paths and trim to the last directory separator
  const getCommonPrefix = (paths) => {
    if (!paths || paths.length === 0) return '';
    // start with the shortest path as upper bound
    let prefix = paths.reduce((a, b) => (a.length <= b.length ? a : b));
    for (let i = 0; i < paths.length; i++) {
      let j = 0;
      while (j < prefix.length && paths[i][j] === prefix[j]) j++;
      prefix = prefix.slice(0, j);
      if (prefix === '') break;
    }
    if (!prefix) return '';
    // Trim prefix to the last path separator so we return a directory path
    const lastSepIndex = Math.max(prefix.lastIndexOf('/'), prefix.lastIndexOf('\\'));
    if (lastSepIndex === -1) return prefix;
    return prefix.slice(0, lastSepIndex);
  };

  const getTypeColor = (extension) => {
    if (IMAGE_TYPES.includes(extension)) {
      return 'bg-purple-500';  // Purple for images
    }
    if (VIDEO_TYPES.includes(extension)) {
      return 'bg-blue-500';    // Blue for videos
    }
    if (AUDIO_TYPES.includes(extension)) {
      return 'bg-green-500';   // Green for audio
    }
    if (DOCUMENT_TYPES.includes(extension)) {
      return extension === 'pdf' ? 'bg-red-500' : 'bg-orange-500'; // Red for PDF, Orange for other docs
    }
    if (SPREADSHEET_TYPES.includes(extension)) {
      return 'bg-emerald-500'; // Emerald for spreadsheets
    }
    if (DATA_TYPES.includes(extension)) {
      return 'bg-yellow-500';  // Yellow for data files
    }
    if (ARCHIVE_TYPES.includes(extension)) {
      return 'bg-cyan-500';    // Cyan for archives
    }
    if (!extension || extension === '') {
      return 'bg-yellow-500';  // Yellow for folders
    }
    return 'bg-gray-500';      // Gray for unknown types
  };

  const renderPreviewFor = (f) => {
    if (!f) return null;
    const p = f.filePath || f.fullPath;
    const ps = f.fileSize || f.size || 0;
    const isDirectory = f.isDirectory;
    const name = p.split(/[/\\]/).pop();
    const extp = isDirectory ? '' : (name.includes('.') ? name.split('.').pop().toLowerCase() : '');
    const srcp = `http://localhost:3125/file?filePath=${encodeURIComponent(p)}`;
    if (isDirectory) return <FolderOpen className="w-12 h-12 text-orange-500" />;
    if (IMAGE_TYPES.includes(extp)) return <img src={srcp} alt={name} className="max-h-full max-w-full object-contain" onLoad={() => { setPreviewLoading(false); }} onError={() => { setPreviewLoading(false); }} />;
    if (VIDEO_TYPES.includes(extp)) return <video src={srcp} controls className="max-h-full max-w-full" onCanPlay={() => { setPreviewLoading(false); }} />;
    if (AUDIO_TYPES.includes(extp)) return <audio src={srcp} controls className="w-full" onCanPlay={() => { setPreviewLoading(false); }} />;
    if (extp === 'pdf') return <iframe src={srcp} className="w-full h-full border-0" title="preview" onLoad={() => { setPreviewLoading(false); }} />;
    if (DATA_TYPES.includes(extp) || extp === 'txt' || extp === 'md') return <iframe src={srcp} className="w-full h-full bg-gray-900 border-0 font-mono text-xs" style={{ colorScheme: 'dark' }} onLoad={() => { setPreviewLoading(false); }} />;
    return <div className="text-gray-500 text-xs">No preview available</div>;
  };

  const getFileIcon = (extension, isDir) => {
    if (isDir) return FolderOpen;
    if (IMAGE_TYPES.includes(extension)) return FileImage;
    if (VIDEO_TYPES.includes(extension)) return Video;
    if (AUDIO_TYPES.includes(extension)) return Music;
    if (DOCUMENT_TYPES.includes(extension)) return FileText;
    if (SPREADSHEET_TYPES.includes(extension)) return FileText;
    if (DATA_TYPES.includes(extension)) return Database;
    if (ARCHIVE_TYPES.includes(extension)) return FileArchive;
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(extension)) return FileCode;
    return File;
  };

  const FileIcon = getFileIcon(ext, isFolder);

  let content = null;
  if (folderContents) {
    content = (
      <div className="flex flex-col gap-2 p-3 w-full h-full bg-gray-900 rounded border border-orange-500">
        <div className="flex items-center gap-2 text-orange-500 text-sm">
          <FolderOpen className="w-4 h-4" />
          <span className="font-medium">Folder Contents</span>
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Loading...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            {folderContents && folderContents.length > 0 ? (
              <div className="flex h-full gap-2">
                <div className="w-1/2 overflow-auto">
                  <FolderTree items={folderContents} rootPath={filePath} onSelect={setSelected} selectedPath={selected?.filePath}/>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  {selected ? (
                    <>
                      <div className="flex-1 overflow-auto w-full flex items-center justify-center">
                        {previewLoading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-400 text-xs">Loading preview...</span>
                          </div>
                        ) : (
                          renderPreviewFor(selected)
                        )}
                      </div>
                      {!selected.isDirectory && (
                        <div className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs">
                          <span className="text-gray-300 truncate flex-1" title={selected.fullPath || selected.filePath}>{selected.name}</span>
                          <button 
                            onClick={async ()=>{await apiDeleteFile(selected.fullPath || selected.filePath);}} 
                            className="flex-shrink-0 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : <div className="text-gray-500 text-xs">Select a file</div>}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-xs">Folder is empty.</div>
            )}
          </div>
        )}
      </div>
    );
  } else if (IMAGE_TYPES.includes(ext)) {
    content = (
      <img
        src={src}
        alt={filePath}
        className="max-h-full max-w-full object-contain"
        onLoad={() => { setMainPreviewLoading(false); }}
        onError={() => { setMainPreviewLoading(false); }}
      />
    );
  } else if (VIDEO_TYPES.includes(ext)) {
    content = (
      <video
        src={src}
        controls
        className="max-h-full max-w-full"
        onCanPlay={() => { setMainPreviewLoading(false); }}
      />
    );
  } else if (AUDIO_TYPES.includes(ext)) {
    content = (
      <div className="flex flex-col items-center gap-4">
        <Music className="w-12 h-12 text-green-500" />
        <audio src={src} controls className="w-full max-w-sm" onCanPlay={() => { setMainPreviewLoading(false); }} />
      </div>
    );
  } else if (ext === 'pdf') {
    content = (
      <iframe 
        src={src} 
        className="w-full h-full border-none"
        title="PDF Preview"
        onLoad={() => { setMainPreviewLoading(false); }}
      />
    );
  } else if (["docx", "xlsx", "pptx"].includes(ext)) {
    // Use Google Docs Viewer
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + '/file?filePath=' + encodeURIComponent(filePath))}&embedded=true`;
    content = (
      <iframe 
        src={googleViewerUrl}
        className="w-full h-full border-none"
        title="Google Docs Viewer"
        onLoad={() => { setMainPreviewLoading(false); }}
      />
    );
  } else if (DATA_TYPES.includes(ext) || ext === 'txt' || ext === 'md') {
    content = (
      <iframe 
        src={src}
        className="w-full h-full bg-gray-900 border-0 font-mono text-xs"
        style={{ colorScheme: 'dark' }}
        onLoad={() => { setMainPreviewLoading(false); }}
      />
    );
  } else if (ARCHIVE_TYPES.includes(ext)) {
    // For archives, present the extracted contents using the same tree UI as folders
    const zipRootPath = zipContents && zipContents.length ? getCommonPrefix(zipContents.map(c => c.filePath)) : '';
    content = (
      <div className="flex flex-col gap-2 p-3 w-full h-full bg-gray-900 rounded border border-orange-500">
        <div className="flex items-center gap-2 text-orange-500 text-sm">
          <FileArchive className="w-4 h-4" />
          <span className="font-medium">Archive Contents</span>
        </div>

        {isZipLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Loading...
          </div>
        ) : zipError ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
            {zipError}
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            {zipContents && zipContents.length > 0 ? (
              <div className="flex h-full gap-2">
                <div className="w-1/2 overflow-auto">
                  <FolderTree items={zipContents} rootPath={zipRootPath || filePath} onSelect={setSelected} selectedPath={selected?.fullPath || selected?.filePath} />
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  {selected ? (
                    <>
                      <div className="flex-1 overflow-auto w-full flex items-center justify-center">
                        {renderPreviewFor(selected)}
                      </div>

                    </>
                  ) : <div className="text-gray-500 text-xs">Select a file</div>}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-xs">Archive is empty.</div>
            )}
          </div>
        )}
      </div>
    );
  } else if (isFolder) {
    content = (
      <div className="flex flex-col items-center justify-center">
        <FolderOpen className="w-12 h-12 text-orange-500 mb-2" />
        <span className="text-gray-300 text-sm">Loading folder contents...</span>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col items-center justify-center">
        <FileIcon className="w-12 h-12 text-gray-500 mb-2" />
        <span className="text-gray-300 text-sm">No preview available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {/* Info */}
      <div className="flex-shrink-0 flex items-center gap-2 w-full px-4 py-2 text-xs bg-gray-800 border border-gray-700 rounded">
        <FileIcon className={`w-4 h-4 flex-shrink-0 ${getTypeColor(ext).replace('bg-', 'text-')}`} />
        <span className="font-medium text-white truncate" title={filePath}>
          {truncateFilename(filePath.split(/[/\\]/).pop())}
        </span>
        <span className="text-gray-600">•</span>
        <span className="text-gray-400 shrink-0 text-xs">{formatFileSize(fileSize)}</span>
        <span className={`px-1.5 py-0.5 text-xs border rounded ${getTypeColor(ext).replace('bg-', 'border-')} ${getTypeColor(ext).replace('bg-', 'text-')}`}>
          {isFolder ? 'FOLDER' : ext.toUpperCase() || 'FILE'}
        </span>
        <button 
          className="ml-auto flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors" 
          onClick={() => navigator.clipboard.writeText(filePath)}
          title="Click to copy full path"
        >
          <Copy className="w-3 h-3" />
          <span className="hidden sm:inline">Copy</span>
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 w-full bg-gray-900 rounded p-3 border border-gray-800 overflow-auto">
        <div className="flex justify-center items-center h-full">
          {mainPreviewLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">Loading preview...</span>
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
}

FileViewer.propTypes = {
  file: PropTypes.shape({
    filePath: PropTypes.string.isRequired,
    fileSize: PropTypes.number.isRequired,
    type: PropTypes.string,
  }),
};
