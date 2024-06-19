const { app, BrowserWindow, ipcMain } = require('electron')
const { addPoint, getPoints } = require('./src/db')
const path = require('node:path');
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

app.whenReady().then(() => {
  ipcMain.handle('getPoints', async () => { return await getPoints() })
  ipcMain.handle('addPoint', async (_, username, x, y, icon) => { await addPoint(username, x, y, icon) })
  createWindow()
})