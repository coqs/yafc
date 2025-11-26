import { useEffect, useState, useCallback } from "react";
import {
  getFiles,
  deleteFile as apiDeleteFile,
  keepFile as apiKeepFile,
  createSession,
  getSessionData,
  modifySessionData,
  getCurrentSessionNumber,
  deleteSession as apiDeleteSession,
} from "./api";
import { getFileSize } from "./api";
import FileViewer from "./components/FileViewer";
import { FolderOpen, Trash2, Check, Keyboard, Plus, Upload, Trophy, RotateCcw } from "lucide-react";

export default function App() {
  const [appState, setAppState] = useState("sessionSelect"); // sessionSelect, cleaning, completed
  const [folderPath, setFolderPath] = useState(
    localStorage.getItem("yafc:lastFolder") || ""
  );
  const [newFolderPath, setNewFolderPath] = useState("");
  const [files, setFiles] = useState([]);
  const [current, setCurrent] = useState(0);
  const [deleted, setDeleted] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Fetch all sessions on mount and auto-refresh every 500ms
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const totalSessions = await getCurrentSessionNumber();
        const sessionsList = [];
        for (let i = 0; i < totalSessions; i++) {
          const data = await getSessionData(i);
          sessionsList.push({ number: i, ...data });
        }
        setSessions(sessionsList);
      } catch (err) {
        console.error("Failed to fetch sessions:", err.message);
      }
    };

    fetchSessions();

    // Auto-refresh sessions every 500ms when on session select screen
    const interval = setInterval(() => {
      if (appState === "sessionSelect") {
        fetchSessions();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [appState]);

  const handleCreateNewSession = async () => {
    if (!newFolderPath.trim()) {
      alert("Please enter a folder path");
      return;
    }
    setLoading(true);
    try {
      const fetched = await getFiles(newFolderPath);
      setFiles(fetched);
      setCurrent(0);
      setDeleted(0);
      setFolderPath(newFolderPath);
      localStorage.setItem("yafc:lastFolder", newFolderPath);

      // Create a new session with the folder path
      const newSessionNumber = await createSession(newFolderPath);
      setSessionNumber(newSessionNumber);
      setAppState("cleaning");
    } catch (err) {
      alert("Failed to create session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = async (sessionNum) => {
    setLoading(true);
    try {
      const sessionData = await getSessionData(sessionNum);
      const fetched = await getFiles(sessionData.path);
      setFiles(fetched);
      setFolderPath(sessionData.path);
      setSessionNumber(sessionNum);
      setDeleted(sessionData.deletedFiles?.length || 0);

      // Resume from last file position if available
      if (sessionData.lastFilePathLeftOn) {
        const lastFileIndex = fetched.findIndex(f => f.filePath === sessionData.lastFilePathLeftOn);
        if (lastFileIndex !== -1) {
          setCurrent(lastFileIndex);
        } else {
          setCurrent(0);
        }
      } else {
        setCurrent(0);
      }

      setAppState("cleaning");
    } catch (err) {
      alert("Failed to load session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSessions = () => {
    setAppState("sessionSelect");
    setFiles([]);
    setCurrent(0);
    setDeleted(0);
    setSessionNumber(null);
    setNewFolderPath("");
  };

  const handleDeleteSession = async (sessionNum) => {
    if (confirm("Are you sure you want to delete this session? This cannot be undone.")) {
      try {
        await apiDeleteSession(sessionNum);
        // Refresh sessions list
        const totalSessions = await getCurrentSessionNumber();
        const sessionsList = [];
        for (let i = 0; i < totalSessions; i++) {
          const data = await getSessionData(i);
          sessionsList.push({ number: i, ...data });
        }
        setSessions(sessionsList);
      } catch (err) {
        alert("Failed to delete session: " + err.message);
      }
    }
  };

  const nextFile = useCallback(async () => {
    const nextIndex = Math.min(current + 1, files.length - 1);

    // Check if we've reached the end
    if (nextIndex === current && current === files.length - 1) {
      // All files processed - show completion screen
      if (sessionNumber !== null) {
        const sessionData = await getSessionData(sessionNumber);
        
        // Calculate total deleted size from stored file sizes
        let totalDeletedSize = 0;
        for (const fileObj of sessionData.deletedFiles || []) {
          // Handle both old format (string path) and new format (object with size)
          const size = typeof fileObj === 'object' ? fileObj.size : 0;
          totalDeletedSize += size || 0;
        }

        setCompletionStats({
          totalDeleted: sessionData.deletedFiles?.length || 0,
          totalKept: sessionData.keptFiles?.length || 0,
          totalDeletedSize: totalDeletedSize,
          formattedSize: formatFileSize(totalDeletedSize)
        });
        setAppState("completed");
      }
    } else {
      setCurrent(nextIndex);
    }
  }, [files, current, sessionNumber, formatFileSize]);

  const handleDelete = useCallback(async () => {
    if (!files[current]) return;

    try {
      await apiDeleteFile(files[current].filePath);
      setDeleted((prev) => prev + 1);

      // Update session with deleted file and last file position
      if (sessionNumber !== null) {
        const sessionData = await getSessionData(sessionNumber);
        if (!sessionData.deletedFiles) sessionData.deletedFiles = [];
        // Store file object with path and size
        sessionData.deletedFiles.push({
          filePath: files[current].filePath,
          size: files[current].fileSize || 0
        });
        sessionData.lastFilePathLeftOn = files[current + 1]?.filePath || files[current].filePath;
        await modifySessionData(sessionData, sessionNumber);
      }

      nextFile();
    } catch (err) {
      alert("Failed to delete file: " + err.message);
    }
  }, [files, current, nextFile, sessionNumber]);

  const handleKeep = useCallback(async () => {
    if (!files[current]) return;

    try {
      await apiKeepFile(files[current].filePath);

      // Update session with kept file and last file position
      if (sessionNumber !== null) {
        const sessionData = await getSessionData(sessionNumber);
        if (!sessionData.keptFiles) sessionData.keptFiles = [];
        // Store file object with path and size
        sessionData.keptFiles.push({
          filePath: files[current].filePath,
          size: files[current].fileSize || 0
        });
        sessionData.lastFilePathLeftOn = files[current + 1]?.filePath || files[current].filePath;
        await modifySessionData(sessionData, sessionNumber);
      }

      nextFile();
    } catch (err) {
      alert("Failed to keep file: " + err.message);
    }
  }, [files, current, nextFile, sessionNumber]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Disable shortcuts when not in cleaning state or no files
      if (appState !== "cleaning" || !files.length) return;

      switch (e.key.toLowerCase()) {
        case 'k':
          handleKeep();
          break;
        case 'd':
          handleDelete();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [appState, files, handleKeep, handleDelete]);

  return (
    <div className="h-screen bg-nord0 text-nord6 font-mono flex flex-col overflow-hidden">
      {appState === "completed" ? (
        // Completion Screen
        <div className="flex flex-col h-full items-center justify-center px-6">
          <div className="text-center max-w-2xl">
            {/* Trophy Icon */}
            <div className="mb-6 flex justify-center">
              <Trophy className="w-24 h-24 text-nord13 animate-bounce" />
            </div>

            {/* Congratulations Message */}
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-nord8 to-nord9 bg-clip-text text-transparent">
              Congratulations!
            </h1>
            <p className="text-xl text-nord5 mb-8">
              You've cleaned your files
            </p>

            {/* Stats */}
            {completionStats && (
              <div className="bg-nord1 border border-nord2 rounded-lg p-8 mb-8">
                <div className="grid grid-cols-3 gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-nord11 mb-2">
                      {completionStats.totalDeleted}
                    </div>
                    <p className="text-nord4">Files Deleted</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-nord14 mb-2">
                      {completionStats.totalKept}
                    </div>
                    <p className="text-nord4">Files Kept</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-nord13 mb-2">
                      {completionStats.formattedSize}
                    </div>
                    <p className="text-nord4">Space Freed</p>
                  </div>
                </div>

                <div className="border-t border-nord2 pt-4">
                  <p className="text-nord4 text-sm">
                    Total Files Processed: <span className="text-nord6 font-semibold">{completionStats.totalDeleted + completionStats.totalKept}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleBackToSessions}
                className="px-8 py-3 bg-nord8 hover:bg-nord9 text-nord0 rounded font-medium transition-colors duration-300 flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      ) : appState === "sessionSelect" ? (
        // Session Selection Screen
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-6 border-b border-nord2 flex-shrink-0">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-nord8 to-nord9 bg-clip-text text-transparent">
              YAFC
            </h1>
            <p className="text-nord4 text-sm">Yet Another File Cleaner</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Create New Session */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-nord8">Create New Session</h2>
                <div className="bg-nord1 border border-nord2 rounded p-6">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newFolderPath}
                        onChange={(e) => setNewFolderPath(e.target.value)}
                        placeholder="Enter folder path to clean..."
                        className="w-full px-4 py-3 bg-nord2 border border-nord3 rounded text-nord6 placeholder-nord4 focus:outline-none focus:border-nord8 focus:ring-1 focus:ring-nord8 transition-colors text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateNewSession()}
                        disabled={loading}
                      />
                    </div>
                    <button
                      onClick={handleCreateNewSession}
                      disabled={loading}
                      className="px-6 py-3 bg-nord8 hover:bg-nord9 disabled:bg-nord3 text-nord0 rounded font-medium transition-colors duration-300 flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {loading ? "Loading..." : "Create"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Load Existing Sessions */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-nord8">
                  Load Existing Session {sessions.length > 0 && `(${sessions.length})`}
                </h2>
                {sessions.length > 0 ? (
                  <div className="grid gap-3">
                    {sessions.map((session) => (
                      <div
                        key={session.number}
                        className="w-full bg-nord1 border border-nord2 hover:border-nord8 rounded p-4 transition-all duration-300 flex items-center justify-between group"
                      >
                        <button
                          onClick={() => handleLoadSession(session.number)}
                          disabled={loading}
                          className="flex-1 text-left hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                          <div className="text-nord8 font-semibold mb-1">
                            Session #{session.number}
                          </div>
                          <div className="text-nord4 text-sm mb-2">
                            Path: <span className="text-nord5">{session.path}</span>
                          </div>
                          <div className="flex gap-4 text-xs text-nord4">
                            <span>Deleted: <span className="text-nord11">{session.deletedFiles?.length || 0}</span></span>
                            <span>Kept: <span className="text-nord14">{session.keptFiles?.length || 0}</span></span>
                          </div>
                        </button>
                        <div className="flex gap-2 ml-4">
                          <Upload className="w-5 h-5 text-nord4 group-hover:text-nord8 transition-colors" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.number);
                            }}
                            disabled={loading}
                            className="p-1 hover:bg-nord11 rounded transition-colors disabled:opacity-50"
                            title="Delete session"
                          >
                            <Trash2 className="w-5 h-5 text-nord4 hover:text-nord6 transition-colors" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-nord1 border border-nord2 rounded p-8 text-center">
                    <p className="text-nord4">No existing sessions. Create one to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Cleaning Screen
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-6 border-b border-nord2 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-nord8 to-nord9 bg-clip-text text-transparent">
                  YAFC
                </h1>
                <p className="text-nord4 text-sm">Session #{sessionNumber} • {folderPath}</p>
              </div>
              <button
                onClick={handleBackToSessions}
                className="px-4 py-2 bg-nord2 hover:bg-nord3 text-nord6 rounded font-medium transition-colors duration-300 text-sm"
              >
                Back to Sessions
              </button>
            </div>

            {/* Keyboard Shortcuts Info */}
            {files.length > 0 && (
              <div className="mt-3 flex items-center gap-4 text-xs text-nord4">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-3 h-3" />
                  <span>Shortcuts:</span>
                </div>
                <div className="flex gap-3">
                  <span className="px-2 py-1 bg-nord2 border border-nord3 rounded">
                    <kbd className="font-bold text-nord6">K</kbd> = Keep
                  </span>
                  <span className="px-2 py-1 bg-nord2 border border-nord3 rounded">
                    <kbd className="font-bold text-nord6">D</kbd> = Delete
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* File Viewer Section */}
          {files.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col px-4 py-4 gap-3">
              {/* Stats Bar */}
              <div className="flex-shrink-0 flex justify-between items-center px-4 py-2 bg-nord1 border border-nord2 rounded text-xs">
                <div className="flex gap-4">
                  <span className="text-nord4">
                    File <span className="text-nord6 font-semibold">{current + 1}</span>/<span className="text-nord6 font-semibold">{files.length}</span>
                  </span>
                  <span className="text-nord3">•</span>
                  <span className="text-nord4">
                    Deleted: <span className="text-nord11 font-semibold">{deleted}</span>
                  </span>
                  <span className="text-nord3">•</span>
                  <span className="text-nord4">
                    Remaining: <span className="text-nord8 font-semibold">{files.length - current - 1}</span>
                  </span>
                  <span className="text-nord3">•</span>
                  <span className="text-nord3">
                    {Math.round(((current + 1) / files.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* File Preview */}
              <div className="flex-1 overflow-hidden">
                <FileViewer file={files[current]} />
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex gap-3 justify-center">
                <button
                  onClick={handleKeep}
                  className="group px-6 py-2 bg-nord2 hover:bg-nord14 border-2 border-nord3 hover:border-nord14 rounded font-medium transition-all duration-300 flex items-center gap-2 text-xs"
                >
                  <Check className="w-3 h-3 text-nord4 group-hover:text-nord0 transition-colors" />
                  <span className="text-nord4 group-hover:text-nord0 transition-colors">Keep</span>
                  <span className="text-xs text-nord3 group-hover:text-nord0 transition-colors">(K)</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="group px-6 py-2 bg-nord2 hover:bg-nord11 border-2 border-nord3 hover:border-nord11 rounded font-medium transition-all duration-300 flex items-center gap-2 text-xs"
                >
                  <Trash2 className="w-3 h-3 text-nord4 group-hover:text-nord0 transition-colors" />
                  <span className="text-nord4 group-hover:text-nord0 transition-colors">Delete</span>
                  <span className="text-xs text-nord3 group-hover:text-nord0 transition-colors">(D)</span>
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <FolderOpen className="w-16 h-16 text-nord3 mb-4" />
              <p className="text-nord4">Loading files...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
