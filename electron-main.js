const { app, BrowserWindow, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');
const { startServer } = require('./electron-server');

let tray = null;
let mainWindow = null;
let widgetWindow = null;
let serverProcess = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Hide dock icon (macOS) - we want it to be a menu bar app
if (process.platform === 'darwin') {
  app.dock.hide();
}

function createMainWindow(port) {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 640,
    show: false,
    frame: false,
    resizable: false,
    fullscreenable: false,
    center: true, // Center the window
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    skipTaskbar: true,
  });

  // Load the app (dev or prod)
  // In dev, we load localhost:3000 (Vite dev server)
  // In prod, we load localhost:port (Internal Express server)
  const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${port}`;
  
  mainWindow.loadURL(startUrl).catch(err => {
    console.error('Failed to load main window URL:', err);
    // Retry after a short delay if server is still starting
    setTimeout(() => mainWindow.loadURL(startUrl), 1000);
  });

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Hide window when it loses focus, instead of closing
  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  // Prevent closing, just hide
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
  
  // Open DevTools in dev mode or if needed for debugging
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

function createWidgetWindow(port) {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  widgetWindow = new BrowserWindow({
    width: 220,
    height: 140,
    type: 'desktop', // Keeps it on the desktop level on some platforms
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: false, // Widget should be on desktop
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    skipTaskbar: true,
  });

  const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${port}`;
  // Load the widget mode route
  // Now we use query params because we are loading from http server
  widgetWindow.loadURL(`${startUrl}?mode=widget`).catch(err => {
     console.error('Failed to load widget window URL:', err);
     setTimeout(() => widgetWindow.loadURL(`${startUrl}?mode=widget`), 1000);
  });

  // Position widget at top right of primary display (example position)
  // You can adjust x/y to place it where you want on the desktop
  widgetWindow.setPosition(width - 240, 40);
}

function createTray() {
  // Try to load 'butterfly.png' from the public folder or root
  let iconPath = path.join(__dirname, 'public', 'butterfly.png');
  let image = nativeImage.createFromPath(iconPath);

  if (image.isEmpty()) {
    // Fallback: try root directory
    iconPath = path.join(__dirname, 'butterfly.png');
    image = nativeImage.createFromPath(iconPath);
  }

  if (image.isEmpty()) {
    // Fallback: try svg
    iconPath = path.join(__dirname, 'public', 'butterfly.svg');
    image = nativeImage.createFromPath(iconPath);
  }

  if (image.isEmpty()) {
    console.log('Warning: butterfly icon not found. Creating empty tray.');
    // Create a 1x1 transparent image to avoid crash
    image = nativeImage.createFromBuffer(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } else {
    // Resize for tray (usually 16x16 or 22x22)
    image = image.resize({ width: 22, height: 22 });
    image.setTemplateImage(true); // macOS template image
  }

  tray = new Tray(image);
  tray.setToolTip('Salary Receipt');
  
  tray.on('click', (event, bounds) => {
    // Toggle Windows
    const isMainVisible = mainWindow.isVisible();
    
    if (isMainVisible) {
      mainWindow.hide();
      if (widgetWindow) widgetWindow.hide();
    } else {
      // Center the main window
      mainWindow.center();
      mainWindow.show();
      
      // Show widget window too if it exists
      if (widgetWindow) {
        // Position widget at top right
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width } = primaryDisplay.workAreaSize;
        widgetWindow.setPosition(width - 240, 40);
        widgetWindow.show();
      }
    }
  });

  tray.on('right-click', () => {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Quit', click: () => {
        app.isQuitting = true;
        app.quit();
      }}
    ]);
    tray.popUpContextMenu(contextMenu);
  });
}

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.whenReady().then(async () => {
  try {
    // Start the internal server
    const { server, port } = await startServer();
    serverProcess = server;
    console.log('Internal server started on port:', port);

    createMainWindow(port);
    createWidgetWindow(port);
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(port);
        createWidgetWindow(port);
      }
    });
  } catch (err) {
    console.error('Failed to start internal server:', err);
    app.quit();
  }
});

// Quit when all windows are closed, except on macOS. 
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
