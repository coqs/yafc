# YAFC - Yet Another File Cleaner

A powerful file management tool with session-based cleaning, allowing you to efficiently organize and clean up your files while keeping track of your progress.

## Features

- 🗂️ **Session management** - Create, load, and delete cleaning sessions
- 📁 **File system navigation** - Browse through files and folders
- ⌨️ **Keyboard shortcuts** - Quick file operations with K (keep) and D (delete)
- 📊 **Completion statistics** - Track deleted files, kept files, and space freed
- 🔄 **Resume support** - Pick up where you left off with automatic session resume
- 🗑️ **Directory deletion** - Delete both files and entire folders
- 🎯 **Auto-refresh dashboard** - Live session list updates

## Installation

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/coqs/yafc.git
   cd yafc
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## Usage

### Starting the application

1. **Start the backend server** (from the `server` directory):
   ```bash
   node main.js
   ```
   The server will start on port 3125.

2. **Start the frontend** (from the `frontend` directory):
   ```bash
   npm run dev
   ```
   The frontend will open in your browser (usually at http://localhost:5173).

### Basic workflow

1. **Create a new session**
   - Enter a folder path you want to clean
   - Click "Create New Session"

2. **Clean files**
   - Use keyboard shortcuts:
     - **K** - Keep the current file
     - **D** - Delete the current file
   - Or use the on-screen buttons

3. **View progress**
   - Track deleted files count
   - See completion statistics when done
   - Space freed calculation

4. **Session management**
   - Load existing sessions from the dashboard
   - Delete unwanted sessions
   - Resume from where you left off

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| **K** | Keep current file |
| **D** | Delete current file |

## Session data

Sessions are stored in `server/database/sessions.json` and include:

```json
{
  "sessionNumber": 0,
  "path": "C:\\path\\to\\folder",
  "deletedFiles": [
    {
      "filePath": "C:\\path\\to\\file.txt",
      "size": 1024
    }
  ],
  "keptFiles": [
    {
      "filePath": "C:\\path\\to\\kept.txt", 
      "size": 2048
    }
  ],
  "filesLeft": [],
  "lastFilePathLeftOn": "C:\\path\\to\\next.txt"
}
```

## API endpoints

### File operations

- `POST /getFiles` - Get files in a folder
- `POST /deleteFile` - Delete a file or folder
- `POST /keepFile` - Mark a file as kept (no-op)
- `POST /getFileSize` - Get file size
- `GET /file` - Download/view file content

### Session management

- `POST /createSession` - Create a new session
- `POST /getSessionData` - Get session data
- `POST /modifySessionData` - Update session data
- `POST /getCurrentSessionNumber` - Get total session count
- `POST /deleteSession` - Delete a session

## Project structure

```
yafc/
├── server/
│   ├── database/
│   │   └── sessions.json      # Session storage
│   ├── temp_files/            # Temporary file storage
│   ├── main.js               # Express server
│   ├── sessions.js           # Session management logic
│   └── fileSystem.js         # File system operations
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── api.js            # API client
│   │   └── components/
│   │       ├── FileViewer.jsx
│   │       └── FolderTree.jsx
│   └── package.json
└── README.md
```

## Safety features

- **Confirmation dialogs** - Required for session deletion
- **Error handling** - Graceful handling of file operation errors
- **Session backup** - All session data is preserved until manually deleted
- **Resume capability** - Never lose your progress

## Troubleshooting

### Common issues

1. **"Operation not permitted" error**
   - Make sure you have the necessary permissions to delete files
   - For directories, the tool will delete recursively

2. **File size shows as 0**
   - Ensure the backend `getFileSize` endpoint is working
   - Check that files have proper read permissions

3. **Session not loading**
   - Verify the session data in `sessions.json`
   - Check if the folder path still exists

### Development tips

- The frontend auto-refreshes the session list every 500ms
- Session data includes file sizes for accurate space calculations
- The tool handles both files and directories seamlessly
- All file operations are logged in the server console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have suggestions, please:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the server console for error messages

---

**Happy cleaning! 🧹**
