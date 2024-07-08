const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('db', {
  getPoints: ()=>ipcRenderer.invoke('getPoints'),
  addPoint: (...args)=>ipcRenderer.invoke('addPoint',...args)
})
contextBridge.exposeInMainWorld('notify', {
  showNotification: (...args)=>ipcRenderer.invoke('showNotification',...args)
})
