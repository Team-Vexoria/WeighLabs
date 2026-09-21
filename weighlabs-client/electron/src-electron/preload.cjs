const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('windowControls', {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onMaximizeChange: (callback) => {
        const listener = (_event, isMaximized) => callback(isMaximized)
        ipcRenderer.on('window:maximize-changed', listener)
        return () => ipcRenderer.removeListener('window:maximize-changed', listener)
    }
})