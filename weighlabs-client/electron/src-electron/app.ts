// Entry point of the electron app.
import { app, BrowserWindow } from 'electron'
import 'dotenv/config'
import 'node:path'
import path from 'node:path'

// set true before building for production
const isDev = false
const FRONTEND_URL = process.env.FRONTEND_URL

const window = new BrowserWindow({
    minHeight: 720,
    minWidth: 1280
})

app.on("ready", () => {

    if (isDev) {
        // Load URL for HMR during development
        window.loadURL(FRONTEND_URL!)
    } else {
        // LOAD Local File in Production
        window.loadFile(path.join(import.meta.dirname, "../dist/index.html"))
    }
    
})