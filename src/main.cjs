const { app, BrowserWindow, shell, ipcMain, BrowserView } = require("electron");

const fs = require("fs");
const path = require("path");

// const appLock = app.requestSingleInstanceLock();

let mainWindow;
let tabBarView;
let tabContentView;

const tabBarHeight = 36;

const customStyles = "html, body{width: 100%;height: 100%;overflow: hidden;}";

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

  mainWindow.loadFile("src/index.html");

  // Wait for the window to be ready
  mainWindow.once("ready-to-show", () => {
    // Create top BrowserView
    tabBarView = new BrowserView({
      webPreferences: {
        contextIsolation: true,
      },
    });
    mainWindow.addBrowserView(tabBarView);
    tabBarView.webContents.loadFile("src/components/tabbar.html");

    // Create bottom BrowserView
    tabContentView = new BrowserView({
      webPreferences: {
        contextIsolation: true,
      },
    });

    mainWindow.addBrowserView(tabContentView);
    tabContentView.webContents.loadURL("https://figma.com");
    // tabContentView.webContents.openDevTools();

    // Function to layout the views
    const resizeViews = () => {
      const [width, height] = mainWindow.getContentSize();
      const contentHeight = height - tabBarHeight;

      tabBarView.setBounds({ x: 0, y: 0, width: width, height: tabBarHeight });
      tabBarView.setAutoResize({ width: true });

      tabContentView.setBounds({
        x: 0,
        y: tabBarHeight,
        width: width,
        height: contentHeight,
      });
      tabContentView.setAutoResize({ width: true });
    };

    resizeViews();

    // recalculate layout when resized
    mainWindow.on("resize", resizeViews);
  });

  // open web links that try to navigate from figma.com to another url in the system browser
  tabContentView.webContents.on("will-navigate", (event, url) => {
    const allowedOrigin = "https://www.figma.com";

    if (!url.startsWith(allowedOrigin)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // handle creating tabs on navigating to new figma file
  tabContentView.webContents.on("did-navigate-in-page", (_, url) => {
    const tabbableUrls = ["slides", "board", "design", "buzz", "site"];

    console.log(`navigated in-page to ${url}`);

    if (tabbableUrls.some((sub) => url.includes(sub))) {
      // todo: show tabbar and add tab to opened files list
      console.log("creating tab...");
    }
  });

  const injectMyCSS = () => {
    tabContentView.webContents.insertCSS(customStyles);
  };

  tabContentView.webContents.on("did-frame-finish-load", injectMyCSS);
}

app.setName("Figma Desktop");

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (!mainWindow) createWindow();
  });

  ipcMain.on("load-url", (_, url) => {
    if (view && url) view.webContents.loadURL(url);
  });

  app.commandLine.appendSwitch("enable-gpu-rasterization", "true");
  app.commandLine.appendSwitch("enable-experimental-canvas-features", "true");
  app.commandLine.appendSwitch("use-vulkan", "true");
});

app.on("window-all-closed", () => {
  app.quit();
});
