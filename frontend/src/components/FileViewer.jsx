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
import { getZipContents, getFolderRoots, deleteFile as apiDeleteFile, keepFile as apiKeepFile, hostFile } from "../api";
import FolderTree from "./FolderTree";

// Keyboard shortcuts for actions
const SHORTCUTS = {
  KEEP: 'k',
  DELETE: 'd'
};

const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "svg", "tiff", "bmp"];
const VIDEO_TYPES = ["mp4", "webm", "mov", "avi", "wmv", "mkv", "3gpp", "flv", "ogg", "mpegps"];
const AUDIO_TYPES = ["mp3", "wav", "ogg", "opus", "mpeg"];
const DOCUMENT_TYPES = ["pdf", "doc", "docx", "rtf", "txt", "pptx"];
const SPREADSHEET_TYPES = ["xls", "xlsx", "csv"];
const DATA_TYPES = ["json", "xml", "sql"];
const ARCHIVE_TYPES = ["zip", "rar", "7z", "tar", "gz", "gzip"];
const CODE_TYPES = ["css", "html", "php", "c", "cpp", "h", "hpp", "js", "java", "py"];
const ADOBE_TYPES = ["dxf", "ai", "psd", "eps", "ps", "ttf"];
const APPLE_TYPES = ["key", "numbers"];

// Microsoft Office file types
const OFFICE_TYPES = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

// Files that can be shown locally
const LOCAL_PREVIEW_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES, ...AUDIO_TYPES, "pdf", "txt", "md", "html", "css", "js", "json", "xml"];

// Files that gview supports (excluding what we show locally and Office files)
const GVIEW_TYPES = [
  ...ARCHIVE_TYPES,
  ...CODE_TYPES.filter(t => !LOCAL_PREVIEW_TYPES.includes(t)),
  ...ADOBE_TYPES,
  ...APPLE_TYPES,
  "xps",
  "rtf"
];

