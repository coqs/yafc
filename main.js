const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let serverProcess;

function startServer() {
  try {
    // Try to fork directly first (works when not packaged or with asar unpacking)
    const serverPath = path.join(__dirname, 'server', 'main.js');
    const serverDir = path.join(__dirname, 'server');
    
    console.log('Starting server...');
    console.log('Server path:', serverPath);
    console.log('App is packaged:', app.isPackaged);
    
    // Use fork to spawn the server in a separate Node process
    serverProcess = fork(serverPath, [], {
      cwd: serverDir,
      silent: false,
      env: { ...process.env },
    });

    serverProcess.on('message', (msg) => {
      console.log('[Server Message]', msg);
    });

    serverProcess.on('error', (err) => {
      console.error('[Server Error]', err);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`[Server] exited with code ${code}, signal ${signal}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Needed if your frontend uses Node features
    },
  });

  // Load index.html from frontend/dist
  const indexPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
  const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
  mainWindow.loadURL(fileUrl);

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startServer();
  // Wait a moment for server to start before creating window
  setTimeout(createWindow, 1500);
});

// Quit app when all windows closed
app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
