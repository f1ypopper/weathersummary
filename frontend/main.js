const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 950,
    height: 630
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})