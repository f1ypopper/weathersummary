const { app, BrowserWindow, ipcMain } = require('electron')
const { Sequelize, DataTypes } = require('sequelize');
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

const sequelize = new Sequelize('postgres://postgres:newpass1@localhost:5432/mappy')
let GeoPoint;
sequelize.authenticate().then(() => {
  GeoPoint = sequelize.define(
    'GeoPoint',
    {
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      x: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      y: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }
  )
  GeoPoint.sync().then(() => {
  });
});
async function getPoints() {
  const points = await GeoPoint.findAll();
  return JSON.parse(JSON.stringify(points));
}

async function addPoint(username, x, y, icon) {
  await GeoPoint.create({ userName: username, x: x, y: y, icon: icon });
  return {username: username, x: x, y: y, icon: icon};
}

app.whenReady().then(() => {
  ipcMain.handle('getPoints', async () => { return await getPoints() })
  ipcMain.handle('addPoint', async (_,username, x, y, icon) => { await addPoint(username, x, y, icon) })
  createWindow()
})