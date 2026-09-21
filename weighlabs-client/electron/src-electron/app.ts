// Entry point of the electron app.
import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import 'dotenv/config'
import path from 'node:path'

// set true before building for production
const isDev = true
const FRONTEND_URL = process.env.FRONTEND_URL


app.on("ready", () => {
    const window = new BrowserWindow({
        minWidth: 1280,
        minHeight: 720,
        frame: false,
        autoHideMenuBar: true,
        icon: "/images/icon.png",
        webPreferences: {
            preload: path.join(import.meta.dirname, "preload.cjs")
        }
    })
    nativeTheme.themeSource = "dark"

    // CUSTOM WINDOW CONTROLS
    ipcMain.on('window:minimize', (event) => {
        BrowserWindow.fromWebContents(event.sender)?.minimize()
    })
    ipcMain.on('window:toggle-maximize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return
        if (win.isMaximized()) {
            win.unmaximize()
        } else {
            win.maximize()
        }
    })
    ipcMain.on('window:close', (event) => {
        BrowserWindow.fromWebContents(event.sender)?.close()
    })
    ipcMain.handle('window:is-maximized', (event) => {
        return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
    })

    const notifyMaximizeState = () => {
        if (!window.isDestroyed()) {
            window.webContents.send('window:maximize-changed', window.isMaximized())
        }
    }
    window.on('maximize', notifyMaximizeState)
    window.on('unmaximize', notifyMaximizeState)

    
    if (isDev) {
        // Load URL for HMR during development
        window.loadURL(FRONTEND_URL!)
    } else {
        // LOAD Local File in Production
        window.loadFile(path.join(import.meta.dirname, "../dist/index.html"))
    }
})