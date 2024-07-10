const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const { addPoint, getPoints } = require('./src/db')
const path = require('node:path');
const fs = require('node:fs');
const createWindow = () => {
  const win = new BrowserWindow({
    width: 950,
    height: 630,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

function createNotification(title, body) {
  new Notification({ title: title, body: body }).show();
}
app.whenReady().then(() => {
  app.setAppUserModelId(process.execPath);
  ipcMain.handle('getPoints', async () => { return await getPoints() });
  ipcMain.handle('addPoint', async (_, username, x, y, icon) => { await addPoint(username, x, y, icon) });
  ipcMain.handle('showNotification', async (_, title, body) => { createNotification(title, body) });
  ipcMain.handle('readFileToBlob',(_, path) => {
    try {
      const data = fs.readFileSync(path);
      //const blob = new Blob([data]);
      //return blob;
      return data;
    } catch (err) {
      console.error(err);
    }
  });
  createWindow()
})