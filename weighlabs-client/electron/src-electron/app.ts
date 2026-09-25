// Entry point of the electron app.
import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import 'dotenv/config'
import path from 'node:path'
import { initDb, listTests, getTest, createTest, updateTest, deleteTest, completeTest } from './db/main.ts'
import { startRustStream, stopRustStream, startNawiStream, stopNawiStream } from './nawi.ts'
import { exportReportPdf } from './pdf.ts'

// set true before building for production
const isDev = true
const FRONTEND_URL = process.env.FRONTEND_URL

app.on("ready", async () => {
    initDb().catch((err) => console.error('[db] failed to init database:', err))

    // Boot the rust-stream NAWI gRPC server child process
    startRustStream()

    const window = new BrowserWindow({
        minWidth: 1280,
        minHeight: 720,
        frame: false,
        autoHideMenuBar: true,
        icon: path.join(import.meta.dirname, "images", "icon.png"),
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

    // TESTS (persistent store)
    ipcMain.handle('tests:list', () => listTests())
    ipcMain.handle('tests:get', (_event, id: string) => getTest(id))
    ipcMain.handle('tests:create', (_event, input) => createTest(input))
    ipcMain.handle('tests:update', (_event, id: string, patch) => updateTest(id, patch))
    ipcMain.handle('tests:delete', (_event, id: string) => deleteTest(id))
    ipcMain.handle('tests:complete', (_event, input) => completeTest(input))

    // NAWI LIVE STREAM
    ipcMain.handle('nawi:start', (_event, config) => startNawiStream(config))
    ipcMain.handle('nawi:stop', () => stopNawiStream())

    // PDF REPORT EXPORT
    ipcMain.handle('report:export-pdf', (_event, input) => exportReportPdf(input))

    // THEME (dark / light / system)
    ipcMain.handle('theme:set', (_event, theme: 'system' | 'dark' | 'light') => {
        nativeTheme.themeSource = theme
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

app.on('will-quit', () => {
    stopNawiStream(false)
    stopRustStream()
})