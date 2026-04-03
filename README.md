# YAFC - Yet Another File Cleaner

A modern file management tool with session-based cleaning, featuring a sleek dark/light mode interface and advanced file preview capabilities.

## Features

### Core Features
- **Session management** - Create, load, and delete cleaning sessions
- **Native folder picker** - Browse and select folders using your system's file explorer
- **File preview system** - Preview files directly in the app:
  - Local preview for images, videos, audio, PDFs, and text files
  - Microsoft Office Online viewer for Word, Excel, PowerPoint files
  - Google Docs viewer for other supported formats
  - Archive exploration (ZIP, RAR, 7z, etc.) with nested file preview
- **Keyboard shortcuts** - Quick file operations with K (keep) and D (delete)
- **Navigation controls** - Back/forward buttons and direct file number navigation
- **Completion statistics** - Track deleted files, kept files, and space freed
- **Resume support** - Pick up where you left off with automatic session resume

### UI Features
- **Dark/Light mode** - Toggle between themes with persistent preference
- **Modern design** - Clean interface with custom color scheme:
  - Primary: #191919 (dark) / #F5F5F5 (light)
  - Secondary: #1D211C (dark) / #FFFFFF (light)
  - Accent: #314B3C (dark) / #4A7C59 (light)
- **Responsive layout** - Optimized for different screen sizes
- **Real-time updates** - Auto-refresh session list every 500ms

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
   - Click "Browse" to open your system's folder picker, OR
   - Manually enter a folder path
   - Click "Create New Session"

2. **Navigate and clean files**
   - Use keyboard shortcuts:
     - **K** - Keep the current file
     - **D** - Delete the current file
   - Use navigation:
     - Back/Next arrows to move between files
     - Type a file number to jump directly to any file
   - Preview files before deciding

3. **View progress**
   - Track deleted/kept files count in real-time
   - See completion percentage
   - View space freed when done

4. **Session management**
   - Load existing sessions from the dashboard
   - Delete unwanted sessions
   - Resume from where you left off

## File Preview Support

### Local Preview (No Upload Required)
- **Images**: jpg, jpeg, png, gif, webp, svg, tiff, bmp
- **Videos**: mp4, webm, mov, avi, wmv, mkv, 3gpp, flv, ogg
- **Audio**: mp3, wav, ogg, opus, mpeg
- **Documents**: pdf
- **Text/Code**: txt, md, html, css, js, json, xml

### Microsoft Office Online Viewer
- **Word**: doc, docx
- **Excel**: xls, xlsx
- **PowerPoint**: ppt, pptx

### Google Docs Viewer
- **Archives**: zip, rar, 7z, tar, gz (with nested file exploration)
- **Code files**: php, c, cpp, h, hpp, java, py
- **Adobe files**: dxf, ai, psd, eps, ps, ttf
- **Apple files**: key, numbers
- **Other**: xps, rtf

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| **K** | Keep current file |
| **D** | Delete current file |

## API endpoints

### File operations

- `POST /getFiles` - Get files in a folder
- `POST /getFolderRoots` - Recursively get all files in a folder
- `POST /getZIPcontainments` - Extract and list archive contents
- `POST /deleteFile` - Delete a file or folder
- `POST /keepFile` - Mark a file as kept (no-op)
- `POST /getFileSize` - Get file size
- `POST /hostFile` - Upload file to catbox.moe for public preview
- `POST /selectFolder` - Open native folder picker dialog
- `GET /file` - Download/view file content

### Session management

- `POST /createSession` - Create a new session
- `POST /getSessionData` - Get session data
- `POST /modifySessionData` - Update session data
- `POST /getCurrentSessionNumber` - Get total session count
- `POST /deleteSession` - Delete a session
- `POST /saveToSessions` - Save data to sessions

## Project structure

```
yafc/
├── server/
│   ├── database/
│   │   └── sessions.json      # Session storage
│   ├── temp_files/            # Temporary file storage & extracted archives
│   ├── main.js               # Express server
│   ├── sessions.js           # Session management logic
│   └── fileSystem.js         # File system operations
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── api.js            # API client
│   │   ├── index.css         # Global styles
│   │   └── components/
│   │       ├── FileViewer.jsx  # File preview component
│   │       └── FolderTree.jsx  # Folder tree navigation
│   ├── tailwind.config.cjs   # Tailwind configuration
│   └── package.json
└── README.md
```

## Safety features

- **Confirmation dialogs** - Required for session deletion
- **Error handling** - Graceful handling of file operation errors and permissions
- **Session backup** - All session data is preserved until manually deleted
- **Resume capability** - Never lose your progress
- **Permission warnings** - Clear messages for protected system folders

## Troubleshooting

### Common issues

1. **"Permission denied" error**
   - Windows protects certain system folders (My Documents, My Videos, etc.)
   - Try running as administrator or select a different folder
   - Choose folders you have full access to

2. **File preview not loading**
   - Check your internet connection (required for Office/Google viewers)
   - Ensure the file is uploaded successfully to catbox.moe
   - Some file types may not be supported by the viewers

3. **Session not loading**
   - Verify the session data in `sessions.json`
   - Check if the folder path still exists
   - Ensure you have read permissions for the folder

### Development tips

- The frontend auto-refreshes the session list every 500ms
- Session data includes file sizes for accurate space calculations
- The tool handles both files and directories seamlessly
- All file operations are logged in the server console
- Theme preference is saved in localStorage

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS, Axios, Lucide Icons
- **Backend**: Node.js, Express, extract-zip
- **File Hosting**: Catbox.moe (Litterbox) for temporary public file hosting
- **Preview Services**: Microsoft Office Online, Google Docs Viewer

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

