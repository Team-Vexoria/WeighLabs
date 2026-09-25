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

contextBridge.exposeInMainWorld('tests', {
    list: () => ipcRenderer.invoke('tests:list'),
    get: (id) => ipcRenderer.invoke('tests:get', id),
    create: (input) => ipcRenderer.invoke('tests:create', input),
    update: (id, patch) => ipcRenderer.invoke('tests:update', id, patch),
    remove: (id) => ipcRenderer.invoke('tests:delete', id),
    complete: (input) => ipcRenderer.invoke('tests:complete', input),
})

contextBridge.exposeInMainWorld('nawi', {
    start: (config) => ipcRenderer.invoke('nawi:start', config ?? null),
    pause: () => ipcRenderer.invoke('nawi:pause'),
    resume: () => ipcRenderer.invoke('nawi:resume'),
    stop: () => ipcRenderer.invoke('nawi:stop'),
    onFrame: (callback) => {
        const listener = (_event, frame) => callback(frame)
        ipcRenderer.on('nawi:frame', listener)
        return () => ipcRenderer.removeListener('nawi:frame', listener)
    },
    onStatus: (callback) => {
        const listener = (_event, status) => callback(status)
        ipcRenderer.on('nawi:status', listener)
        return () => ipcRenderer.removeListener('nawi:status', listener)
    },
})

contextBridge.exposeInMainWorld('reports', {
    exportPdf: (input) => ipcRenderer.invoke('report:export-pdf', input),
    exportCsv: (input) => ipcRenderer.invoke('report:export-csv', input),
    exportDocx: (input) => ipcRenderer.invoke('report:export-docx', input),
})

contextBridge.exposeInMainWorld('theme', {
    set: (theme) => ipcRenderer.invoke('theme:set', theme),
})