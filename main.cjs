const { app, BrowserWindow, shell } = require("electron");

const path = require("path");

// const appLock = app.requestSingleInstanceLock();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: true,
    width: 1280,
    height: 800,
    useContentSize: true,
    autoHideMenuBar: true,
    title: "Figma Desktop",
    icon: path.join(__dirname, "public", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("https://www.figma.com");
  // todo: create list of tabs, if empty do not display tabbar
  // todo: add tabbar button functionality
  // todo: store open tabs and reopen on app open

  // inherit original window settings when creating popup
  mainWindow.webContents.setWindowOpenHandler((_) => {
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        icon: path.join(__dirname, "public", "icon.png"),
      },
    };
  });

  // open web links that try to navigate from figma.com to another url in the system browser
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedOrigin = "https://www.figma.com";

    if (!url.startsWith(allowedOrigin)) {
      event.preventDefault();
      if (url.startsWith("http://") || url.startsWith("https://"))
        shell.openExternal(url);
    }
  });

  // handle creating tabs on navigating to new figma file
  mainWindow.webContents.on("did-navigate-in-page", (_, url) => {
    const tabbableUrls = ["slides", "board", "design"];

    console.log(`navigated in-page to ${url}`);

    if (tabbableUrls.some((sub) => url.includes(sub))) {
      // todo: show tabbar and add tab to opened files list
      console.log("creating tab...");
    }
  });

  // mainWindow.webContents.openDevTools();
}

app.setName("Figma Desktop");

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (!mainWindow) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
