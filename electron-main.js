const { app, BrowserWindow, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;
let widgetWindow = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Hide dock icon (macOS) - we want it to be a menu bar app
if (process.platform === 'darwin') {
  app.dock.hide();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 640,
    show: false,
    frame: false,
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    skipTaskbar: true,
  });

  // Load the app (dev or prod)
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  // Hide window when it loses focus
  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });
}

function createWidgetWindow() {
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

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'dist/index.html')}`;
  // Load the widget mode route
  // For file:// protocol, query parameters might need hash router or special handling, 
  // but for simplicity in this environment we'll try appending. 
  // Note: file:// URLs with query params can be tricky. 
  // A robust solution uses HashRouter in React.
  widgetWindow.loadURL(`${startUrl}?mode=widget`);

  // Position widget at top right of primary display (example position)
  // You can adjust x/y to place it where you want on the desktop
  widgetWindow.setPosition(width - 240, 40);
}

function createTray() {
  // Placeholder icon - user will replace this
  // We try to load 'butterfly.svg' from the public folder or root
  // For development, we can use a simple nativeImage createFromPath
  
  let iconPath = path.join(__dirname, 'public', 'butterfly.svg'); // Try public folder first
  
  // Create a native image
  let image = nativeImage.createFromPath(iconPath);

  if (image.isEmpty()) {
    // Fallback: try root directory
    iconPath = path.join(__dirname, 'butterfly.svg');
    image = nativeImage.createFromPath(iconPath);
  }

  if (image.isEmpty()) {
    console.log('Warning: butterfly.svg not found. Tray icon will be empty.');
    // Create an empty image to prevent crash, or use a system icon if possible
    // For now, we proceed with the empty image, it will just be a blank space in the tray
  } else {
    // Resize for tray (usually 16x16 or 22x22)
    image = image.resize({ width: 16, height: 16 });
  }

  tray = new Tray(image);
  tray.setToolTip('Salary Receipt');
  
  tray.on('click', (event, bounds) => {
    // Toggle Main Window
    const { x, y } = bounds;
    const { height: windowHeight, width: windowWidth } = mainWindow.getBounds();

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      const yPosition = process.platform === 'darwin' ? y : y - windowHeight;
      // Center horizontally relative to click, but keep on screen
      // Simple positioning:
      mainWindow.setBounds({
        x: Math.round(x - windowWidth / 2),
        y: Math.round(y + 5), // Slight offset
        height: windowHeight,
        width: windowWidth
      });
      mainWindow.show();
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

app.whenReady().then(() => {
  createMainWindow();
  createWidgetWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createWidgetWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. 
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
