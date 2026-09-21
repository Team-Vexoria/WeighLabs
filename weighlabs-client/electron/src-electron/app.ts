// Entry point of the electron app.
import { app, BrowserWindow } from 'electron'
import 'dotenv/config'
import 'node:path'
import path from 'node:path'
import { nativeTheme } from 'electron/main'

// set true before building for production
const isDev = true
const FRONTEND_URL = process.env.FRONTEND_URL


app.on("ready", () => {
    const window = new BrowserWindow({
        minWidth: 1280,
        minHeight: 720,
        frame: true,
        icon: "/images/icon.png"
    })
    nativeTheme.themeSource = "dark"

    
    if (isDev) {
        // Load URL for HMR during development
        window.loadURL(FRONTEND_URL!)
    } else {
        // LOAD Local File in Production
        window.loadFile(path.join(import.meta.dirname, "../dist/index.html"))
    }
})