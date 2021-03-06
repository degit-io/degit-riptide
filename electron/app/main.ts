import {app, BrowserWindow} from "electron"
import {Config} from "./config"
import path from "path"
import {startServer} from "./server/start_server"
import {createRootDir} from "./server/utils"

// Electron display window
let win: BrowserWindow

// Initialize the Electron display window
const createWindow = () => {
  win = new BrowserWindow({
    width: Config.WINDOW_WIDTH,
    height: Config.WINDOW_HEIGHT,
    webPreferences: {
      nodeIntegration: false, // This has to be disabled to avoid security risk
      contextIsolation: true, // protect against prototype pollution
      preload: path.join(__dirname, "preload.js"),
    }
  })

  // TODO: In production, this has to be loading the index.html from the build folder
  win.loadURL(
    "http://localhost:3000"
  ).then(() => {
      win.show()

      // This is for showing the browser dev tool
      // TODO: In production, this has to be removed
      win.webContents.openDevTools()
    }
  )
}

app.whenReady().then(() => {
  createWindow()

  // Create the root directory ~/.degit in the user's home directory
  createRootDir()

  // Start server
  startServer().then()

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      startServer().then()
    }
  })
})

/**
 * Quit when all windows are closed, except on macOS. There, it's common
 * for applications and their menu bar to stay active until the user quits
 * explicitly with Cmd + Q.
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
