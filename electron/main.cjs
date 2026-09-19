const { app, BrowserWindow } = require('electron');
const path = require('path');
const steamworks = require('steamworks.js');
const isDev = process.env.NODE_ENV !== 'production';

let steamClient;
try {
  steamClient = steamworks.init(480);
  console.log(`Steamworks Initialized! Player: ${steamClient.localplayer.getName()}`);
} catch (e) {
  console.warn("WARNING: Steam is not running or initialization failed.", e.message);
}
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "Xcopy Fun",
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setMenuBarVisibility(false);

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