export default function FileViewer({ file, theme }) {
  const [folderContents, setFolderContents] = useState(null); // array of files & dirs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zipContents, setZipContents] = useState([]);
  const [selected, setSelected] = useState(null);
  
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [zipError, setZipError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mainPreviewLoading, setMainPreviewLoading] = useState(false);
  const [hostedUrl, setHostedUrl] = useState(null);
  const [isHosting, setIsHosting] = useState(false);
  const [selectedHostedUrl, setSelectedHostedUrl] = useState(null);
  const [isHostingSelected, setIsHostingSelected] = useState(false);

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
          const errorMsg = err.response?.data?.includes('EPERM') 
            ? "Permission denied - Cannot access this folder" 
            : err.response?.data?.includes('operation not permitted')
            ? "Permission denied - Cannot access this folder"
            : "Failed to load folder contents";
          setError(errorMsg);
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

  // Clear any selected item when switching files and host file if needed
  useEffect(() => {
    setSelected(null);
    setPreviewLoading(false);
    setHostedUrl(null);
    
    // Check if file can be shown locally or needs hosting
    const isLocalPreview = LOCAL_PREVIEW_TYPES.includes(ext);
    const needsHosting = (OFFICE_TYPES.includes(ext) || GVIEW_TYPES.includes(ext)) && !isFolder && !ARCHIVE_TYPES.includes(ext);
    
    if (needsHosting) {
      setIsHosting(true);
      setMainPreviewLoading(true);
      
      hostFile(filePath)
        .then((url) => {
          setHostedUrl(url.trim());
          setIsHosting(false);
          setMainPreviewLoading(false);
        })
        .catch((err) => {
          console.error("Failed to host file:", err);
          setIsHosting(false);
          setMainPreviewLoading(false);
        });
    } else if (isLocalPreview) {
      setMainPreviewLoading(true);
      const timer = setTimeout(() => {
        setMainPreviewLoading(false);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setMainPreviewLoading(false);
    }
  }, [filePath, isFolder, ext]);

  // Set loading when selected changes and host file if needed
  useEffect(() => {
    if (selected) {
      setPreviewLoading(true);
      setSelectedHostedUrl(null);
      
      const p = selected.filePath || selected.fullPath;
      const name = p.split(/[/\\]/).pop();
      const extp = selected.isDirectory ? '' : (name.includes('.') ? name.split('.').pop().toLowerCase() : '');
      
      // Check if file needs hosting (Office or gview files)
      const needsHosting = !selected.isDirectory && (OFFICE_TYPES.includes(extp) || GVIEW_TYPES.includes(extp));
      
      if (needsHosting) {
        setIsHostingSelected(true);
        
        hostFile(p)
          .then((url) => {
            setSelectedHostedUrl(url.trim());
            setIsHostingSelected(false);
            setPreviewLoading(false);
          })
          .catch((err) => {
            console.error("Failed to host selected file:", err);
            setIsHostingSelected(false);
            setPreviewLoading(false);
          });
      } else {
        const timer = setTimeout(() => {
          setPreviewLoading(false);
        }, 350);
        return () => clearTimeout(timer);
      }
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
    
    // Show images locally
    if (IMAGE_TYPES.includes(extp)) {
      return <img src={srcp} alt={name} className="max-h-full max-w-full object-contain" onLoad={() => { setPreviewLoading(false); }} onError={() => { setPreviewLoading(false); }} />;
    }
    
    // Show videos locally
    if (VIDEO_TYPES.includes(extp)) {
      return <video src={srcp} controls className="max-h-full max-w-full" onCanPlay={() => { setPreviewLoading(false); }} />;
    }
    
    // Show audio locally
    if (AUDIO_TYPES.includes(extp)) {
      return (
        <div className="flex flex-col items-center gap-4">
          <Music className="w-12 h-12 text-accent" />
          <audio src={srcp} controls className="w-full max-w-sm" onCanPlay={() => { setPreviewLoading(false); }} />
        </div>
      );
    }
    
    // Show PDF locally
    if (extp === 'pdf') {
      return <iframe src={srcp} className="w-full h-full border-0" title="preview" onLoad={() => { setPreviewLoading(false); }} />;
    }
    
    // Show text files locally
    if (extp === 'txt' || extp === 'md' || extp === 'html' || extp === 'css' || extp === 'js' || extp === 'json' || extp === 'xml') {
      return <iframe src={srcp} className="w-full h-full bg-white dark:bg-gray-900 border-0 font-mono text-xs" style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }} onLoad={() => { setPreviewLoading(false); }} />;
    }
    
    // For Office files, use Microsoft Office Online viewer
    if (OFFICE_TYPES.includes(extp)) {
      if (isHostingSelected || !selectedHostedUrl) {
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-white text-xs">Uploading file for preview...</span>
          </div>
        );
      }
      
      // Use Microsoft Office Online viewer
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedHostedUrl)}`;
      return (
        <iframe 
          src={officeViewerUrl}
          className="w-full h-full border-0"
          title="preview"
        />
      );
    }
    
    // For gview-supported files, check if we have a hosted URL
    if (GVIEW_TYPES.includes(extp)) {
      if (isHostingSelected || !selectedHostedUrl) {
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-white text-xs">Uploading file for preview...</span>
          </div>
        );
      }
      
      // Use Google gview with the hosted URL
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(selectedHostedUrl)}&embedded=true`;
      return (
        <iframe 
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title="preview"
        />
      );
    }
    
    // File is not previewable
    return (
      <div className="flex flex-col items-center gap-2">
        <File className="w-12 h-12 text-gray-500" />
        <span className="text-gray-700 dark:text-white text-sm">This file is not previewable</span>
      </div>
    );
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
      <div className="flex flex-col gap-2 p-3 w-full h-full bg-secondary-light dark:bg-secondary rounded-lg border border-accent shadow-lg">
        <div className="flex items-center gap-2 text-accent-light dark:text-accent-light text-sm">
          <FolderOpen className="w-4 h-4" />
          <span className="font-medium">Folder Contents</span>
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-white text-sm">
            Loading...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            {folderContents && folderContents.length > 0 ? (
              <div className="flex h-full gap-2">
                <div className="w-1/2 overflow-auto">
                  <FolderTree items={folderContents} rootPath={filePath} onSelect={setSelected} selectedPath={selected?.filePath} theme={theme} />
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  {selected ? (
                    <>
                      <div className="flex-1 overflow-auto w-full flex items-center justify-center">
                        {previewLoading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-600 dark:text-white text-xs">Loading preview...</span>
                          </div>
                        ) : (
                          renderPreviewFor(selected)
                        )}
                      </div>
                      {!selected.isDirectory && (
                        <div className="w-full flex items-center gap-2 px-3 py-2 bg-primary-light dark:bg-primary border border-gray-300 dark:border-gray-700 rounded-lg text-xs shadow-md">
                          <span className="text-gray-800 dark:text-white truncate flex-1" title={selected.fullPath || selected.filePath}>{selected.name}</span>
                          <button 
                            onClick={async ()=>{await apiDeleteFile(selected.fullPath || selected.filePath);}} 
                            className="flex-shrink-0 p-1 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : <div className="text-gray-600 dark:text-white text-xs">Select a file</div>}
                </div>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-white text-xs">Folder is empty.</div>
            )}
          </div>
        )}
      </div>
    );
  } else if (ARCHIVE_TYPES.includes(ext)) {
    // For archives, present the extracted contents using the same tree UI as folders
    const zipRootPath = zipContents && zipContents.length ? getCommonPrefix(zipContents.map(c => c.filePath)) : '';
    content = (
      <div className="flex flex-col gap-2 p-3 w-full h-full bg-secondary-light dark:bg-secondary rounded-lg border border-accent shadow-lg">
        <div className="flex items-center gap-2 text-accent-light dark:text-accent-light text-sm">
          <FileArchive className="w-4 h-4" />
          <span className="font-medium">Archive Contents</span>
        </div>

        {isZipLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-white text-sm">
            Loading...
          </div>
        ) : zipError ? (
          <div className="flex-1 flex items-center justify-center text-red-500 dark:text-red-400 text-sm">
            {zipError}
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            {zipContents && zipContents.length > 0 ? (
              <div className="flex h-full gap-2">
                <div className="w-1/2 overflow-auto">
                  <FolderTree items={zipContents} rootPath={zipRootPath || filePath} onSelect={setSelected} selectedPath={selected?.fullPath || selected?.filePath} theme={theme} />
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  {selected ? (
                    <>
                      <div className="flex-1 overflow-auto w-full flex items-center justify-center">
                        {renderPreviewFor(selected)}
                      </div>

                    </>
                  ) : <div className="text-gray-600 dark:text-white text-xs">Select a file</div>}
                </div>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-white text-xs">Archive is empty.</div>
            )}
          </div>
        )}
      </div>
    );
  } else if (IMAGE_TYPES.includes(ext)) {
    // Show images locally
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
    // Show videos locally
    content = (
      <video
        src={src}
        controls
        className="max-h-full max-w-full"
        onCanPlay={() => { setMainPreviewLoading(false); }}
      />
    );
  } else if (AUDIO_TYPES.includes(ext)) {
    // Show audio locally
    content = (
      <div className="flex flex-col items-center gap-4">
        <Music className="w-12 h-12 text-accent" />
        <audio src={src} controls className="w-full max-w-sm" onCanPlay={() => { setMainPreviewLoading(false); }} />
      </div>
    );
  } else if (ext === 'pdf') {
    // Show PDF locally
    content = (
      <iframe 
        src={src} 
        className="w-full h-full border-none"
        title="PDF Preview"
        onLoad={() => { setMainPreviewLoading(false); }}
      />
    );
  } else if (ext === 'txt' || ext === 'md' || ext === 'html' || ext === 'css' || ext === 'js' || ext === 'json' || ext === 'xml') {
    // Show text/code files locally
    content = (
      <iframe 
        src={src}
        className="w-full h-full bg-white dark:bg-gray-900 border-0 font-mono text-xs"
        style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
        onLoad={() => { setMainPreviewLoading(false); }}
      />
    );
  } else if (isFolder) {
    content = (
      <div className="flex flex-col items-center justify-center">
        <FolderOpen className="w-12 h-12 text-accent mb-2" />
        <span className="text-gray-700 dark:text-white text-sm">Loading folder contents...</span>
      </div>
    );
  } else if (OFFICE_TYPES.includes(ext)) {
    // Microsoft Office files - use Office Online viewer
    if (isHosting || !hostedUrl) {
      content = (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-white text-sm">Uploading file for preview...</span>
        </div>
      );
    } else {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(hostedUrl)}`;
      content = (
        <iframe 
          src={officeViewerUrl}
          className="w-full h-full border-0"
          title="preview"
        />
      );
    }
  } else if (GVIEW_TYPES.includes(ext)) {
    // Files that need gview
    if (isHosting || !hostedUrl) {
      content = (
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-white text-sm">Uploading file for preview...</span>
        </div>
      );
    } else {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(hostedUrl)}&embedded=true`;
      content = (
        <iframe 
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title="preview"
        />
      );
    }
  } else {
    // File is not previewable
    content = (
      <div className="flex flex-col items-center justify-center">
        <FileIcon className="w-12 h-12 text-gray-500 mb-2" />
        <span className="text-gray-700 dark:text-white text-sm">This file is not previewable</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {/* Info */}
      <div className="flex-shrink-0 flex items-center gap-2 w-full px-4 py-2 text-xs bg-secondary-light dark:bg-secondary border border-gray-300 dark:border-gray-700 rounded-lg shadow-md">
        <FileIcon className={`w-4 h-4 flex-shrink-0 ${getTypeColor(ext).replace('bg-', 'text-')}`} />
        <span className="font-medium text-gray-900 dark:text-white truncate" title={filePath}>
          {truncateFilename(filePath.split(/[/\\]/).pop())}
        </span>
        <span className="text-gray-400 dark:text-gray-600">•</span>
        <span className="text-gray-600 dark:text-white shrink-0 text-xs">{formatFileSize(fileSize)}</span>
        <span className={`px-1.5 py-0.5 text-xs border rounded ${getTypeColor(ext).replace('bg-', 'border-')} ${getTypeColor(ext).replace('bg-', 'text-')}`}>
          {isFolder ? 'FOLDER' : ext.toUpperCase() || 'FILE'}
        </span>
        <button 
          className="ml-auto flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors" 
          onClick={() => navigator.clipboard.writeText(filePath)}
          title="Click to copy full path"
        >
          <Copy className="w-3 h-3" />
          <span className="hidden sm:inline">Copy</span>
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 w-full bg-secondary-light dark:bg-secondary rounded-lg p-3 border border-gray-300 dark:border-gray-800 overflow-auto shadow-md">
        <div className="flex justify-center items-center h-full">
          {mainPreviewLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-white text-sm">Loading preview...</span>
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
